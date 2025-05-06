"use client"

import { useState, useEffect } from "react"
import { Wallet } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

export interface HeaderProps {
  walletAddress?: string
}

export default function Header({ walletAddress }: HeaderProps) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  // Add scroll effect for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className={`dashboard-header fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm transition-all ${scrolled ? "shadow-md" : ""}`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold">
            Blockchain Test Management
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {walletAddress ? (
            <div className="wallet-display">
              <Wallet className="h-4 w-4" />
              <span className="wallet-address full">
                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </span>
              <span className="wallet-address short">
                {walletAddress.substring(0, 4)}...
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}