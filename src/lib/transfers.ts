import { createClient } from '@/lib/supabase/client'
import { getAccountById, updateAccount } from '@/lib/accounts'

export interface Transfer {
  id?: string
  from_account_id: string
  to_account_id?: string | null
  to_debt_id?: string | null
  amount: number
  description: string
  date: string
  created_at?: string
}

const supabase = createClient()

export async function getTransfers() {
  const { data, error } = await supabase
    .from('transfers')
    .select(`
      *,
      from_account:accounts!from_account_id(name, account_type),
      to_account:accounts!to_account_id(name, account_type),
      to_debt:debts!to_debt_id(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener transferencias:', error)
    throw error
  }
  return data || []
}

export async function addTransfer(transfer: Omit<Transfer, 'id' | 'created_at'>) {
  const { from_account_id, to_account_id, to_debt_id, amount, description, date } = transfer

  // 1. Restar dinero de la cuenta de origen (débito/efectivo)
  const sourceAccount = await getAccountById(from_account_id)
  if (sourceAccount) {
    const currentBal = Number(sourceAccount.current_balance || 0)
    await updateAccount(from_account_id, { current_balance: currentBal - Number(amount) })
  }

  // 2. Si el destino es una tarjeta o cuenta bancaria
  if (to_account_id) {
    const targetAccount = await getAccountById(to_account_id)
    if (targetAccount) {
      const currentBal = Number(targetAccount.current_balance || 0)
      // Si es tarjeta de crédito, un abono reduce la deuda; si es cuenta/débito, aumenta el saldo
      const updatedBal =
        targetAccount.account_type === 'credit_card'
          ? currentBal - Number(amount)
          : currentBal + Number(amount)

      await updateAccount(to_account_id, { current_balance: updatedBal })
    }
  }

  // 3. Si el destino es un préstamo directo de la tabla debts
  if (to_debt_id) {
    const { data: debt } = await supabase.from('debts').select('*').eq('id', to_debt_id).single()
    if (debt) {
      const currentDebtBal = Number(debt.current_balance || 0)
      await supabase
        .from('debts')
        .update({ current_balance: Math.max(0, currentDebtBal - Number(amount)) })
        .eq('id', to_debt_id)
    }
  }

  // 4. Guardar registro histórico
  const { data, error } = await supabase
    .from('transfers')
    .insert([
      {
        from_account_id,
        to_account_id: to_account_id || null,
        to_debt_id: to_debt_id || null,
        amount: Number(amount),
        description,
        date,
      },
    ])
    .select()

  if (error) {
    console.error('Error al registrar la transferencia:', error)
    throw error
  }

  return data
}
