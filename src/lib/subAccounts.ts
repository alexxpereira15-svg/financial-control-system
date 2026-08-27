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

// Transferir fondos entre la cuenta principal y una cajita/apartado
export async function transferToSubAccount(params: {
  subAccountId: string
  parentAccountId: string
  amount: number
  action: 'deposit' | 'withdraw' // 'deposit' guarda en la cajita, 'withdraw' regresa a la cuenta
}) {
  const { subAccountId, parentAccountId, amount, action } = params

  const account = await getAccountById(parentAccountId)
  if (!account) throw new Error('Cuenta padre no encontrada')

  // Obtener apartado
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
    newSubBal = Math.max(0, currentSubBal - amount)
    newReserved = Math.max(0, currentReserved - amount)
  }

  // 1. Actualizar apartado
  await supabase
    .from('sub_accounts')
    .update({ balance: newSubBal })
    .eq('id', subAccountId)

  // 2. Actualizar balance retenido en la cuenta padre
  await updateAccount(parentAccountId, { reserved_balance: newReserved })
}
