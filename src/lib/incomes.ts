import { createClient } from '@/lib/supabase/client'

export interface Income {
  id?: string
  title: string
  amount: number
  type: 'fixed' | 'variable'
  frequency: string
  date: string
}

export async function addIncome(income: Income) {
  const supabase = createClient()
  
  // Obtener el usuario autenticado actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase.from('incomes').insert([
    {
      user_id: user.id,
      title: income.title,
      amount: income.amount,
      type: income.type,
      frequency: income.frequency,
      date: income.date,
    },
  ])
  .select()
  
  if (error) throw error
  return data
}

export async function getIncomes(): Promise<Income[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}
