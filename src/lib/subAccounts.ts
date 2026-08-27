import { createClient } from '@/lib/supabase/client'
import { getAccountById, updateAccount } from '@/lib/accounts'

export interface SubAccount {
  id?: string
  account_id: string
  name: string
  balance: number
  yield_rate?: number | null
  created_at?: string
}

const supabase = createClient()

export async function getSubAccounts(accountId: string): Promise<SubAccount[]> {
  const { data, error } = await supabase
    .from('sub_accounts')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function addSubAccount(subAccount: Omit<SubAccount, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('sub_accounts')
    .insert([subAccount])
    .select()
    .single()

  if (error) throw error

  // Si se crea el apartado con un saldo inicial, se suma al saldo retenido de la cuenta padre
  if (subAccount.balance && subAccount.balance > 0) {
    const parent = await getAccountById(subAccount.account_id)
    if (parent) {
      const currentReserved = Number(parent.reserved_balance || 0)
      await updateAccount(subAccount.account_id, {
        reserved_balance: currentReserved + Number(subAccount.balance),
      })
    }
  }

  return data
}

export async function deleteSubAccount(subAccountId: string, currentBalance: number) {
  if (currentBalance > 0) {
    throw new Error('No puedes eliminar un apartado con saldo. Regresa el dinero a disponible primero.')
  }

  const { error } = await supabase
    .from('sub_accounts')
    .delete()
    .eq('id', subAccountId)

  if (error) throw error
}

// Transferir fondos entre la cuenta principal y un apartado
export async function transferToSubAccount(params: {
  subAccountId: string
  parentAccountId: string
  amount: number
  action: 'deposit' | 'withdraw'
}) {
  const { subAccountId, parentAccountId, amount, action } = params

  const account = await getAccountById(parentAccountId)
  if (!account) throw new Error('Cuenta padre no encontrada')

  const { data: subAcc } = await supabase
    .from('sub_accounts')
    .select('*')
    .eq('id', subAccountId)
    .single()

  if (!subAcc) throw new Error('Apartado no encontrado')

  const currentSubBal = Number(subAcc.balance || 0)
  const currentReserved = Number(account.reserved_balance || 0)

  let newSubBal = currentSubBal
  let newReserved = currentReserved

  if (action === 'deposit') {
    newSubBal += amount
    newReserved += amount
  } else {
    // Al retirar, reducimos el saldo en la cajita y liberamos la reserva de la cuenta principal
    newSubBal = Math.max(0, currentSubBal - amount)
    newReserved = Math.max(0, currentReserved - amount)
  }

  // 1. Actualizar el saldo dentro de la cajita/apartado
  const { error: subErr } = await supabase
    .from('sub_accounts')
    .update({ balance: newSubBal })
    .eq('id', subAccountId)

  if (subErr) throw subErr

  // 2. Actualizar el saldo retenido en la cuenta principal
  await updateAccount(parentAccountId, { 
    reserved_balance: newReserved 
  })
}
