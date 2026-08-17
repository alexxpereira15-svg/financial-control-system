import { createClient } from '@/lib/supabase/client'
import { getAccountById, updateAccount } from '@/lib/accounts'

export type ExpenseFrequency = 
  | 'unique' 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'bimonthly' 
  | 'quarterly' 
  | 'annual'

export interface Expense {
  id?: string
  amount: number
  description: string
  category: string
  account_id: string
  frequency: ExpenseFrequency
  date?: string
  created_at?: string
}

const supabase = createClient()

export async function getExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, accounts(name, account_type)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function addExpense(expense: Omit<Expense, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select()
    .single()

  if (error) throw error

  if (expense.account_id) {
    const account = await getAccountById(expense.account_id)
    if (account) {
      const currentBalance = Number(account.current_balance || 0)
      const expenseAmount = Number(expense.amount)

      const newBalance =
        account.account_type === 'credit_card'
          ? currentBalance + expenseAmount
          : currentBalance - expenseAmount

      await updateAccount(account.id!, { current_balance: newBalance })
    }
  }

  return data
}

export async function deleteExpense(id: string) {
  const { data: expense, error: fetchError } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  if (expense && expense.account_id) {
    const account = await getAccountById(expense.account_id)
    if (account) {
      const currentBalance = Number(account.current_balance || 0)
      const expenseAmount = Number(expense.amount)

      const revertedBalance =
        account.account_type === 'credit_card'
          ? currentBalance - expenseAmount
          : currentBalance + expenseAmount

      await updateAccount(account.id!, { current_balance: revertedBalance })
    }
  }

  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
