type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
}

class Logger {
  private static instance: Logger
  private logs: LogEntry[] = []
  private consoleEnabled = true
  private storageEnabled = true
  private maxLogs = 1000

  private constructor() {
    // Private constructor to enforce singleton pattern
    this.loadLogsFromStorage()
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private createLogEntry(level: LogLevel, component: string, message: string, data?: any): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      component,
      message,
      data: data ? this.sanitizeData(data) : undefined,
    }
  }

  private sanitizeData(data: any): any {
    // Deep clone the data to avoid modifying the original
    const cloned = JSON.parse(JSON.stringify(data))

    // Sanitize sensitive information if needed
    if (cloned.privateKey) cloned.privateKey = "[REDACTED]"
    if (cloned.mnemonic) cloned.mnemonic = "[REDACTED]"

    return cloned
  }

  private storeLog(entry: LogEntry): void {
    // Add to in-memory logs
    this.logs.push(entry)

    // Trim logs if they exceed the maximum
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(this.logs.length - this.maxLogs)
    }

    // Store in localStorage if enabled
    if (this.storageEnabled && typeof window !== "undefined") {
      try {
        localStorage.setItem("app_logs", JSON.stringify(this.logs))
      } catch (error) {
        // If localStorage fails, just log to console
        console.error("Failed to store logs in localStorage:", error)
      }
    }
  }

  private loadLogsFromStorage(): void {
    if (typeof window !== "undefined") {
      try {
        const storedLogs = localStorage.getItem("app_logs")
        if (storedLogs) {
          this.logs = JSON.parse(storedLogs)
        }
      } catch (error) {
        console.error("Failed to load logs from localStorage:", error)
      }
    }
  }

  public debug(component: string, message: string, data?: any): void {
    const entry = this.createLogEntry("debug", component, message, data)
    this.storeLog(entry)
    if (this.consoleEnabled) {
      console.debug(`[${entry.timestamp}] [${component}] ${message}`, data || "")
    }
  }

  public info(component: string, message: string, data?: any): void {
    const entry = this.createLogEntry("info", component, message, data)
    this.storeLog(entry)
    if (this.consoleEnabled) {
      console.info(`[${entry.timestamp}] [${component}] ${message}`, data || "")
    }
  }

  public warn(component: string, message: string, data?: any): void {
    const entry = this.createLogEntry("warn", component, message, data)
    this.storeLog(entry)
    if (this.consoleEnabled) {
      console.warn(`[${entry.timestamp}] [${component}] ${message}`, data || "")
    }
  }

  public error(component: string, message: string, data?: any): void {
    const entry = this.createLogEntry("error", component, message, data)
    this.storeLog(entry)
    if (this.consoleEnabled) {
      console.error(`[${entry.timestamp}] [${component}] ${message}`, data || "")
    }
  }

  public getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level)
    }
    return [...this.logs]
  }

  public clearLogs(): void {
    this.logs = []
    if (typeof window !== "undefined") {
      localStorage.removeItem("app_logs")
    }
  }

  public enableConsole(enabled: boolean): void {
    this.consoleEnabled = enabled
  }

  public enableStorage(enabled: boolean): void {
    this.storageEnabled = enabled
  }

  public setMaxLogs(max: number): void {
    this.maxLogs = max
  }

  public downloadLogs(): void {
    if (typeof window !== "undefined") {
      const logText = JSON.stringify(this.logs, null, 2)
      const blob = new Blob([logText], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `app-logs-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }
}

// Export a singleton instance
export const logger = Logger.getInstance()
