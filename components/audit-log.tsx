"use client"

import { useState, useEffect } from "react"
import type { ethers } from "ethers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, FileText, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"
import "@/styles/audit.css"

interface AuditEvent {
  id: number
  eventName: string
  testDataId: number
  testName: string
  actor: string
  timestamp: number
  transactionHash: string
}

interface AuditLogProps {
  contract: ethers.Contract | null
  onError: (message: string) => void
}

export function AuditLog({ contract, onError }: AuditLogProps) {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAuditLogs = async () => {
    logger.info("AuditLog", "Fetching audit logs initiated")

    if (!contract) {
      const errorMsg = "Contract not initialized. Please connect your wallet."
      logger.error("AuditLog", errorMsg)
      onError(errorMsg)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    logger.debug("AuditLog", "Setting loading state to true")

    try {
      // Get past events for TestDataAdded
      logger.debug("AuditLog", "Creating filter for TestDataAdded events")
      const filter = contract.filters.TestDataAdded()

      logger.debug("AuditLog", "Querying for TestDataAdded events")
      const events = await contract.queryFilter(filter)
      logger.info("AuditLog", "Events retrieved", { eventCount: events.length })

      // Format the events
      logger.debug("AuditLog", "Formatting events")
      const formattedEvents = await Promise.all(
        events.map(async (event, index) => {
          logger.debug("AuditLog", "Getting block for event", {
            eventIndex: index,
            transactionHash: event.transactionHash,
          })
          const block = await event.getBlock()
          
          // Handle different types for event.args.id (BigNumber or regular number)
          let testDataId = 0;
          if (typeof event.args.id === 'number') {
            testDataId = event.args.id;
          } else if (event.args.id && typeof event.args.id.toNumber === 'function') {
            testDataId = event.args.id.toNumber();
          } else {
            testDataId = Number(event.args.id);
          }

          return {
            id: index,
            eventName: "TestDataAdded",
            testDataId: testDataId,
            testName: event.args.testName,
            actor: event.args.submitter,
            timestamp: block.timestamp * 1000, // Convert to milliseconds
            transactionHash: event.transactionHash,
          }
        }),
      )

      // Sort by timestamp (newest first)
      formattedEvents.sort((a, b) => b.timestamp - a.timestamp)
      logger.debug("AuditLog", "Events sorted by timestamp")

      setAuditEvents(formattedEvents)
      logger.info("AuditLog", "Audit events state updated", { eventCount: formattedEvents.length })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error("AuditLog", "Error fetching audit logs", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      })
      console.error("Error fetching audit logs:", error)
      
      // More specific error message based on the type of error
      let userErrorMsg = "Failed to fetch audit logs from the blockchain.";
      
      if (errorMessage.includes("invalid chainId")) {
        userErrorMsg = "Network chain ID error. Please make sure you're connected to the correct network.";
      } else if (errorMessage.includes("contract not deployed")) {
        userErrorMsg = "Contract not found at the specified address. Please make sure the contract is deployed.";
      } else if (errorMessage.includes("toNumber is not a function")) {
        userErrorMsg = "Blockchain data format error. This has been automatically fixed, please try refreshing.";
      }
      
      onError(userErrorMsg);
    } finally {
      logger.debug("AuditLog", "Setting loading state to false")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
    logger.info("AuditLog", "Component mounted, initial audit logs fetch triggered")

    return () => {
      logger.info("AuditLog", "Component unmounting")
    }
  }, [contract])

  const handleRefresh = () => {
    logger.info("AuditLog", "Manual refresh triggered")
    fetchAuditLogs()
  }

  const getEventBadgeClass = (eventName: string) => {
    switch (eventName) {
      case "TestDataAdded":
        return "event-badge-add"
      case "TestDataAccessed":
        return "event-badge-access"
      case "TestDataModified":
        return "event-badge-modify"
      default:
        return ""
    }
  }

  if (isLoading) {
    logger.debug("AuditLog", "Rendering loading state")
    return (
      <div className="loading-container">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="audit-card">
            <CardContent className="audit-content">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="skeleton h-5 w-[200px]" />
                  <Skeleton className="skeleton h-4 w-[300px]" />
                </div>
                <Skeleton className="skeleton h-4 w-[120px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  logger.debug("AuditLog", "Rendering audit log list", { eventCount: auditEvents.length })
  return (
    <div className="audit-container">
      <div className="audit-header">
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          className="refresh-button"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {auditEvents.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="empty-text">No audit events found. Submit some test data to generate audit logs.</p>
          <Button 
            variant="outline" 
            onClick={() => document.querySelector('[value="submit"]')?.dispatchEvent(new Event('click', {bubbles: true}))}
            className="mt-2 text-sm"
          >
            Go to Submit Form
          </Button>
        </div>
      ) : (
        <div className="audit-list">
          {auditEvents.map((event) => (
            <Card key={event.id} className="audit-card">
              <CardContent className="audit-content">
                <div className="audit-header-row">
                  <div className="event-badge-container">
                    <Badge className={`event-badge ${getEventBadgeClass(event.eventName)}`}>
                      <svg className="event-badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {event.eventName}
                    </Badge>
                    <span className="event-id">Test ID: {event.testDataId}</span>
                  </div>
                  <span className="event-timestamp">{new Date(event.timestamp).toLocaleString()}</span>
                </div>

                <div className="event-details">
                  <div className="event-detail-item">
                    <FileText className="event-detail-icon" />
                    <span className="event-detail-text">{event.testName}</span>
                  </div>

                  <div className="event-detail-item">
                    <User className="event-detail-icon" />
                    <span className="actor-address" title={event.actor}>
                      {event.actor.substring(0, 6)}...{event.actor.substring(event.actor.length - 4)}
                    </span>
                  </div>
                </div>

                <div>
                  <a 
                    href={`https://etherscan.io/tx/${event.transactionHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="transaction-link"
                    title={event.transactionHash}
                  >
                    <svg className="event-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="tx-hash">
                      TX: {event.transactionHash.substring(0, 10)}...{event.transactionHash.substring(event.transactionHash.length - 6)}
                    </span>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
