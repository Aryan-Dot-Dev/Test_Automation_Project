"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, FileText, LogOut } from "lucide-react"
import { TestDataForm } from "@/components/test-data-form"
import { TestDataList } from "@/components/test-data-list"
import { AuditLog } from "@/components/audit-log"
import { ConnectWallet } from "@/components/connect-wallet"
import { LogViewer } from "@/components/log-viewer"
import TestDataManagerABI from "@/artifacts/contracts/TestDataManager.sol/TestDataManager.json"
import { logger } from "@/lib/logger"
import { useWallet } from "@/hooks/use-wallet"
import "@/styles/dashboard.css"

export function TestDataDashboard() {
  const { address, provider, signer, isConnected, disconnect } = useWallet()
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showLogs, setShowLogs] = useState(false)

  // Contract addresses for different networks
  const contractAddresses: { [chainId: number]: string } = {
    1: "", // Mainnet (not deployed)
    5: "", // Goerli (not deployed)
    31337: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Hardhat standard
    81337: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"  // Custom Hardhat chainId
  };

  const handleConnect = async (
    connectedAccount: string,
    connectedProvider: ethers.BrowserProvider,
    connectedSigner: ethers.Signer,
  ) => {
    logger.info("TestDataDashboard", "Handling wallet connection", { account: connectedAccount })

    try {
      // Get the chain ID
      const network = await connectedProvider.getNetwork()
      const chainId = Number(network.chainId)
      logger.debug("TestDataDashboard", "Network detected after wallet connection", { chainId })

      // Get the contract address for the current chain ID
      const contractAddress = contractAddresses[chainId]
      if (!contractAddress) {
        setError(`Unsupported network with chain ID: ${chainId}`)
        return
      }

      // Create contract instance
      logger.debug("TestDataDashboard", "Creating contract instance after wallet connection", { contractAddress })
      const testDataContract = new ethers.Contract(contractAddress, TestDataManagerABI.abi, connectedSigner)
      setContract(testDataContract)
      logger.info("TestDataDashboard", "Contract instance created after wallet connection")

      setSuccess("Wallet connected successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      logger.error("TestDataDashboard", "Error setting up contract", { error: errorMessage })
      setError("Error initializing the smart contract. Please try again.")
    }
  }

  const handleLogout = () => {
    logger.info("TestDataDashboard", "User logout initiated")
    disconnect()
    setContract(null)
    setSuccess("Logged out successfully")
    setTimeout(() => setSuccess(null), 3000)
  }

  const clearMessages = () => {
    logger.debug("TestDataDashboard", "Clearing notification messages")
    setError(null)
    setSuccess(null)
  }

  const toggleLogs = () => {
    logger.debug("TestDataDashboard", "Toggling log viewer", { currentState: showLogs })
    setShowLogs(!showLogs)
  }

  return (
    <div className="dashboard-container">
      {error && (
        <Alert variant="destructive" className="alert-animation">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="ghost" size="sm" className="alert-dismiss-btn" onClick={clearMessages}>
            Dismiss
          </Button>
        </Alert>
      )}

      {success && (
        <Alert className="alert-success alert-animation">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
          <Button variant="ghost" size="sm" className="alert-dismiss-btn" onClick={clearMessages}>
            Dismiss
          </Button>
        </Alert>
      )}

      <div className="log-toggle-container">
        <Button variant="outline" size="sm" onClick={toggleLogs} className="btn-with-icon">
          <FileText className="h-4 w-4" />
          View Logs
        </Button>
        
        {isConnected && (
          <Button variant="outline" size="sm" onClick={handleLogout} className="btn-with-icon ml-2 logout">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        )}
      </div>

      {!isConnected ? (
        <Card className="card-dashed notConnected ">
          <CardHeader>
            <CardTitle className="text-xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your Ethereum wallet to interact with the blockchain-based test data management system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="connect-wallet-container">
              <ConnectWallet onConnect={handleConnect} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="tabs-three">
            <TabsTrigger className="submit-test-data" value="submit">Submit Test Data</TabsTrigger>
            <TabsTrigger className="view-test-data" value="view">View Test Data</TabsTrigger>
            <TabsTrigger className="audit-logs" value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="tab-content-panel">
            <Card className="card-borderless">
              <CardHeader className="card-header-compact">
                <CardTitle>Submit Test Data</CardTitle>
                <CardDescription>Store test execution logs securely on the blockchain</CardDescription>
              </CardHeader>
              <CardContent className="card-content-compact">
                <TestDataForm
                  contract={contract}
                  account={address || ""}
                  onSuccess={(message) => {
                    logger.info("TestDataDashboard", "Test data submission successful", { message })
                    setSuccess(message)
                    setTimeout(() => setSuccess(null), 3000)
                  }}
                  onError={(message) => {
                    logger.error("TestDataDashboard", "Test data submission error", { message })
                    setError(message)
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="view" className="tab-content-panel">
            <Card className="card-borderless">
              <CardHeader className="card-header-compact view-test-data-header">
                <CardTitle>View Test Data</CardTitle>
                <CardDescription>Retrieve and verify test data stored on the blockchain</CardDescription>
              </CardHeader>
              <CardContent className="card-content-compact">
                <TestDataList
                  contract={contract}
                  onError={(message) => {
                    logger.error("TestDataDashboard", "Test data retrieval error", { message })
                    setError(message)
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="tab-content-panel">
            <Card className="card-borderless">
              <CardHeader className="card-header-compact">
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>View immutable audit trail of all test data operations</CardDescription>
              </CardHeader>
              <CardContent className="card-content-compact">
                <AuditLog
                  contract={contract}
                  onError={(message) => {
                    logger.error("TestDataDashboard", "Audit log retrieval error", { message })
                    setError(message)
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <LogViewer open={showLogs} onOpenChange={setShowLogs} />
    </div>
  )
}
