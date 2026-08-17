import { createClient } from '@/lib/supabase/client'

export type ExpenseFrequency = 'one_time' | 'monthly' | 'bimonthly' | 'yearly'

export interface Expense {
  id?: string
  title: string
  amount: number
  status: 'pending' | 'paid'
  frequency: ExpenseFrequency
  payment_method?: string
  debt_id?: string | null
  date: string
  created_at?: string
}

export interface DebtSource {
  id: string
  name: string
  debt_type: string
  cutoff_day?: number | null
  payment_due_day?: number | null
  current_balance: number
}

const supabase = createClient()

export async function getExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

// Obtener tarjetas/deudas con sus fechas de corte y vencimiento
export async function getPaymentDebts(): Promise<DebtSource[]> {
  const { data, error } = await supabase
    .from('debts')
    .select('id, name, debt_type, cutoff_day, payment_due_day, current_balance')
    .order('name', { ascending: true })

  if (error) return []
  return data || []
}

// Función que calcula la fecha exacta del próximo corte
export function calculateNextCutoffDate(cutoffDay: number): string {
  const today = new Date()
  let targetYear = today.getFullYear()
  let targetMonth = today.getMonth() // 0-indexed

  // Si hoy ya pasó el día de corte, el cargo corresponderá al corte del próximo mes
  if (today.getDate() >= cutoffDay) {
    targetMonth += 1
    if (targetMonth > 11) {
      targetMonth = 0
      targetYear += 1
    }
  }

  // Ajustar día de corte si el mes tiene menos días (ej. febrero)
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
  const validDay = Math.min(cutoffDay, lastDayOfTargetMonth)

  const cutoffDate = new Date(targetYear, targetMonth, validDay)
  return cutoffDate.toISOString().split('T')[0]
}

// Agregar gasto e impactar saldo si se procesa el cargo
export async function addExpense(expense: Omit<Expense, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('expenses').insert([expense]).select().single()
  if (error) throw error

  // Si está pagado/cargado y vinculado a tarjeta, sumamos el cargo a la deuda de la tarjeta
  if (expense.status === 'paid' && expense.debt_id) {
    await updateDebtBalance(expense.debt_id, expense.amount, 'add')
  }

  return data
}

export async function updateExpense(id: string, updates: Partial<Expense>) {
  const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select()
  if (error) throw error
  return data
}

export async function deleteExpense(id: string, amount: number, status: 'pending' | 'paid', debtId?: string | null) {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error

  if (status === 'paid' && debtId) {
    await updateDebtBalance(debtId, amount, 'subtract')
  }
}

export async function toggleExpenseStatus(id: string, currentStatus: 'pending' | 'paid', amount: number, debtId?: string | null) {
  const newStatus = currentStatus === 'pending' ? 'paid' : 'pending'

  const { error } = await supabase.from('expenses').update({ status: newStatus }).eq('id', id)
  if (error) throw error

  if (debtId) {
    const action = newStatus === 'paid' ? 'add' : 'subtract'
    await updateDebtBalance(debtId, amount, action)
  }
}

async function updateDebtBalance(debtId: string, amount: number, action: 'add' | 'subtract') {
  const { data: debt } = await supabase.from('debts').select('current_balance').eq('id', debtId).single()
  if (!debt) return

  const current = Number(debt.current_balance || 0)
  const updatedBalance = action === 'add' ? current + Number(amount) : Math.max(0, current - Number(amount))

  await supabase.from('debts').update({ current_balance: updatedBalance }).eq('id', debtId)
}
