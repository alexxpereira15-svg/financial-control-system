import { createClient } from '@/lib/supabase/client'
import { getAccountById, updateAccount } from '@/lib/accounts'

export interface Income {
  id?: string
  title: string
  amount: number
  type: 'fixed' | 'variable'
  frequency: string
  date: string
  account_id?: string
  created_at?: string
}

const supabase = createClient()

export async function getIncomes(): Promise<Income[]> {
  const { data, error } = await supabase
    .from('incomes')
    .select('*, accounts(name, account_type)')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching incomes:', error)
    throw error
  }
  return data || []
}

export async function addIncome(income: Omit<Income, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('incomes')
    .insert([income])
    .select()
    .single()

  if (error) {
    console.error('Error adding income:', error)
    throw error
  }

  if (income.account_id) {
    const account = await getAccountById(income.account_id)
    if (account) {
      const currentBalance = Number(account.current_balance || 0)
      const incomeAmount = Number(income.amount)

      const newBalance =
        account.account_type === 'credit_card'
          ? currentBalance - incomeAmount
          : currentBalance + incomeAmount

      await updateAccount(account.id!, { current_balance: newBalance })
    }
  }

  return data
}

export async function updateIncome(id: string, updates: Partial<Income>, oldIncome?: Income) {
  const { data, error } = await supabase
    .from('incomes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating income:', error)
    throw error
  }

  if (oldIncome && oldIncome.account_id) {
    const oldAccount = await getAccountById(oldIncome.account_id)
    if (oldAccount) {
      const diff = Number(updates.amount ?? oldIncome.amount) - Number(oldIncome.amount)
      const currentBal = Number(oldAccount.current_balance || 0)
      const adjusted =
        oldAccount.account_type === 'credit_card'
          ? currentBal - diff
          : currentBal + diff

      await updateAccount(oldAccount.id!, { current_balance: adjusted })
    }
  }

  return data
}

export async function deleteIncome(id: string) {
  const { data: income, error: fetchError } = await supabase
    .from('incomes')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) console.error('Error fetching income for delete:', fetchError)

  if (income && income.account_id) {
    const account = await getAccountById(income.account_id)
    if (account) {
      const currentBalance = Number(account.current_balance || 0)
      const incomeAmount = Number(income.amount)

      const revertedBalance =
        account.account_type === 'credit_card'
          ? currentBalance + incomeAmount
          : currentBalance - incomeAmount

      await updateAccount(account.id!, { current_balance: revertedBalance })
    }
  }

  const { error } = await supabase.from('incomes').delete().eq('id', id)
  if (error) throw error
}
