import { createClient } from '@/lib/supabase/client'
import { getAccountById, updateAccount } from '@/lib/accounts'

const supabase = createClient()

// Calcula si ya se cumplió la fecha para volver a aplicar el movimiento
function shouldProcessRecurring(lastDateStr: string, frequency: string, currentDate: Date): boolean {
  const lastDate = new Date(lastDateStr)
  const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24))

  switch (frequency) {
    case 'weekly':
      return diffDays >= 7
    case 'biweekly':
      return diffDays >= 14
    case 'monthly':
      return diffDays >= 30
    case 'bimonthly':
      return diffDays >= 60
    case 'quarterly':
      return diffDays >= 90
    case 'annual':
      return diffDays >= 365
    default:
      return false
  }
}

export async function processRecurringTransactions() {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  try {
    // 1. Procesar Ingresos Fijos / Recurrentes
    const { data: recurringIncomes } = await supabase
      .from('incomes')
      .select('*')
      .eq('type', 'fixed')

    if (recurringIncomes) {
      for (const inc of recurringIncomes) {
        const referenceDate = inc.last_processed_date || inc.date
        if (shouldProcessRecurring(referenceDate, inc.frequency, today)) {
          // Aumentar el saldo de la cuenta asignada
          if (inc.account_id) {
            const acc = await getAccountById(inc.account_id)
            if (acc) {
              const currentBal = Number(acc.current_balance || 0)
              const amount = Number(inc.amount)
              const newBal = acc.account_type === 'credit_card' ? currentBal - amount : currentBal + amount
              await updateAccount(acc.id!, { current_balance: newBal })
            }
          }

          // Registrar el nuevo ingreso histórico generado
          await supabase.from('incomes').insert([
            {
              title: `${inc.title} (Automático)`,
              amount: inc.amount,
              type: 'fixed',
              frequency: inc.frequency,
              date: todayStr,
              account_id: inc.account_id,
              last_processed_date: todayStr,
            },
          ])

          // Marcar el registro original como procesado hoy
          await supabase
            .from('incomes')
            .update({ last_processed_date: todayStr })
            .eq('id', inc.id)
        }
      }
    }

    // 2. Procesar Gastos Recurrentes (diferentes a 'unique')
    const { data: recurringExpenses } = await supabase
      .from('expenses')
      .select('*')
      .neq('frequency', 'unique')

    if (recurringExpenses) {
      for (const exp of recurringExpenses) {
        const referenceDate = exp.last_processed_date || exp.date || exp.created_at
        if (referenceDate && shouldProcessRecurring(referenceDate, exp.frequency, today)) {
          // Descontar saldo de la cuenta
          if (exp.account_id) {
            const acc = await getAccountById(exp.account_id)
            if (acc) {
              const currentBal = Number(acc.current_balance || 0)
              const amount = Number(exp.amount)
              const newBal = acc.account_type === 'credit_card' ? currentBal + amount : currentBal - amount
              await updateAccount(acc.id!, { current_balance: newBal })
            }
          }

          // Registrar el gasto histórico generado
          await supabase.from('expenses').insert([
            {
              description: `${exp.description} (Automático)`,
              amount: exp.amount,
              category: exp.category,
              account_id: exp.account_id,
              frequency: exp.frequency,
              date: todayStr,
              last_processed_date: todayStr,
            },
          ])

          // Marcar como procesado hoy
          await supabase
            .from('expenses')
            .update({ last_processed_date: todayStr })
            .eq('id', exp.id)
        }
      }
    }
  } catch (err) {
    console.error('Error al procesar transacciones automáticas:', err)
  }
}
