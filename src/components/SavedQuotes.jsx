import { useState, useEffect } from 'react'
import {
  getCarQuotes,
  getLendingQuotesForCar,
  deleteCarQuote,
  deleteLendingQuote,
  updateCarQuote,
  updateLendingQuote,
} from '../lib/db'
import {
  solveAPR,
  effectiveFinancingAmount,
  totalMonthlyPayments,
  totalInterestPaid,
} from '../lib/finance'

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function formatUSD(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
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

function LendingSubCard({ lq, onDelete }) {
  const [local, setLocal] = useState(lq)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  function startEdit() {
    setEditForm({
      plan_name: local.plan_name ?? '',
      sticker_price: String(local.sticker_price),
      included_add_ons: local.included_add_ons != null ? String(local.included_add_ons) : '',
      down_payment: String(local.down_payment),
      monthly_payment: String(local.monthly_payment),
      term_months: String(local.term_months),
    })
    setSaveError(null)
    setEditing(true)
  }

  function handleChange(e) {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const stickerPrice = parseFloat(editForm.sticker_price)
      const downPayment = parseFloat(editForm.down_payment)
      const monthly = parseFloat(editForm.monthly_payment)
      const term = parseInt(editForm.term_months, 10)

      const apr = solveAPR(stickerPrice, downPayment, monthly, term)
      const financing = effectiveFinancingAmount(stickerPrice, downPayment)
      const totalPaid = totalMonthlyPayments(downPayment, monthly, term)
      const interest = totalInterestPaid(monthly, term, financing)

      const updated = await updateLendingQuote(local.id, {
        plan_name: editForm.plan_name.trim() || null,
        sticker_price: stickerPrice,
        included_add_ons: editForm.included_add_ons !== '' ? parseFloat(editForm.included_add_ons) : null,
        down_payment: downPayment,
        monthly_payment: monthly,
        term_months: term,
        implied_apr: apr,
        effective_financing_amount: financing,
        total_payment: totalPaid,
        total_interest_paid: interest,
      })
      setLocal(updated)
      setEditing(false)
    } catch (err) {
      setSaveError(err?.message ?? 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteLendingQuote(local.id)
      onDelete(local.id)
    } catch (err) {
      setDeleteError(err?.message ?? 'Delete failed. Please try again.')
      setDeleting(false)
    }
  }

  if (editing) {
    return (
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex flex-col gap-3">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Edit Lending Quote</p>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Financing Plan (optional)</label>
          <input name="plan_name" type="text" value={editForm.plan_name}
            onChange={handleChange} placeholder="e.g. Dealer offer" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Sticker Price ($)</label>
            <input name="sticker_price" type="number" inputMode="decimal" value={editForm.sticker_price}
              onChange={handleChange} required min={0} step="0.01" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Add-Ons ($, optional)</label>
            <input name="included_add_ons" type="number" inputMode="decimal" value={editForm.included_add_ons}
              onChange={handleChange} min={0} step="0.01" placeholder="—" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Down Payment ($)</label>
            <input name="down_payment" type="number" inputMode="decimal" value={editForm.down_payment}
              onChange={handleChange} required min={0} step="0.01" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Monthly Payment ($)</label>
            <input name="monthly_payment" type="number" inputMode="decimal" value={editForm.monthly_payment}
              onChange={handleChange} required min={0} step="0.01" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Term (months)</label>
            <input name="term_months" type="number" inputMode="numeric" value={editForm.term_months}
              onChange={handleChange} required min={1} className={inputClass} />
          </div>
        </div>

        <p className="text-xs text-gray-400">APR and totals will be recalculated on save.</p>

        {saveError && <p className="text-xs text-red-600">{saveError}</p>}

        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-blue-600 text-white text-sm font-medium py-2 disabled:opacity-50 active:bg-blue-700 transition-colors">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} disabled={saving}
            className="flex-1 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium py-2 active:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm flex-1">
          {local.plan_name && (
            <div className="col-span-2">
              <LendingRow label="Financing Plan" value={local.plan_name} />
            </div>
          )}
          <LendingRow label="Sticker Price" value={formatUSD(local.sticker_price)} />
          <LendingRow
            label="Price + Add-Ons"
            value={formatUSD(local.sticker_price + (local.included_add_ons ?? 0))}
          />
          <LendingRow label="Implied APR" value={`${Number(local.implied_apr).toFixed(2)}%`} highlight />
          <LendingRow label="Term" value={`${local.term_months} months`} />
          <LendingRow label="Down Payment" value={formatUSD(local.down_payment)} />
          <LendingRow label="Monthly Payment" value={formatUSD(local.monthly_payment)} />
          <LendingRow label="Effective Financing" value={formatUSD(local.effective_financing_amount)} />
          <LendingRow label="Total Payments" value={formatUSD(local.total_payment)} />
          <LendingRow label="Total Interest" value={formatUSD(local.total_interest_paid)} />
        </div>
        <button onClick={startEdit}
          className="shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit lending quote">
          <PencilIcon />
        </button>
      </div>
      {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
      <button onClick={handleDelete} disabled={deleting}
        className="self-end text-xs font-medium text-red-600 border border-red-200 rounded-lg px-3 py-1.5 active:bg-red-50 disabled:opacity-50 transition-colors">
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}

function CarQuoteCard({ cq, onDeleteCar }) {
  const [local, setLocal] = useState(cq)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [open, setOpen] = useState(false)
  const [lendingQuotes, setLendingQuotes] = useState([])
  const [loadingLending, setLoadingLending] = useState(false)
  const [lendingError, setLendingError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteCarError, setDeleteCarError] = useState(null)

  function startEdit() {
    setEditForm({
      make: local.make,
      model: local.model,
      year: String(local.year),
      trim: local.trim ?? '',
      sticker_price: String(local.sticker_price),
      dealership: local.dealership,
    })
    setSaveError(null)
    setEditing(true)
  }

  function handleChange(e) {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateCarQuote(local.id, {
        make: editForm.make.trim(),
        model: editForm.model.trim(),
        year: parseInt(editForm.year, 10),
        trim: editForm.trim.trim() || null,
        sticker_price: parseFloat(editForm.sticker_price),
        dealership: editForm.dealership.trim(),
      })
      setLocal(updated)
      setEditing(false)
    } catch (err) {
      setSaveError(err?.message ?? 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle() {
    if (!open && lendingQuotes.length === 0) {
      setLoadingLending(true)
      setLendingError(null)
      try {
        const rows = await getLendingQuotesForCar(local.id)
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
      await deleteCarQuote(local.id)
      onDeleteCar(local.id)
    } catch (err) {
      setDeleteCarError(err?.message ?? 'Delete failed. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">

      {editing ? (
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Edit Car Quote</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Make</label>
              <input name="make" type="text" value={editForm.make}
                onChange={handleChange} required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Model</label>
              <input name="model" type="text" value={editForm.model}
                onChange={handleChange} required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Year</label>
              <input name="year" type="number" inputMode="numeric" value={editForm.year}
                onChange={handleChange} required min={1980} max={2030} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Trim (optional)</label>
              <input name="trim" type="text" value={editForm.trim}
                onChange={handleChange} placeholder="—" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Sticker Price ($)</label>
              <input name="sticker_price" type="number" inputMode="decimal" value={editForm.sticker_price}
                onChange={handleChange} required min={0} step="0.01" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Dealership</label>
              <input name="dealership" type="text" value={editForm.dealership}
                onChange={handleChange} required className={inputClass} />
            </div>
          </div>

          {saveError && <p className="text-xs text-red-600">{saveError}</p>}

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 rounded-lg bg-blue-600 text-white text-sm font-medium py-2 disabled:opacity-50 active:bg-blue-700 transition-colors">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} disabled={saving}
              className="flex-1 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium py-2 active:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 text-base leading-snug">
                {local.year} {local.make} {local.model}
                {local.trim ? <span className="text-gray-500 font-normal"> {local.trim}</span> : null}
              </p>
              <p className="text-sm text-gray-500">{local.dealership}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <p className="text-base font-bold text-gray-800">{formatUSD(local.sticker_price)}</p>
              <button onClick={startEdit}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit car quote">
                <PencilIcon />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lending quotes section */}
      {open && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          {loadingLending && <p className="text-sm text-gray-400 text-center py-2">Loading…</p>}
          {lendingError && <p className="text-sm text-red-600">{lendingError}</p>}
          {!loadingLending && lendingQuotes.length === 0 && !lendingError && (
            <p className="text-sm text-gray-400 text-center py-2">No lending quotes saved yet.</p>
          )}
          {lendingQuotes.map((lq) => (
            <LendingSubCard key={lq.id} lq={lq} onDelete={handleLendingDelete} />
          ))}
        </div>
      )}

      {deleteCarError && <p className="px-4 pb-2 text-xs text-red-600">{deleteCarError}</p>}

      {!editing && (
        <div className="border-t border-gray-100 flex">
          <button onClick={handleToggle}
            className="flex-1 py-2.5 text-sm font-medium text-blue-600 active:bg-blue-50 transition-colors">
            {open ? 'Hide Lending Quotes' : 'Show Lending Quotes'}
          </button>
          <div className="w-px bg-gray-100" />
          <button onClick={handleDeleteCar} disabled={deleting}
            className="flex-1 py-2.5 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-50 transition-colors">
            {deleting ? 'Deleting…' : 'Delete Car Quote'}
          </button>
        </div>
      )}
    </div>
  )
}

function buildCSV(carQuotes, lendingMap) {
  const headers = [
    'Make', 'Model', 'Year', 'Trim', 'Dealership', 'Sticker Price',
    'Down Payment', 'Monthly Payment', 'Term (months)', 'Implied APR (%)',
    'Effective Financing Amount', 'Total Payments', 'Total Interest Paid',
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

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Saved Quotes</h1>
        {!loading && quotes.length > 0 && (
          <button onClick={handleDownloadCSV} disabled={csvBusy}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 active:bg-blue-50 disabled:opacity-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
            </svg>
            {csvBusy ? 'Preparing…' : 'Download CSV'}
          </button>
        )}
      </div>

      {loading && <p className="text-center text-gray-400 text-sm py-12">Loading quotes…</p>}

      {loadError && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {loadError}
        </p>
      )}

      {!loading && !loadError && quotes.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-gray-500 font-medium">No quotes saved yet.</p>
          <p className="text-gray-400 text-sm">Head to the New Quote tab to add your first car.</p>
        </div>
      )}

      {quotes.map((cq) => (
        <CarQuoteCard key={cq.id} cq={cq} onDeleteCar={handleDeleteCar} />
      ))}
    </div>
  )
}
