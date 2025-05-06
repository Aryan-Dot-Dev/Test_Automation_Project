"use client"

import { useState, useRef } from "react"
import type { ethers } from "ethers"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react"
import { logger } from "@/lib/logger"
import { uploadToPinata, IPFSFile } from "@/lib/pinata"
import "@/styles/form.css"

// Modified schema to handle file uploads instead of text data
const testDataSchema = z.object({
  testName: z.string().min(3, { message: "Test name must be at least 3 characters" }),
  testType: z.string().min(1, { message: "Please select a test type" }),
  testResult: z.string().min(1, { message: "Please select a test result" }),
  executionTime: z.string().min(1, { message: "Execution time is required" }),
  // Make testData optional since we're now using file uploads
  testData: z.string().optional(),
})

interface TestDataFormProps {
  contract: ethers.Contract | null
  account: string
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function TestDataForm({ contract, account, onSuccess, onError }: TestDataFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadedFileData, setUploadedFileData] = useState<IPFSFile | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof testDataSchema>>({
    resolver: zodResolver(testDataSchema),
    defaultValues: {
      testName: "",
      testType: "",
      testResult: "",
      executionTime: "",
      testData: "",
    },
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      setUploadedFile(file)
      setUploadError(null)
      // Clear any previously uploaded file data
      setUploadedFileData(null)
      logger.info("TestDataForm", "File selected", { fileName: file.name, fileSize: file.size })
    }
  }

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      setUploadedFile(file)
      setUploadError(null)
      // Clear any previously uploaded file data
      setUploadedFileData(null)
      logger.info("TestDataForm", "File dropped", { fileName: file.name, fileSize: file.size })
    }
  }
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      setUploadError("Please select a file to upload")
      return
    }

    try {
      setIsSubmitting(true)
      setUploadProgress(10)
      logger.info("TestDataForm", "Starting file upload to IPFS", { fileName: uploadedFile.name })
      
      // Upload to IPFS via Pinata
      setUploadProgress(30)
      const fileData = await uploadToPinata(uploadedFile)
      setUploadProgress(90)
      
      setUploadedFileData(fileData)
      setUploadProgress(100)
      logger.info("TestDataForm", "File successfully uploaded to IPFS", { 
        fileName: fileData.name, 
        cid: fileData.cid,
        url: fileData.url
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setUploadError(errorMessage)
      logger.error("TestDataForm", "Error uploading file", { error: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setUploadedFileData(null)
    setUploadError(null)
    setUploadProgress(0)
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function onSubmit(values: z.infer<typeof testDataSchema>) {
    logger.info("TestDataForm", "Form submission initiated", {
      testName: values.testName,
      testType: values.testType,
      testResult: values.testResult,
    })

    if (!contract) {
      const errorMsg = "Contract not initialized. Please connect your wallet."
      logger.error("TestDataForm", errorMsg)
      onError(errorMsg)
      return
    }

    // Check if we have an uploaded file
    if (!uploadedFileData) {
      const errorMsg = "Please upload a file before submitting"
      logger.error("TestDataForm", errorMsg)
      onError(errorMsg)
      return
    }

    setIsSubmitting(true)
    logger.debug("TestDataForm", "Setting submitting state to true")

    try {
      // Create a JSON string of the test data including the IPFS file info
      const testDataJson = JSON.stringify({
        testName: values.testName,
        testType: values.testType,
        testResult: values.testResult,
        executionTime: values.executionTime,
        ipfsFile: uploadedFileData,
        timestamp: new Date().toISOString(),
      })

      logger.debug("TestDataForm", "Test data JSON created", {
        jsonLength: testDataJson.length,
      })

      // Call the smart contract to store the test data
      logger.info("TestDataForm", "Calling smart contract addTestData method", {
        testName: values.testName,
        testType: values.testType,
        passed: values.testResult === "pass",
      })

      const tx = await contract.addTestData(
        values.testName,
        values.testType,
        values.testResult === "pass",
        testDataJson,
      )

      logger.info("TestDataForm", "Transaction sent", {
        transactionHash: tx.hash,
      })

      // Wait for the transaction to be mined with a timeout
      logger.debug("TestDataForm", "Waiting for transaction confirmation")
      
      // Create a promise that resolves after the timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Transaction confirmation timeout after 60 seconds"));
        }, 60000); // 60 seconds timeout
      });
      
      // Race between transaction confirmation and timeout
      const receipt = await Promise.race([
        tx.wait(),
        timeoutPromise
      ]);
      
      logger.info("TestDataForm", "Transaction confirmed", {
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      })

      // Reset the form and file upload state
      form.reset()
      removeFile()
      logger.debug("TestDataForm", "Form reset")

      const successMsg = "Test data and file successfully stored on the blockchain!"
      logger.info("TestDataForm", successMsg, {
        transactionHash: tx.hash,
      })
      onSuccess(successMsg)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.error("TestDataForm", "Error submitting test data", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      })
      console.error("Error submitting test data:", error)
      
      // More descriptive error message based on the error
      let userErrorMsg = "Failed to store test data on the blockchain.";
      
      if (errorMessage.includes("timeout")) {
        userErrorMsg = "Transaction is taking too long to confirm. It might still complete in the background.";
      } else if (errorMessage.includes("user rejected")) {
        userErrorMsg = "Transaction was rejected in your wallet.";
      } else if (errorMessage.includes("insufficient funds")) {
        userErrorMsg = "Insufficient funds to complete the transaction.";
      }
      
      onError(userErrorMsg + " Please check the console for more details.");
    } finally {
      logger.debug("TestDataForm", "Setting submitting state to false")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="form-container">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="info-panel">
            <p className="info-text">
              <svg className="info-icon" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              All data submitted will be permanently stored on the blockchain and cannot be modified.
            </p>
          </div>

          <div className="form-grid">
            <FormField
              control={form.control}
              name="testName"
              render={({ field }) => (
                <FormItem className="form-field">
                  <FormLabel className="form-label">Test Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Login Test" className="form-input" {...field} />
                  </FormControl>
                  <FormDescription className="form-description">Enter a descriptive name for the test</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="testType"
              render={({ field }) => (
                <FormItem className="form-field">
                  <FormLabel className="form-label">Test Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="form-input">
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ui">UI Test</SelectItem>
                      <SelectItem value="api">API Test</SelectItem>
                      <SelectItem value="integration">Integration Test</SelectItem>
                      <SelectItem value="performance">Performance Test</SelectItem>
                      <SelectItem value="security">Security Test</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="form-description">Select the type of test performed</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="form-grid">
            <FormField
              control={form.control}
              name="testResult"
              render={({ field }) => (
                <FormItem className="form-field">
                  <FormLabel className="form-label">Test Result</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="form-input">
                        <SelectValue placeholder="Select test result" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="form-description">Did the test pass or fail?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="executionTime"
              render={({ field }) => (
                <FormItem className="form-field">
                  <FormLabel className="form-label">Execution Time (ms)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1500" className="form-input" {...field} />
                  </FormControl>
                  <FormDescription className="form-description">How long did the test take to execute?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* File Upload Section - Replaces the TestData textarea */}
          <div className="form-field">
            <FormLabel className="form-label">Test Data File</FormLabel>
            
            {/* File Drop Zone */}
            <div 
              className={`file-drop-area ${uploadedFile ? 'has-file' : ''} ${uploadError ? 'has-error' : ''}`}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onClick={() => !uploadedFile && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              
              {!uploadedFile ? (
                // Empty state - No file selected
                <div className="file-upload-placeholder">
                  <Upload className="upload-icon" />
                  <p className="upload-text">Drag and drop your file here, or click to browse</p>
                  <p className="upload-hint">Supported file types: JSON, CSV, TXT, PDF, LOG, etc.</p>
                </div>
              ) : (
                // File selected state
                <div className="file-info">
                  <div className="file-preview">
                    <FileText className="file-icon" />
                    <div className="file-details">
                      <p className="file-name">{uploadedFile.name}</p>
                      <p className="file-size">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  
                  {/* Show upload progress or status */}
                  <div className="file-actions">
                    {!uploadedFileData && !isSubmitting && (
                      <>
                        <Button 
                          type="button" 
                          onClick={handleFileUpload} 
                          variant="outline" 
                          size="sm"
                          className="upload-btn"
                        >
                          Upload to IPFS
                        </Button>
                        <Button 
                          type="button" 
                          onClick={removeFile} 
                          variant="ghost" 
                          size="sm"
                          className="remove-btn"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {isSubmitting && (
                      <div className="upload-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">Uploading... {uploadProgress}%</span>
                      </div>
                    )}
                    
                    {uploadedFileData && (
                      <div className="upload-success">
                        <CheckCircle className="success-icon" />
                        <span>Uploaded to IPFS</span>
                        <Button 
                          type="button" 
                          onClick={removeFile} 
                          variant="ghost" 
                          size="sm"
                          className="remove-btn"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {uploadError && (
              <div className="upload-error">
                <AlertCircle className="error-icon" />
                <span>{uploadError}</span>
              </div>
            )}
            
            <FormDescription className="form-description">
              Upload your test data file. The file will be stored on IPFS and linked to the test data.
            </FormDescription>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !uploadedFileData} 
            className="form-submit-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="loading-spinner h-4 w-4" />
                Storing on Blockchain...
              </>
            ) : (
              "Submit Test Data"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
