import { createClient } from '@/lib/supabase/client'

export interface Debt {
  id?: string
  name: string
  debt_type: 'credit_card' | 'loan' | 'personal'
  credit_limit?: number | null
  current_balance: number
  cutoff_day?: number | null
  payment_due_day?: number | null
  created_at?: string
}

const supabase = createClient()

export async function getDebts(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function addDebt(debt: Omit<Debt, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('debts').insert([debt]).select().single()
  if (error) throw error
  return data
}

export async function updateDebt(id: string, updates: Partial<Debt>) {
  const { data, error } = await supabase.from('debts').update(updates).eq('id', id).select()
  if (error) throw error
  return data
}

export async function deleteDebt(id: string) {
  const { error } = await supabase.from('debts').delete().eq('id', id)
  if (error) throw error
}
