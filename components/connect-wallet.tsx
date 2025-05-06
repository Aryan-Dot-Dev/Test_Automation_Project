"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { logger } from "@/lib/logger"

interface ConnectWalletProps {
  onConnect: (account: string, provider: ethers.BrowserProvider, signer: ethers.Signer) => void
}

export function ConnectWallet({ onConnect }: ConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async () => {
    logger.info("ConnectWallet", "Wallet connection initiated")

    if (!window.ethereum) {
      const errorMsg = "MetaMask not detected. Please install MetaMask to use this application"
      logger.error("ConnectWallet", errorMsg)
      alert(errorMsg)
      return
    }

    setIsConnecting(true)
    logger.debug("ConnectWallet", "Setting connecting state to true")

    try {
      // Define supported networks for this application
      const supportedNetworks = [
        { chainId: "0x7a69", name: "Hardhat Local (31337)" }, // 31337
        { chainId: "0x13d49", name: "Custom Hardhat (81337)" }, // 81337
      ];
      
      // Try to switch to a supported network
      let currentChainId: string;
      try {
        currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        const isSupported = supportedNetworks.some(network => network.chainId === currentChainId);
        
        if (!isSupported) {
          // Try to switch to Hardhat local network
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x7a69" }], // 31337 in hex
            });
            logger.info("ConnectWallet", "Switched to Hardhat network");
          } catch (error) {
            const switchError = error as ErrorWithCode;
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: "0x7a69",
                      chainName: "Hardhat Local",
                      nativeCurrency: {
                        name: "Ethereum",
                        symbol: "ETH",
                        decimals: 18,
                      },
                      rpcUrls: ["http://127.0.0.1:8545"],
                    },
                  ],
                });
                logger.info("ConnectWallet", "Added and switched to Hardhat network");
              } catch (error) {
                const addError = error as Error;
                logger.error("ConnectWallet", "Error adding chain", { error: addError.message });
                throw new Error(`Could not add Hardhat network to MetaMask: ${addError.message}`);
              }
            } else {
              logger.error("ConnectWallet", "Error switching chain", { error: switchError.message });
              throw new Error(`Could not switch to Hardhat network: ${switchError.message}`);
            }
          }
        }
      } catch (error) {
        const chainError = error as Error;
        logger.error("ConnectWallet", "Error checking/switching chain", { error: chainError.message });
        // Continue with connection attempt even if chain switching fails
        console.error("Chain switching error:", chainError);
      }

      logger.info("ConnectWallet", "Requesting Ethereum accounts")
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      logger.info("ConnectWallet", "Accounts received", { accountsCount: accounts.length })

      // Create ethers provider and signer
      logger.debug("ConnectWallet", "Creating BrowserProvider")
      const provider = new ethers.BrowserProvider(window.ethereum)

      logger.debug("ConnectWallet", "Getting signer")
      const signer = await provider.getSigner()

      logger.debug("ConnectWallet", "Getting signer address")
      const account = await signer.getAddress()
      
      const network = await provider.getNetwork();
      logger.info("ConnectWallet", "Wallet connected successfully", {
        account: account,
        chainId: network.chainId,
        chainName: network.name
      })

      onConnect(account, provider, signer)
    } catch (error) {
      const typedError = error as Error;
      const errorMessage = typedError.message || "Unknown error occurred";
      logger.error("ConnectWallet", "Error connecting wallet", {
        error: errorMessage,
        stack: typedError.stack,
      })
      console.error("Error connecting wallet:", error)
      
      // Show a more specific error message
      let userMessage = "Failed to connect wallet.";
      if (errorMessage.includes("user rejected")) {
        userMessage = "Connection rejected. Please approve the connection request in MetaMask.";
      } else if (errorMessage.includes("already processing")) {
        userMessage = "MetaMask is busy processing another request. Please try again in a moment.";
      } else if (errorMessage.includes("chain")) {
        userMessage = "Network connection issue. Make sure the Hardhat local network is running.";
      }
      
      alert(userMessage + " See console for details.");
    } finally {
      logger.debug("ConnectWallet", "Setting connecting state to false")
      setIsConnecting(false)
    }
  }

  return (
    <div className="wallet-connect-container">
      <div className="wallet-icon-container">
        <Wallet className="wallet-icon" />
      </div>
      <div className="wallet-text-container">
        <h3 className="wallet-heading">Connect Your Wallet</h3>
        <p className="wallet-description">
          Connect your Ethereum wallet to interact with the blockchain-based test data management system.
        </p>
      </div>
      <Button 
        onClick={connectWallet} 
        disabled={isConnecting} 
        className="wallet-connect-button"
      >
        {isConnecting ? (
          <div className="button-content">
            <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
          </div>
        ) : (
          <div className="button-content">
            <Wallet className="button-icon" />
            Connect Wallet
          </div>
        )}
      </Button>
    </div>
  )
}
