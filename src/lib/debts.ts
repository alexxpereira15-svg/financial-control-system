import { createClient } from '@/lib/supabase/client'

export interface Debt {
  id?: string
  name: string
  type: 'credit_card' | 'personal_loan' | 'mortgage' | 'other'
  initial_amount: number
  current_balance: number
  annual_interest_rate: number
  minimum_payment: number
  due_date: number // Día del mes (1-31)
}

export async function addDebt(debt: Debt) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase.from('debts').insert([
    {
      user_id: user.id,
      name: debt.name,
      type: debt.type,
      initial_amount: debt.initial_amount,
      current_balance: debt.current_balance,
      annual_interest_rate: debt.annual_interest_rate,
      minimum_payment: debt.minimum_payment,
      due_date: debt.due_date,
    },
  ])
  .select()
  
  if (error) throw error
  return data
}

export async function getDebts(): Promise<Debt[]> {
  const supabase = createClient()
  
  // Ordenamos directamente en la consulta por tasa de interés anual descendente (Método Avalancha)
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .order('annual_interest_rate', { ascending: false })

  if (error) throw error
  return data || []
}

export async function recordDebtPayment(debtId: string, currentBalance: number, paymentAmount: number) {
  const supabase = createClient()
  const newBalance = Math.max(0, currentBalance - paymentAmount)

  // 1. Registrar el pago en el historial
  const { error: paymentError } = await supabase
    .from('debt_payments')
    .insert([{ debt_id: debtId, amount: paymentAmount }])

  if (paymentError) throw paymentError

  // 2. Actualizar el saldo actual de la deuda
  const { error: updateError } = await supabase
    .from('debts')
    .update({ current_balance: newBalance })
    .eq('id', debtId)

  if (updateError) throw updateError
}
