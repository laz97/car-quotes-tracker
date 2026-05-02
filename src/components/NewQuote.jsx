import { useState } from 'react'
import { saveCarQuote } from '../lib/db'

const EMPTY_FORM = {
  make: '',
  model: '',
  year: '',
  trim: '',
  sticker_price: '',
  dealership: '',
}

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

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export default function NewQuote({ onNavigate }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [savedQuote, setSavedQuote] = useState(null)
  const [error, setError] = useState(null)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const row = await saveCarQuote({
        make: form.make.trim(),
        model: form.model.trim(),
        year: parseInt(form.year, 10),
        trim: form.trim.trim() || null,
        sticker_price: parseFloat(form.sticker_price),
        dealership: form.dealership.trim(),
      })
      setSavedQuote(row)
    } catch (err) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleAddAnother() {
    setForm(EMPTY_FORM)
    setSavedQuote(null)
    setError(null)
  }

  if (savedQuote) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex flex-col gap-1">
          <p className="text-green-800 font-semibold text-base">Quote saved!</p>
          <p className="text-green-700 text-sm">Ready to calculate financing?</p>
        </div>

        <button
          onClick={() => onNavigate('lending-terms', savedQuote)}
          className="w-full rounded-xl bg-blue-600 text-white font-semibold py-3 text-base active:bg-blue-700 transition-colors"
        >
          Calculate Interest Rates
        </button>

        <button
          onClick={handleAddAnother}
          className="w-full rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold py-3 text-base active:bg-gray-50 transition-colors"
        >
          Add Another Quote
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 pb-6">
      <Field label="Make" required>
        <input
          name="make"
          type="text"
          value={form.make}
          onChange={handleChange}
          required
          placeholder="Toyota"
          className={inputClass}
        />
      </Field>

      <Field label="Model" required>
        <input
          name="model"
          type="text"
          value={form.model}
          onChange={handleChange}
          required
          placeholder="Camry"
          className={inputClass}
        />
      </Field>

      <Field label="Year" required>
        <input
          name="year"
          type="number"
          inputMode="numeric"
          value={form.year}
          onChange={handleChange}
          required
          min={1980}
          max={2030}
          placeholder="2024"
          className={inputClass}
        />
      </Field>

      <Field label="Trim">
        <input
          name="trim"
          type="text"
          value={form.trim}
          onChange={handleChange}
          placeholder="XSE (optional)"
          className={inputClass}
        />
      </Field>

      <Field label="Sticker Price" required>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base select-none">
            $
          </span>
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

      <Field label="Dealership" required>
        <input
          name="dealership"
          type="text"
          value={form.dealership}
          onChange={handleChange}
          required
          placeholder="ABC Motors"
          className={inputClass}
        />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-blue-600 text-white font-semibold py-3 text-base disabled:opacity-60 active:bg-blue-700 transition-colors mt-1"
      >
        {saving ? 'Saving...' : 'Save Quote'}
      </button>
    </form>
  )
}
