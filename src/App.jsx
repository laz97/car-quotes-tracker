import { useState } from 'react'
import NewQuote from './components/NewQuote'
import LendingTerms from './components/LendingTerms'
import PaymentsCalculator from './components/PaymentsCalculator'
import SavedQuotes from './components/SavedQuotes'

const TABS = [
  {
    id: 'new-quote',
    label: 'New Quote',
    component: NewQuote,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    id: 'lending-terms',
    label: 'Lending Terms',
    component: LendingTerms,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V18a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'payment-calc',
    label: 'Payment Calc',
    component: PaymentsCalculator,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6" />
      </svg>
    ),
  },
  {
    id: 'saved-quotes',
    label: 'Saved Quotes',
    component: SavedQuotes,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('new-quote')
  const [tabData, setTabData] = useState({})

  function navigateTo(tabId, data = null) {
    setTabData((prev) => ({ ...prev, [tabId]: data }))
    setActiveTab(tabId)
  }

  const currentTab = TABS.find((t) => t.id === activeTab)
  const CurrentComponent = currentTab?.component

  return (
    <div className="flex flex-col h-screen bg-gray-50 md:flex-row">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 bg-white border-r border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <span className="text-lg font-bold text-blue-600 tracking-wide">Car Tracker</span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => navigateTo(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── Mobile header ── */}
      <header className="md:hidden bg-blue-600 text-white px-4 py-3 shadow-md shrink-0">
        <h1 className="text-lg font-semibold tracking-wide">Car Tracker</h1>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full md:max-w-2xl md:mx-auto">
          {CurrentComponent && (
            <CurrentComponent
              onNavigate={navigateTo}
              tabData={tabData[activeTab] ?? null}
            />
          )}
        </div>
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="md:hidden bg-white border-t border-gray-200 shrink-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => navigateTo(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors border-t-2 ${
                  isActive
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                <span className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-blue-50' : ''}`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
