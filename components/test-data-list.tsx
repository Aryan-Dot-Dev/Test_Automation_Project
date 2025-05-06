"use client"

import { useState, useEffect } from "react"
import type React from "react"
import type { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TestDataDetails } from "@/components/test-data-details"
import { logger } from "@/lib/logger"
import "@/styles/list.css"

interface TestData {
  id: number
  testName: string
  testType: string
  passed: boolean
  timestamp: number
  data: string
  submitter: string
}

interface TestDataListProps {
  contract: ethers.Contract | null
  onError: (message: string) => void
}

export function TestDataList({ contract, onError }: TestDataListProps) {
  const [testDataList, setTestDataList] = useState<TestData[]>([])
  const [filteredList, setFilteredList] = useState<TestData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTestData, setSelectedTestData] = useState<TestData | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const fetchTestData = async () => {
    logger.info("TestDataList", "Fetching test data initiated")

    if (!contract) {
      const errorMsg = "Contract not initialized. Please connect your wallet."
      logger.error("TestDataList", errorMsg)
      onError(errorMsg)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    logger.debug("TestDataList", "Setting loading state to true")

    try {
      // Get the total count of test data entries
      logger.debug("TestDataList", "Getting test data count from contract")
      const count = await contract.getTestDataCount()
      
      // Handle both BigNumber and regular number cases
      let totalCount = 0;
      if (typeof count === 'number') {
        totalCount = count;
      } else if (count && typeof count.toNumber === 'function') {
        totalCount = count.toNumber();
      } else {
        // Handle case where count might be returned as a string or other format
        totalCount = Number(count);
      }
      
      logger.info("TestDataList", "Test data count retrieved", { totalCount })

      // Fetch all test data entries
      logger.debug("TestDataList", "Preparing to fetch all test data entries", { totalCount })
      const testDataPromises = []
      for (let i = 0; i < totalCount; i++) {
        testDataPromises.push(contract.getTestData(i))
      }

      logger.debug("TestDataList", "Executing all test data fetch promises")
      const testDataResults = await Promise.all(testDataPromises)
      logger.info("TestDataList", "All test data entries retrieved", { count: testDataResults.length })

      // Format the test data
      logger.debug("TestDataList", "Formatting test data")
      const formattedTestData = testDataResults.map((data, index) => ({
        id: index,
        testName: data.testName,
        testType: data.testType,
        passed: data.passed,
        // Handle both BigNumber and regular number cases for timestamp
        timestamp: (typeof data.timestamp === 'number') 
          ? data.timestamp * 1000
          : (typeof data.timestamp?.toNumber === 'function') 
            ? data.timestamp.toNumber() * 1000
            : Number(data.timestamp) * 1000, // Convert to milliseconds
        data: data.data,
        submitter: data.submitter,
      }))

      // Sort by timestamp (newest first)
      formattedTestData.sort((a, b) => b.timestamp - a.timestamp)
      logger.debug("TestDataList", "Test data sorted by timestamp")

      setTestDataList(formattedTestData)
      setFilteredList(formattedTestData)
      logger.info("TestDataList", "Test data state updated", { itemCount: formattedTestData.length })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error("TestDataList", "Error fetching test data", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      })
      console.error("Error fetching test data:", error)
      
      // More specific error message based on the type of error
      let userErrorMsg = "Failed to fetch test data from the blockchain.";
      
      if (errorMessage.includes("invalid chainId")) {
        userErrorMsg = "Network chain ID error. Please make sure you're connected to the correct network (Hardhat local network).";
      } else if (errorMessage.includes("contract not deployed")) {
        userErrorMsg = "Contract not found at the specified address. Please make sure the contract is deployed.";
      } else if (errorMessage.includes("user rejected")) {
        userErrorMsg = "Transaction was rejected in your wallet.";
      } else if (errorMessage.includes("toNumber is not a function")) {
        userErrorMsg = "Blockchain data format error. This has been automatically fixed, please try refreshing.";
      }
      
      onError(userErrorMsg);
    } finally {
      logger.debug("TestDataList", "Setting loading state to false")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTestData()
    logger.info("TestDataList", "Component mounted, initial data fetch triggered")

    return () => {
      logger.info("TestDataList", "Component unmounting")
    }
  }, [contract])

  useEffect(() => {
    logger.debug("TestDataList", "Search term changed, filtering data", { searchTerm })
    if (searchTerm.trim() === "") {
      setFilteredList(testDataList)
    } else {
      const filtered = testDataList.filter(
        (item) =>
          item.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.data.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      logger.debug("TestDataList", "Data filtered by search term", {
        originalCount: testDataList.length,
        filteredCount: filtered.length,
      })
      setFilteredList(filtered)
    }
  }, [searchTerm, testDataList])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    logger.debug("TestDataList", "Search input changed", { value: e.target.value })
    setSearchTerm(e.target.value)
  }

  const handleRefresh = () => {
    logger.info("TestDataList", "Manual refresh triggered")
    fetchTestData()
  }

  const viewTestDetails = (testData: TestData) => {
    logger.info("TestDataList", "Viewing test details", { testId: testData.id, testName: testData.testName })
    setSelectedTestData(testData)
    setShowDetails(true)
  }

  const closeDetails = () => {
    logger.debug("TestDataList", "Closing test details view")
    setShowDetails(false)
    setSelectedTestData(null)
  }

  const getTestTypeLabel = (type: string) => {
    switch (type) {
      case "ui":
        return "UI Test"
      case "api":
        return "API Test"
      case "integration":
        return "Integration Test"
      case "performance":
        return "Performance Test"
      case "security":
        return "Security Test"
      default:
        return type
    }
  }

  if (isLoading) {
    logger.debug("TestDataList", "Rendering loading state")
    return (
      <div className="data-loading">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="data-card">
            <CardContent className="card-content">
              <div className="card-layout">
                <div className="card-info">
                  <Skeleton className="skeleton h-5 w-[250px]" />
                  <Skeleton className="skeleton h-4 w-[200px]" />
                </div>
                <Skeleton className="skeleton h-9 w-[100px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  logger.debug("TestDataList", "Rendering test data list", { itemCount: filteredList.length })
  return (
    <div className="data-list-container">
      <div className="data-list-header">
        <div className="search-container">
          <Search className="search-icon" />
          <Input
            type="search"
            placeholder="Search test data..."
            className="search-input"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          className="refresh-button"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {filteredList.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="empty-text">No test data found. Submit some test data to see it here.</p>
          <Button 
            variant="outline" 
            onClick={() => document.querySelector('[value="submit"]')?.dispatchEvent(new Event('click', {bubbles: true}))}
            className="mt-2 text-sm"
          >
            Go to Submit Form
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((testData) => (
            <Card key={testData.id} className="data-card">
              <CardContent className="card-content">
                <div className="card-layout">
                  <div className="card-info">
                    <h3 className="card-title">{testData.testName}</h3>
                    <div className="card-meta">
                      <Badge variant="outline" className="badge badge-type">
                        {getTestTypeLabel(testData.testType)}
                      </Badge>
                      <Badge 
                        variant={testData.passed ? "success" : "destructive"}
                        className={`badge ${testData.passed ? "badge-success" : "badge-error"}`}
                      >
                        {testData.passed ? "Passed" : "Failed"}
                      </Badge>
                      <span className="timestamp">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(testData.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => viewTestDetails(testData)} 
                    className="view-button"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showDetails && selectedTestData && <TestDataDetails testData={selectedTestData} onClose={closeDetails} />}
    </div>
  )
}
