import { createClient } from '@/lib/supabase/client'

export type AccountType = 'credit_card' | 'debit' | 'cash'

export interface Account {
  id?: string
  name: string
  account_type: AccountType
  credit_limit?: number | null
  initial_balance?: number | null
  current_balance: number
  reserved_balance?: number | null // Dinero en Apartados / Cajitas
  yield_rate?: number | null       // Tasa de Rendimiento Anual (%)
  cutoff_day?: number | null
  payment_due_day?: number | null
  annual_interest_rate?: number | null
  minimum_payment?: number | null
  created_at?: string
}

const supabase = createClient()

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function addAccount(account: Omit<Account, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('accounts').insert([account]).select().single()
  if (error) throw error
  return data
}

export async function updateAccount(id: string, updates: Partial<Account>) {
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data
}

export async function deleteAccount(id: string) {
  const { error } = await supabase.from('accounts').delete().eq('id', id)
  if (error) throw error
}
export async function getAccountById(id: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error al obtener la cuenta:', error)
    return null
  }
  return data
}
