"use client"

import React, { createContext, useState, useContext, ReactNode } from "react"
import { ethers } from "ethers"

interface WalletContextType {
  address: string | null
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  isConnected: boolean
  setWalletInfo: (address: string, provider: ethers.BrowserProvider, signer: ethers.Signer) => void
  clearWalletInfo: () => void
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const setWalletInfo = (
    address: string, 
    provider: ethers.BrowserProvider, 
    signer: ethers.Signer
  ) => {
    setAddress(address)
    setProvider(provider)
    setSigner(signer)
    setIsConnected(true)
  }

  const clearWalletInfo = () => {
    setAddress(null)
    setProvider(null)
    setSigner(null)
    setIsConnected(false)
  }
  
  const disconnect = async () => {
    // Clear the wallet info from our state
    clearWalletInfo()
    
    // Add localStorage cleanup if needed
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletConnected')
    }
  }

  return (
    <WalletContext.Provider 
      value={{ 
        address, 
        provider, 
        signer, 
        isConnected, 
        setWalletInfo, 
        clearWalletInfo,
        disconnect 
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  
  return context
}