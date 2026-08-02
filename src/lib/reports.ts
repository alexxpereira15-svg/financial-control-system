import { createClient } from '@/lib/supabase/client'

export interface DateRange {
  startDate: string
  endDate: string
}

export interface IncomeRecord {
  id: string
  concept: string
  amount: number
  category: string
  payment_method: string
  created_at: string
}

export interface ExpenseRecord {
  id: string
  concept: string
  amount: number
  category: string
  payment_method: string
  created_at: string
}

export interface CategoryBreakdown {
  category: string
  total: number
  percentage: number
}

export interface PaymentMethodBreakdown {
  method: string
  total: number
}

export async function getFilteredReport(range: DateRange) {
  const supabase = createClient()
  const start = `${range.startDate}T00:00:00.000Z`
  const end = `${range.endDate}T23:59:59.999Z`

  // Consultar ingresos en el rango
  const { data: incomes, error: incomesError } = await supabase
    .from('incomes')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  if (incomesError) throw incomesError

  // Consultar gastos en el rango
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  if (expensesError) throw expensesError

  const totalIncomes = (incomes || []).reduce((acc, curr) => acc + Number(curr.amount), 0)
  const totalExpenses = (expenses || []).reduce((acc, curr) => acc + Number(curr.amount), 0)
  const netBalance = totalIncomes - totalExpenses

  // Agrupar gastos por categoría
  const categoryMap: Record<string, number> = {}
  ;(expenses || []).forEach((e) => {
    const cat = e.category || 'Otros'
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount)
  })

  const expensesByCategory: CategoryBreakdown[] = Object.entries(categoryMap)
    .map(([category, total]) => ({
      category,
      total,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // Agrupar gastos por método de pago (manteniendo separado débito y crédito)
  const paymentMap: Record<string, number> = {}
  ;(expenses || []).forEach((e) => {
    const method = e.payment_method || 'Efectivo'
    paymentMap[method] = (paymentMap[method] || 0) + Number(e.amount)
  })

  const expensesByPaymentMethod: PaymentMethodBreakdown[] = Object.entries(paymentMap)
    .map(([method, total]) => ({ method, total }))
    .sort((a, b) => b.total - a.total)

  return {
    incomes: (incomes || []) as IncomeRecord[],
    expenses: (expenses || []) as ExpenseRecord[],
    totalIncomes,
    totalExpenses,
    netBalance,
    expensesByCategory,
    expensesByPaymentMethod,
  }
}