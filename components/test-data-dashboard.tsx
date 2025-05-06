"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, FileText } from "lucide-react"
import { TestDataForm } from "@/components/test-data-form"
import { TestDataList } from "@/components/test-data-list"
import { AuditLog } from "@/components/audit-log"
import { ConnectWallet } from "@/components/connect-wallet"
import { LogViewer } from "@/components/log-viewer"
import TestDataManagerABI from "@/artifacts/contracts/TestDataManager.sol/TestDataManager.json";
import { logger } from "@/lib/logger"
import "@/styles/dashboard.css"

export function TestDataDashboard() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string>("")
  const [isConnected, setIsConnected] = useState(false)
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

  useEffect(() => {
    logger.info("TestDataDashboard", "Component mounted")

    const initializeEthers = async () => {
      logger.info("TestDataDashboard", "Initializing ethers")

      if (window.ethereum) {
        try {
          // Clear any previous errors
          setError(null)
          logger.debug("TestDataDashboard", "Ethereum detected, attempting to connect")

          // Check if MetaMask is locked
          const initialAccounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (initialAccounts.length === 0) {
            logger.info("TestDataDashboard", "MetaMask is locked or user has not connected any accounts");
            // We won't throw an error here, as the user can still click the connect button
            return;
          }

          // Create a new provider
          const web3Provider = new ethers.BrowserProvider(window.ethereum)
          setProvider(web3Provider)
          logger.debug("TestDataDashboard", "BrowserProvider created")

          // Get the chain ID
          const network = await web3Provider.getNetwork()
          const chainId = Number(network.chainId)
          logger.debug("TestDataDashboard", "Network detected", { chainId })

          // Get the contract address for the current chain ID
          const contractAddress = contractAddresses[chainId]
          if (!contractAddress) {
            logger.warn("TestDataDashboard", "Unsupported network", { chainId });
            setError(`Network with chain ID ${chainId} is not supported. Please connect to Hardhat local network.`);
            return;
          }

          // Get the signer
          const web3Signer = await web3Provider.getSigner()
          setSigner(web3Signer)
          logger.debug("TestDataDashboard", "Signer obtained")

          // Create contract instance
          logger.debug("TestDataDashboard", "Creating contract instance", { contractAddress })
          const testDataContract = new ethers.Contract(contractAddress, TestDataManagerABI.abi, web3Signer)
          setContract(testDataContract)
          logger.info("TestDataDashboard", "Contract instance created")

          // Get connected accounts
          logger.debug("TestDataDashboard", "Getting connected accounts")
          const connectedAccounts = await web3Provider.listAccounts()
          logger.debug("TestDataDashboard", "Accounts retrieved", { accountsCount: connectedAccounts.length })

          if (connectedAccounts.length > 0) {
            setAccount(await connectedAccounts[0].getAddress())
            setIsConnected(true)
            logger.info("TestDataDashboard", "User already connected", { account: await connectedAccounts[0].getAddress() })
          } else {
            logger.info("TestDataDashboard", "No accounts connected yet")
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error"
          logger.error("TestDataDashboard", "Failed to initialize ethers", {
            error: errorMessage,
            stack: err instanceof Error ? err.stack : undefined,
          })
          console.error("Failed to initialize ethers:", err)
          
          // Provide more specific error messages
          if (errorMessage.includes("network changed")) {
            setError("Network change detected. Please refresh the page.");
          } else if (errorMessage.includes("user rejected")) {
            setError("Connection request was rejected. Please approve the connection in MetaMask.");
          } else if (errorMessage.includes("already processing")) {
            setError("Another request is already being processed. Please wait and try again.");
          } else {
            setError("Failed to connect to blockchain. Please make sure MetaMask is installed and connected.");
          }
        }
      } else {
        logger.warn("TestDataDashboard", "Ethereum wallet not detected")
        setError("Ethereum wallet not detected. Please install MetaMask.");
      }
    }

    initializeEthers()

    // Cleanup function
    return () => {
      logger.info("TestDataDashboard", "Component unmounting")
    }
  }, [])

  const handleConnect = async (
    connectedAccount: string,
    connectedProvider: ethers.BrowserProvider,
    connectedSigner: ethers.Signer,
  ) => {
    logger.info("TestDataDashboard", "Handling wallet connection", { account: connectedAccount })

    setAccount(connectedAccount)
    setProvider(connectedProvider)
    setSigner(connectedSigner)
    setIsConnected(true)

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
      </div>

      {!isConnected ? (
        <Card className="card-dashed">
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
            <TabsTrigger value="submit">Submit Test Data</TabsTrigger>
            <TabsTrigger value="view">View Test Data</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
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
                  account={account}
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
              <CardHeader className="card-header-compact">
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
