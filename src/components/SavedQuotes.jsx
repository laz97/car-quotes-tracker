import { useState, useEffect } from 'react'
import {
  getCarQuotes,
  getLendingQuotesForCar,
  deleteCarQuote,
  deleteLendingQuote,
} from '../lib/db'

function formatUSD(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function LendingSubCard({ lq, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteLendingQuote(lq.id)
      onDelete(lq.id)
    } catch (err) {
      setDeleteError(err?.message ?? 'Delete failed. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {lq.plan_name && (
          <div className="col-span-2">
            <LendingRow label="Financing Plan" value={lq.plan_name} />
          </div>
        )}
        <LendingRow label="Sticker Price" value={formatUSD(lq.sticker_price)} />
        {lq.included_add_ons != null && (
          <LendingRow label="Included Add-Ons" value={formatUSD(lq.included_add_ons)} />
        )}
        <LendingRow label="Implied APR" value={`${Number(lq.implied_apr).toFixed(2)}%`} highlight />
        <LendingRow label="Term" value={`${lq.term_months} months`} />
        <LendingRow label="Down Payment" value={formatUSD(lq.down_payment)} />
        <LendingRow label="Monthly Payment" value={formatUSD(lq.monthly_payment)} />
        <LendingRow label="Effective Financing" value={formatUSD(lq.effective_financing_amount)} />
        <LendingRow label="Total Payments" value={formatUSD(lq.total_payment)} />
        <LendingRow label="Total Interest" value={formatUSD(lq.total_interest_paid)} />
      </div>
      {deleteError && (
        <p className="text-xs text-red-600">{deleteError}</p>
      )}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="self-end text-xs font-medium text-red-600 border border-red-200 rounded-lg px-3 py-1.5 active:bg-red-50 disabled:opacity-50 transition-colors"
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}

function LendingRow({ label, value, highlight }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`font-medium ${highlight ? 'text-blue-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  )
}

function CarQuoteCard({ cq, onDeleteCar }) {
  const [open, setOpen] = useState(false)
  const [lendingQuotes, setLendingQuotes] = useState([])
  const [loadingLending, setLoadingLending] = useState(false)
  const [lendingError, setLendingError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteCarError, setDeleteCarError] = useState(null)

  async function handleToggle() {
    if (!open && lendingQuotes.length === 0) {
      setLoadingLending(true)
      setLendingError(null)
      try {
        const rows = await getLendingQuotesForCar(cq.id)
        setLendingQuotes(rows)
      } catch (err) {
        setLendingError(err?.message ?? 'Failed to load lending quotes.')
      } finally {
        setLoadingLending(false)
      }
    }
    setOpen((prev) => !prev)
  }

  function handleLendingDelete(id) {
    setLendingQuotes((prev) => prev.filter((lq) => lq.id !== id))
  }

  async function handleDeleteCar() {
    const confirmed = window.confirm(
      'Delete this quote and all its lending quotes? This cannot be undone.'
    )
    if (!confirmed) return
    setDeleting(true)
    setDeleteCarError(null)
    try {
      await deleteCarQuote(cq.id)
      onDeleteCar(cq.id)
    } catch (err) {
      setDeleteCarError(err?.message ?? 'Delete failed. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* Car info */}
      <div className="p-4 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900 text-base leading-snug">
              {cq.year} {cq.make} {cq.model}
              {cq.trim ? <span className="text-gray-500 font-normal"> {cq.trim}</span> : null}
            </p>
            <p className="text-sm text-gray-500">{cq.dealership}</p>
          </div>
          <p className="text-base font-bold text-gray-800 shrink-0">
            {formatUSD(cq.sticker_price)}
          </p>
        </div>
      </div>

      {/* Lending quotes section */}
      {open && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          {loadingLending && (
            <p className="text-sm text-gray-400 text-center py-2">Loading…</p>
          )}
          {lendingError && (
            <p className="text-sm text-red-600">{lendingError}</p>
          )}
          {!loadingLending && lendingQuotes.length === 0 && !lendingError && (
            <p className="text-sm text-gray-400 text-center py-2">No lending quotes saved yet.</p>
          )}
          {lendingQuotes.map((lq) => (
            <LendingSubCard key={lq.id} lq={lq} onDelete={handleLendingDelete} />
          ))}
        </div>
      )}

      {deleteCarError && (
        <p className="px-4 pb-2 text-xs text-red-600">{deleteCarError}</p>
      )}

      {/* Action buttons */}
      <div className="border-t border-gray-100 flex">
        <button
          onClick={handleToggle}
          className="flex-1 py-2.5 text-sm font-medium text-blue-600 active:bg-blue-50 transition-colors"
        >
          {open ? 'Hide Lending Quotes' : 'Show Lending Quotes'}
        </button>
        <div className="w-px bg-gray-100" />
        <button
          onClick={handleDeleteCar}
          disabled={deleting}
          className="flex-1 py-2.5 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {deleting ? 'Deleting…' : 'Delete Car Quote'}
        </button>
      </div>
    </div>
  )
}

function buildCSV(carQuotes, lendingMap) {
  const headers = [
    'Make', 'Model', 'Year', 'Trim', 'Dealership', 'Sticker Price',
    'Down Payment', 'Monthly Payment', 'Term (months)', 'Implied APR (%)',
    'Effective Financing Amount', 'Total Monthly Payments', 'Total Interest Paid',
  ]

  const escape = (val) => {
    const s = val === null || val === undefined ? '' : String(val)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const rows = []
  for (const cq of carQuotes) {
    const lending = lendingMap[cq.id] ?? []
    if (lending.length === 0) {
      rows.push([cq.make, cq.model, cq.year, cq.trim ?? '', cq.dealership,
        cq.sticker_price, '', '', '', '', '', '', ''])
    } else {
      for (const lq of lending) {
        rows.push([
          cq.make, cq.model, cq.year, cq.trim ?? '', cq.dealership,
          cq.sticker_price, lq.down_payment, lq.monthly_payment,
          lq.term_months, lq.implied_apr, lq.effective_financing_amount,
          lq.total_payment, lq.total_interest_paid,
        ])
      }
    }
  }

  return [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
}

export default function SavedQuotes() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [csvBusy, setCsvBusy] = useState(false)

  useEffect(() => {
    getCarQuotes()
      .then(setQuotes)
      .catch((err) => setLoadError(err?.message ?? 'Failed to load quotes.'))
      .finally(() => setLoading(false))
  }, [])

  function handleDeleteCar(id) {
    setQuotes((prev) => prev.filter((q) => q.id !== id))
  }

  async function handleDownloadCSV() {
    setCsvBusy(true)
    try {
      const carQuotes = await getCarQuotes()
      const lendingMap = {}
      await Promise.all(
        carQuotes.map(async (cq) => {
          lendingMap[cq.id] = await getLendingQuotesForCar(cq.id)
        })
      )
      const csv = buildCSV(carQuotes, lendingMap)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'car-quotes.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setCsvBusy(false)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4 pb-8">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Saved Quotes</h1>
        {!loading && quotes.length > 0 && (
          <button
            onClick={handleDownloadCSV}
            disabled={csvBusy}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 active:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
            </svg>
            {csvBusy ? 'Preparing…' : 'Download CSV'}
          </button>
        )}
      </div>

      {/* States */}
      {loading && (
        <p className="text-center text-gray-400 text-sm py-12">Loading quotes…</p>
      )}

      {loadError && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {loadError}
        </p>
      )}

      {!loading && !loadError && quotes.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-gray-500 font-medium">No quotes saved yet.</p>
          <p className="text-gray-400 text-sm">
            Head to the New Quote tab to add your first car.
          </p>
        </div>
      )}

      {/* Quote cards */}
      {quotes.map((cq) => (
        <CarQuoteCard key={cq.id} cq={cq} onDeleteCar={handleDeleteCar} />
      ))}
    </div>
  )
}
