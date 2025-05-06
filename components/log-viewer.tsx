"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X } from "lucide-react"
import { logger } from "@/lib/logger"
import "@/styles/logs.css"

interface LogViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogViewer({ open, onOpenChange }: LogViewerProps) {
  const [logLevel, setLogLevel] = useState<"all" | "debug" | "info" | "warn" | "error">("all")
  const [logs, setLogs] = useState<any[]>([])

  // Refresh logs whenever the dialog is opened
  useEffect(() => {
    if (open) {
      setLogs(logger.getLogs())
    }
  }, [open])

  const filteredLogs = logLevel === "all" ? logs : logs.filter((log) => log.level === logLevel)

  const handleDownload = () => {
    logger.info("LogViewer", "Downloading logs")
    logger.downloadLogs()
  }

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all logs?")) {
      logger.info("LogViewer", "Clearing logs")
      logger.clearLogs()
      setLogs([])
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const getLogEntryClass = (level: string) => {
    switch (level) {
      case "debug": return "log-entry-debug"
      case "info": return "log-entry-info"
      case "warn": return "log-entry-warn"
      case "error": return "log-entry-error"
      default: return ""
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogPortal forceMount>
        <DialogOverlay className="log-viewer-overlay" />
        <DialogContent className="log-viewer-content" onEscapeKeyDown={handleClose} onInteractOutside={handleClose}>
          <div className="log-viewer-header">
            <DialogTitle className="log-viewer-title">Application Logs</DialogTitle>
            <DialogDescription className="log-viewer-description">
              View and download application logs for debugging and monitoring
            </DialogDescription>
          </div>

          <div className="log-viewer-body">
            <Tabs defaultValue="all" className="log-tabs" onValueChange={(value) => setLogLevel(value as any)}>
              <TabsList className="log-tabs-list">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="debug">Debug</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="warn">Warning</TabsTrigger>
                <TabsTrigger value="error">Error</TabsTrigger>
              </TabsList>

              <TabsContent value={logLevel} className="log-tabs-content">
                <div className="log-container">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">No logs found for the selected level.</div>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <div key={index} className={`log-entry ${getLogEntryClass(log.level)}`}>
                        <span className="log-timestamp">[{log.timestamp}]</span>{" "}
                        <span className="log-component">[{log.component}]</span>{" "}
                        <span>{log.message}</span>
                        {log.data && (
                          <pre className="log-data">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="log-footer">
            <div className="log-count">{filteredLogs.length} log entries</div>
            <div className="log-actions">
              <Button variant="outline" onClick={handleClear}>
                Clear Logs
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                Download Logs
              </Button>
            </div>
          </div>

          <DialogClose className="absolute flex items-center right-4 top-4 p-2 rounded-full bg-secondary/80 text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200 shadow-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
