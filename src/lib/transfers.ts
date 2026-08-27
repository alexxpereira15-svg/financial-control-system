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
      const updatedBal =
        targetAccount.account_type === 'credit_card'
          ? currentBal - Number(amount)
          : currentBal + Number(amount)

      await updateAccount(to_account_id, { current_balance: updatedBal })
    }
  }

  // 3. Si el destino es un préstamo directo
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

  if (error) throw error
  return data
}

export async function deleteTransfer(id: string) {
  // 1. Obtener los datos de la transferencia antes de borrarla
  const { data: transfer, error: fetchError } = await supabase
    .from('transfers')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  if (transfer) {
    const amount = Number(transfer.amount)

    // Revertir origen: Devolver el dinero a la cuenta de donde salió
    if (transfer.from_account_id) {
      const source = await getAccountById(transfer.from_account_id)
      if (source) {
        await updateAccount(source.id!, {
          current_balance: Number(source.current_balance || 0) + amount,
        })
      }
    }

    // Revertir destino: Restar de la cuenta o sumar a la deuda
    if (transfer.to_account_id) {
      const target = await getAccountById(transfer.to_account_id)
      if (target) {
        const curBal = Number(target.current_balance || 0)
        const revertedBal =
          target.account_type === 'credit_card' ? curBal + amount : curBal - amount
        await updateAccount(target.id!, { current_balance: revertedBal })
      }
    }

    if (transfer.to_debt_id) {
      const { data: debt } = await supabase
        .from('debts')
        .select('*')
        .eq('id', transfer.to_debt_id)
        .single()

      if (debt) {
        await supabase
          .from('debts')
          .update({ current_balance: Number(debt.current_balance || 0) + amount })
          .eq('id', transfer.to_debt_id)
      }
    }
  }

  // 2. Borrar registro
  const { error } = await supabase.from('transfers').delete().eq('id', id)
  if (error) throw error
}

export async function updateTransfer(id: string, updates: Partial<Transfer>, oldTransfer: any) {
  // Primero revertimos los saldos con la transferencia previa
  await deleteTransfer(id)
  
  // Luego aplicamos el nuevo monto/destino con la transferencia actualizada
  const updatedData = {
    from_account_id: updates.from_account_id || oldTransfer.from_account_id,
    to_account_id: updates.to_account_id ?? oldTransfer.to_account_id,
    to_debt_id: updates.to_debt_id ?? oldTransfer.to_debt_id,
    amount: updates.amount ?? oldTransfer.amount,
    description: updates.description || oldTransfer.description,
    date: updates.date || oldTransfer.date,
  }

  return await addTransfer(updatedData)
}
