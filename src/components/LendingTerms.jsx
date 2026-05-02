import { useState, useEffect } from 'react'
import { getCarQuotes, saveLendingQuote } from '../lib/db'
import {
  solveAPR,
  effectiveFinancingAmount,
  totalMonthlyPayments,
  totalInterestPaid,
} from '../lib/finance'

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function MoneyInput({ name, value, onChange, placeholder, required = true }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">$</span>
      <input
        name={name}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        required={required}
        min={0}
        step="0.01"
        placeholder={placeholder}
        className={`${inputClass} pl-7`}
      />
    </div>
  )
}

function ResultRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-blue-600 text-base' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}

function formatUSD(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const EMPTY_FORM = {
  plan_name: '',
  sticker_price: '',
  included_add_ons: '',
  down_payment: '',
  monthly_payment: '',
  term_months: '',
}

export default function LendingTerms({ tabData: carQuote }) {
  const [quotes, setQuotes] = useState([])
  const [loadingQuotes, setLoadingQuotes] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [selectedQuoteId, setSelectedQuoteId] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [results, setResults] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    getCarQuotes()
      .then(setQuotes)
      .catch((err) => setLoadError(err?.message ?? 'Failed to load quotes.'))
      .finally(() => setLoadingQuotes(false))
  }, [])

  // Auto-select when navigated here from NewQuote
  useEffect(() => {
    if (!carQuote) return
    setSelectedQuoteId(String(carQuote.id))
    setForm((prev) => ({ ...prev, sticker_price: String(carQuote.sticker_price) }))
    setResults(null)
    setSaveSuccess(false)
    setSaveError(null)
  }, [carQuote])

  function handleQuoteSelect(e) {
    const id = e.target.value
    setSelectedQuoteId(id)
    setResults(null)
    setSaveSuccess(false)
    if (!id) {
      setForm((prev) => ({ ...prev, sticker_price: '' }))
      return
    }
    const quote = quotes.find((q) => String(q.id) === id)
    if (quote) {
      setForm((prev) => ({ ...prev, sticker_price: String(quote.sticker_price) }))
    }
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setResults(null)
    setSaveSuccess(false)
  }

  function handleCalculate(e) {
    e.preventDefault()
    const stickerPrice = parseFloat(form.sticker_price)
    const downPayment = parseFloat(form.down_payment)
    const monthly = parseFloat(form.monthly_payment)
    const term = parseInt(form.term_months, 10)

    const apr = solveAPR(stickerPrice, downPayment, monthly, term)
    const financing = effectiveFinancingAmount(stickerPrice, downPayment)
    const totalPaid = totalMonthlyPayments(downPayment, monthly, term)
    const interest = totalInterestPaid(monthly, term, financing)

    setResults({ apr, financing, totalPaid, interest })
    setSaveSuccess(false)
    setSaveError(null)
  }

  async function handleSave() {
    if (!selectedQuoteId || !results) return
    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)
    try {
      await saveLendingQuote({
        car_quote_id: selectedQuoteId,
        plan_name: form.plan_name.trim() || null,
        sticker_price: parseFloat(form.sticker_price),
        included_add_ons: form.included_add_ons !== '' ? parseFloat(form.included_add_ons) : null,
        down_payment: parseFloat(form.down_payment),
        monthly_payment: parseFloat(form.monthly_payment),
        term_months: parseInt(form.term_months, 10),
        implied_apr: results.apr,
        effective_financing_amount: results.financing,
        total_payment: results.totalPaid,
        total_interest_paid: results.interest,
      })
      setSaveSuccess(true)
    } catch (err) {
      setSaveError(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleCalculate} className="p-4 flex flex-col gap-5 pb-8">

      {/* Section 1 — Car Quote Selector */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-gray-800">Car Quote</h2>

        {loadingQuotes && (
          <p className="text-sm text-gray-400">Loading quotes…</p>
        )}

        {loadError && (
          <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {loadError}
          </p>
        )}

        <Field label="Select a saved quote">
          <select
            value={selectedQuoteId}
            onChange={handleQuoteSelect}
            className={inputClass}
          >
            <option value="">-- Select a saved quote --</option>
            {quotes.map((q) => (
              <option key={q.id} value={String(q.id)}>
                {q.make} {q.model} {q.year} — {q.dealership}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <hr className="border-gray-200" />

      {/* Section 2 — Financing Inputs */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-gray-800">Financing Details</h2>

        <Field label="Financing Plan">
          <input
            name="plan_name"
            type="text"
            value={form.plan_name}
            onChange={handleChange}
            placeholder="e.g. Dealer offer, Credit union, 0% promo (optional)"
            className={inputClass}
          />
        </Field>

        <Field label="Sticker Price" required>
          <MoneyInput
            name="sticker_price"
            value={form.sticker_price}
            onChange={handleChange}
            placeholder="28500.00"
          />
        </Field>

        <Field label="Included Add-Ons Value">
          <MoneyInput
            name="included_add_ons"
            value={form.included_add_ons}
            onChange={handleChange}
            placeholder="0.00 (optional)"
            required={false}
          />
        </Field>

        <Field label="Down Payment" required>
          <MoneyInput
            name="down_payment"
            value={form.down_payment}
            onChange={handleChange}
            placeholder="3000.00"
          />
        </Field>

        <Field label="Monthly Payment (as quoted by dealer)" required>
          <MoneyInput
            name="monthly_payment"
            value={form.monthly_payment}
            onChange={handleChange}
            placeholder="450.00"
          />
        </Field>

        <Field label="Term (months)" required>
          <input
            name="term_months"
            type="number"
            inputMode="numeric"
            value={form.term_months}
            onChange={handleChange}
            required
            min={1}
            placeholder="60"
            className={inputClass}
          />
        </Field>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 text-white font-semibold py-3 text-base active:bg-blue-700 transition-colors"
      >
        Calculate
      </button>

      {/* Section 3 — Results */}
      {results && (
        <div className="flex flex-col gap-4">
          <hr className="border-gray-200" />
          <h2 className="text-base font-semibold text-gray-800">Results</h2>

          <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
            <ResultRow
              label="Implied APR"
              value={`${results.apr.toFixed(2)}%`}
              highlight
            />
            <ResultRow
              label="Effective Financing Amount"
              value={formatUSD(results.financing)}
            />
            <ResultRow
              label="Total Monthly Payments"
              value={formatUSD(results.totalPaid)}
            />
            <ResultRow
              label="Total Interest Paid"
              value={formatUSD(results.interest)}
            />
          </div>

          {saveSuccess && (
            <p className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2">
              Lending quote saved successfully.
            </p>
          )}
          {saveError && (
            <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {saveError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedQuoteId || saving}
            className="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed active:bg-emerald-700 transition-colors"
          >
            {saving ? 'Saving...' : 'Save This Lending Quote'}
          </button>
        </div>
      )}
    </form>
  )
}
