import { createClient } from '@/lib/supabase/client'
import { getAccountById, updateAccount } from '@/lib/accounts'

const supabase = createClient()

export async function makePaymentOrTransfer(params: {
  fromAccountId: string
  toAccountId?: string // Si pagas una Tarjeta de Crédito u otra cuenta
  toDebtId?: string    // Si pagas un Préstamo directo
  amount: number
  description: string
  date: string
}) {
  const { fromAccountId, toAccountId, toDebtId, amount, description, date } = params

  // 1. Descontar saldo de la cuenta de origen (ej. Débito o Efectivo)
  const sourceAccount = await getAccountById(fromAccountId)
  if (sourceAccount) {
    const currentBal = Number(sourceAccount.current_balance || 0)
    await updateAccount(fromAccountId, { current_balance: currentBal - amount })
  }

  // 2. Aplicar el pago a la cuenta destino (si es Tarjeta de Crédito, reduce el saldo deudor)
  if (toAccountId) {
    const targetAccount = await getAccountById(toAccountId)
    if (targetAccount) {
      const targetBal = Number(targetAccount.current_balance || 0)
      // En tarjetas de crédito, abonos reducen el balance utilizado
      const newBal = targetAccount.account_type === 'credit_card' 
        ? targetBal - amount 
        : targetBal + amount

      await updateAccount(toAccountId, { current_balance: newBal })
    }
  }

  // 3. O si es un préstamo directo en la tabla `debts`
  if (toDebtId) {
    const { data: debt } = await supabase.from('debts').select('*').eq('id', toDebtId).single()
    if (debt) {
      const currentDebtBal = Number(debt.current_balance || 0)
      await supabase
        .from('debts')
        .update({ current_balance: Math.max(0, currentDebtBal - amount) })
        .eq('id', toDebtId)
    }
  }

  // 4. Registrar la transferencia para historial sin alterar la tabla 'incomes' ni 'expenses'
  const { data, error } = await supabase
    .from('transfers')
    .insert([
      {
        from_account_id: fromAccountId,
        to_account_id: toAccountId || null,
        to_debt_id: toDebtId || null,
        amount,
        description,
        date,
      },
    ])
    .select()

  if (error) throw error
  return data
}
