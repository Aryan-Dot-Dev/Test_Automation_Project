import { TestDataDashboard } from "@/components/test-data-dashboard"

export default function Home() {
  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 md:mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white pb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Blockchain-Based Test Data Management System
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-base md:text-lg max-w-3xl">
            Securely store, verify, and audit test data on the blockchain
          </p>
        </header>
        
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
          <TestDataDashboard />
        </div>
        
        <footer className="mt-12 md:mt-16 text-center text-sm text-slate-500 dark:text-slate-400 pb-4">
          <p>© 2025 Blockchain Test Management. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}
