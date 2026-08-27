import { createClient } from '@/lib/supabase/client'
import { getAccountById, updateAccount } from '@/lib/accounts'

const supabase = createClient()

export async function processRecurringTransactions() {
  const today = new Date()
  const currentDay = today.getDate()
  const todayStr = today.toISOString().split('T')[0]
  const currentMonthStr = todayStr.substring(0, 7) // Formato 'YYYY-MM'

  try {
    // 1. Procesar Gastos Recurrentes (Diferentes de 'unique')
    const { data: recurringExpenses } = await supabase
      .from('expenses')
      .select('*')
      .neq('frequency', 'unique')

    if (recurringExpenses) {
      for (const exp of recurringExpenses) {
        // Verificar si ya se procesó en el mes actual
        const lastProcessedMonth = exp.last_processed_date
          ? exp.last_processed_date.substring(0, 7)
          : null

        // Determinar el día de cobro: el asignado en 'recurring_day' o el día de creación/fecha
        const targetDay = exp.recurring_day || (exp.date ? new Date(exp.date).getDate() : 1)

        // Si es el día del mes (o ya pasó dentro de este mes) y no se ha procesado este mes:
        if (currentDay >= targetDay && lastProcessedMonth !== currentMonthStr) {
          if (exp.account_id) {
            const acc = await getAccountById(exp.account_id)
            if (acc) {
              const currentBal = Number(acc.current_balance || 0)
              const amount = Number(exp.amount)

              // Si es Tarjeta de Crédito, el cargo AUMENTA el saldo adeudado
              // Si es Débito/Efectivo, DISMINUYE el dinero disponible
              const newBal =
                acc.account_type === 'credit_card'
                  ? currentBal + amount
                  : currentBal - amount

              await updateAccount(acc.id!, { current_balance: newBal })
            }
          }

          // Registrar el movimiento generado automáticamente en el historial
          await supabase.from('expenses').insert([
            {
              description: `${exp.description} (Cargo Automático)`,
              amount: exp.amount,
              category: exp.category,
              account_id: exp.account_id,
              frequency: 'unique', // Queda registrado como una transacción ejecutada
              date: todayStr,
              last_processed_date: todayStr,
            },
          ])

          // Marcar el gasto recurrente base como procesado en este mes
          await supabase
            .from('expenses')
            .update({ last_processed_date: todayStr })
            .eq('id', exp.id)
        }
      }
    }
  } catch (err) {
    console.error('Error al procesar cargos automáticos recurrentes:', err)
  }
}
