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

  if (error) throw error
  return data || []
}

export async function addIncome(income: Omit<Income, 'id' | 'created_at'>) {
  // 1. Registrar el ingreso
  const { data, error } = await supabase
    .from('incomes')
    .insert([income])
    .select()
    .single()

  if (error) throw error

  // 2. Sumar el monto al saldo de la cuenta de destino
  if (income.account_id) {
    const account = await getAccountById(income.account_id)
    if (account) {
      const currentBalance = Number(account.current_balance || 0)
      const incomeAmount = Number(income.amount)

      // Si es tarjeta de crédito, un ingreso reduce la deuda; si es débito/efectivo, aumenta el saldo
      const newBalance =
        account.account_type === 'credit_card'
          ? currentBalance - incomeAmount
          : currentBalance + incomeAmount

      await updateAccount(account.id!, { current_balance: newBalance })
    }
  }

  return data
}

export async function updateIncome(id: string, updates: Partial<Income>, oldIncome: Income) {
  // 1. Actualizar el registro en la base de datos
  const { data, error } = await supabase
    .from('incomes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // 2. Reajustar saldo en cuenta previa y nueva cuenta si cambió el monto o la cuenta
  if (oldIncome.account_id) {
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
  // 1. Obtener el ingreso antes de eliminarlo para revertir el saldo
  const { data: income, error: fetchError } = await supabase
    .from('incomes')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  // 2. Descontar el monto de la cuenta asignada
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

  // 3. Eliminar el registro
  const { error } = await supabase.from('incomes').delete().eq('id', id)
  if (error) throw error
}
