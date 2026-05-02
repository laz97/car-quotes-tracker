import { useState } from 'react'
import { calcMonthlyPayment, effectiveFinancingAmount } from '../lib/finance'

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

const EMPTY_FORM = { sticker_price: '', down_payment: '', apr: '', term_months: '' }

export default function PaymentsCalculator() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [result, setResult] = useState(null)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setResult(null)
  }

  function handleCalculate(e) {
    e.preventDefault()
    const stickerPrice = parseFloat(form.sticker_price)
    const downPayment = parseFloat(form.down_payment)
    const apr = parseFloat(form.apr)
    const term = parseInt(form.term_months, 10)

    const monthly = calcMonthlyPayment(stickerPrice, downPayment, apr, term)
    const financed = effectiveFinancingAmount(stickerPrice, downPayment)
    setResult({ monthly, financed })
  }

  return (
    <form onSubmit={handleCalculate} className="p-4 flex flex-col gap-4 pb-6">
      <h1 className="text-xl font-bold text-gray-800">Payment Calculator</h1>

      <Field label="Sticker Price">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">$</span>
          <input
            name="sticker_price"
            type="number"
            inputMode="decimal"
            value={form.sticker_price}
            onChange={handleChange}
            required
            min={0}
            step="0.01"
            placeholder="28500.00"
            className={`${inputClass} pl-7`}
          />
        </div>
      </Field>

      <Field label="Down Payment">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">$</span>
          <input
            name="down_payment"
            type="number"
            inputMode="decimal"
            value={form.down_payment}
            onChange={handleChange}
            required
            min={0}
            step="0.01"
            placeholder="3000.00"
            className={`${inputClass} pl-7`}
          />
        </div>
      </Field>

      <Field label="APR">
        <div className="relative">
          <input
            name="apr"
            type="number"
            inputMode="decimal"
            value={form.apr}
            onChange={handleChange}
            required
            min={0}
            step="0.0001"
            placeholder="7.5"
            className={`${inputClass} pr-8`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">%</span>
        </div>
      </Field>

      <Field label="Term (months)">
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

      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 text-white font-semibold py-3 text-base active:bg-blue-700 transition-colors mt-1"
      >
        Calculate Monthly Payment
      </button>

      {result && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-5 flex flex-col items-center gap-1">
          <p className="text-sm text-blue-600 font-medium">Monthly Payment</p>
          <p className="text-4xl font-bold text-blue-700 tracking-tight">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(result.monthly)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Effective amount financed:{' '}
            <span className="font-medium text-gray-700">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(result.financed)}
            </span>
          </p>
        </div>
      )}
    </form>
  )
}
