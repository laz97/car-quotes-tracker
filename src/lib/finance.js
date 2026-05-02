// Calculates the fixed monthly payment using standard amortization formula.
// Returns 0 if principal is 0 or term is 0.
export function calcMonthlyPayment(stickerPrice, downPayment, annualAPR, termMonths) {
  const principal = stickerPrice - downPayment
  if (principal <= 0 || termMonths <= 0) return 0
  const monthlyRate = annualAPR / 100 / 12
  if (monthlyRate === 0) return Math.round((principal / termMonths) * 100) / 100
  const payment = principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths))
  return Math.round(payment * 100) / 100
}

// Solves for the annual APR that produces a given monthly payment via binary search.
// Returns the APR as a percentage rounded to 4 decimal places (e.g. 7.4321).
export function solveAPR(stickerPrice, downPayment, monthlyPayment, termMonths) {
  let lo = 0
  let hi = 300
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    const estimated = calcMonthlyPayment(stickerPrice, downPayment, mid, termMonths)
    if (estimated < monthlyPayment) {
      lo = mid
    } else {
      hi = mid
    }
  }
  return Math.round(((lo + hi) / 2) * 10000) / 10000
}

// Returns the loan principal — the amount actually financed after the down payment.
export function effectiveFinancingAmount(stickerPrice, downPayment) {
  return stickerPrice - downPayment
}

// Returns the total amount paid: down payment plus all monthly installments.
export function totalMonthlyPayments(downPayment, monthlyPayment, termMonths) {
  return downPayment + monthlyPayment * termMonths
}

// Returns the total interest paid: monthly installments minus the amount financed.
export function totalInterestPaid(monthlyPayment, termMonths, effectiveFinancing) {
  return monthlyPayment * termMonths - effectiveFinancing
}
