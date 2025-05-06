"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogPortal,
  DialogOverlay
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, Clock, User, FileText, Hash, Download, ExternalLink } from "lucide-react"
import { logger } from "@/lib/logger"
import { getIPFSUrl, getAlternativeIPFSUrl } from "@/lib/pinata"
import "@/styles/details.css"

interface TestData {
  id: number
  testName: string
  testType: string
  passed: boolean
  timestamp: number
  data: string
  submitter: string
}

interface IPFSFile {
  cid: string
  name: string
  size: number
  url: string
}

interface TestDataDetailsProps {
  testData: TestData
  onClose: () => void
}

export function TestDataDetails({ testData, onClose }: TestDataDetailsProps) {
  const [open, setOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("details")
  const [gatewayIndex, setGatewayIndex] = useState(0)

  // Try next gateway if iframe fails to load
  const handleIframeError = () => {
    logger.warn("TestDataDetails", "IPFS gateway failed, trying next gateway")
    setGatewayIndex(prev => prev + 1)
  }

  const handleClose = () => {
    logger.debug("TestDataDetails", "Dialog close triggered")
    setOpen(false)
    onClose()
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

  // Parse the JSON data if possible
  let parsedData: any = null
  let ipfsFile: IPFSFile | null = null
  
  try {
    logger.debug("TestDataDetails", "Attempting to parse test data JSON")
    parsedData = JSON.parse(testData.data)
    
    // Check if there's an IPFS file in the data
    if (parsedData && parsedData.ipfsFile) {
      ipfsFile = parsedData.ipfsFile as IPFSFile
      logger.debug("TestDataDetails", "Found IPFS file in test data", {
        fileName: ipfsFile.name,
        cid: ipfsFile.cid
      })
    }
    
    logger.debug("TestDataDetails", "Test data JSON parsed successfully")
  } catch (e) {
    logger.warn("TestDataDetails", "Failed to parse test data JSON", {
      error: e instanceof Error ? e.message : "Unknown error",
    })
    // If parsing fails, we'll just display the raw data
  }

  const handleFileView = () => {
    if (!ipfsFile) return
    
    // Open the IPFS file in a new tab using alternative gateway
    const alternativeUrl = getAlternativeIPFSUrl(ipfsFile.cid, gatewayIndex)
    window.open(alternativeUrl, '_blank')
    logger.info("TestDataDetails", "Opening IPFS file in new tab", {
      url: alternativeUrl,
      fileName: ipfsFile.name
    })
  }

  const handleFileDownload = () => {
    if (!ipfsFile) return
    
    // Create a temporary anchor element to trigger download
    const a = document.createElement('a')
    // Use alternative gateway
    a.href = getAlternativeIPFSUrl(ipfsFile.cid, gatewayIndex)
    a.download = ipfsFile.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    logger.info("TestDataDetails", "Downloading IPFS file", {
      url: getAlternativeIPFSUrl(ipfsFile.cid, gatewayIndex),
      fileName: ipfsFile.name
    })
  }

  logger.debug("TestDataDetails", "Rendering test data details", {
    testId: testData.id,
    testName: testData.testName,
  })

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) onClose();
    }}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <DialogContent className="details-dialog-content data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <DialogHeader className="details-header">
            <DialogTitle className="details-title">
              {testData.testName}
              <Badge 
                variant={testData.passed ? "success" : "destructive"} 
                className={`details-badge ${testData.passed ? "details-badge-success" : "details-badge-error"}`}
              >
                {testData.passed ? "Passed" : "Failed"}
              </Badge>
            </DialogTitle>
            <DialogDescription className="details-description">
              <Hash className="h-4 w-4" />
              <span className="font-medium">Test ID:</span> {testData.id} • {getTestTypeLabel(testData.testType)}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                {ipfsFile && (
                  <TabsTrigger value="file">File</TabsTrigger>
                )}
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <div className="details-info-grid">
                  <div className="details-info-card">
                    <h3 className="details-info-title">Test Information</h3>
                    
                    <div className="details-info-row">
                      <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                      <div className="details-info-item">
                        <span className="details-info-label">Timestamp:</span>
                        <span className="details-info-value">{new Date(testData.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="details-info-row">
                      <User className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                      <div className="details-info-item">
                        <span className="details-info-label">Submitter:</span>
                        <span className="details-address" title={testData.submitter}>
                          {testData.submitter.substring(0, 6)}...{testData.submitter.substring(testData.submitter.length - 4)}
                        </span>
                      </div>
                    </div>

                    <div className="details-info-row">
                      <Hash className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                      <div className="details-info-item">
                        <span className="details-info-label">Test Type:</span>
                        <span className="details-info-value">{getTestTypeLabel(testData.testType)}</span>
                      </div>
                    </div>

                    <div className="details-info-row">
                      {testData.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      <div className="details-info-item">
                        <span className="details-info-label">Result:</span>
                        <span className={testData.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          {testData.passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="details-info-card">
                    <h3 className="details-info-title">Additional Data</h3>
                    
                    {parsedData && parsedData.executionTime && (
                      <div className="details-info-row">
                        <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        <div className="details-info-item">
                          <span className="details-info-label">Execution Time:</span>
                          <span className="details-info-value">{parsedData.executionTime} ms</span>
                        </div>
                      </div>
                    )}

                    {/* Display IPFS file information if available */}
                    {ipfsFile && (
                      <div className="details-info-row">
                        <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        <div className="details-info-item">
                          <span className="details-info-label">File:</span>
                          <div className="details-ipfs-file">
                            <span className="details-file-name">{ipfsFile.name}</span>
                            <span className="details-file-size">({(ipfsFile.size / 1024).toFixed(2)} KB)</span>
                            <div className="details-file-actions">
                              <Button 
                                onClick={() => setActiveTab("file")} 
                                variant="ghost" 
                                size="sm" 
                                className="details-file-button"
                              >
                                <FileText className="h-3.5 w-3.5 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Display other parsed data fields */}
                    {parsedData && Object.entries(parsedData).map(([key, value]) => {
                      // Skip fields we've already displayed or that are too large
                      if (["testName", "testType", "testResult", "executionTime", "testData", "ipfsFile"].includes(key)) {
                        return null
                      }

                      return (
                        <div key={key} className="details-info-row">
                          <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          <div className="details-info-item">
                            <span className="details-info-label">{key}:</span>
                            <span className="details-info-value truncate">{String(value)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {parsedData && parsedData.testData && (
                  <div className="details-log-container">
                    <h4 className="details-log-title">Test Data / Logs:</h4>
                    <div className="details-pre-container">
                      <pre className="details-pre">{parsedData.testData}</pre>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* File viewer tab */}
              {ipfsFile && (
                <TabsContent value="file" className="space-y-6">
                  <div className="details-file-viewer">
                    <div className="details-file-header">
                      <div className="details-file-info">
                        <FileText className="details-file-icon" />
                        <div>
                          <h4 className="details-file-title">{ipfsFile.name}</h4>
                          <p className="details-file-metadata">
                            <span className="details-file-size">Size: {(ipfsFile.size / 1024).toFixed(2)} KB</span>
                            <span className="details-file-cid">CID: {ipfsFile.cid.substring(0, 8)}...{ipfsFile.cid.substring(ipfsFile.cid.length - 6)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="details-file-actions">
                        <Button onClick={handleFileDownload} variant="outline" size="sm" className="details-file-action-button">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button onClick={handleFileView} variant="outline" size="sm" className="details-file-action-button">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open in Browser
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-8 text-center bg-muted rounded-md">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Click "Open in Browser" to view this file</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Files are stored on IPFS and will open in a new browser tab for better compatibility and viewing experience.
                      </p>
                      <Button onClick={handleFileView} className="mt-4">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open File in Browser
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              )}

              <TabsContent value="raw">
                <div className="details-pre-container" style={{ maxHeight: "500px" }}>
                  <pre className="details-pre">{JSON.stringify(JSON.parse(testData.data), null, 2)}</pre>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="details-footer">
            <Button 
              onClick={handleClose}
              className="details-button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
