"use client"

import { useWallet } from "@/hooks/use-wallet"
import Header from "./header"

export default function HeaderContent() {
  const { address } = useWallet()
  
  return <Header walletAddress={address || undefined} />
}