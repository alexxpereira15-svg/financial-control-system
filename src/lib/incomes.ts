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

export async function addIncome(income: Omit<Income, 'id' | 'created_at'>) {
  // 1. Insertar en la tabla 'incomes'
  const { data, error } = await supabase
    .from('incomes')
    .insert([income])
    .select()
    .single()

  if (error) {
    console.error('Error de Supabase al insertar ingreso:', error)
    throw error
  }

  // 2. Sumar el saldo a la cuenta seleccionada
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
