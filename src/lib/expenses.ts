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

export interface PaymentSource {
  id: string
  name: string
  type: string
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

export async function getPaymentDebts(): Promise<PaymentSource[]> {
  const { data, error } = await supabase
    .from('debts')
    .select('id, name, type')
    .order('name', { ascending: true })

  if (error) return []
  return data || []
}

export async function addExpense(expense: Omit<Expense, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('expenses').insert([expense]).select().single()
  if (error) throw error

  if (expense.status === 'paid' && expense.debt_id) {
    await updateDebtBalance(expense.debt_id, expense.amount, 'add')
  }

  return data
}

// Actualizar un gasto existente
export async function updateExpense(id: string, updates: Partial<Expense>) {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data
}

// Eliminar un gasto y reajustar la deuda si estaba liquidado con tarjeta
export async function deleteExpense(id: string, amount: number, status: 'pending' | 'paid', debtId?: string | null) {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error

  if (status === 'paid' && debtId) {
    await updateDebtBalance(debtId, amount, 'subtract')
  }
}

export async function toggleExpenseStatus(id: string, currentStatus: 'pending' | 'paid', amount: number, debtId?: string | null) {
  const newStatus = currentStatus === 'pending' ? 'paid' : 'pending'

  const { error } = await supabase
    .from('expenses')
    .update({ status: newStatus })
    .eq('id', id)

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
