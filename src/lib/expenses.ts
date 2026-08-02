import { createClient } from '@/lib/supabase/client'

export interface Expense {
  id?: string
  title: string
  amount: number
  category_id?: string
  status: 'pending' | 'paid'
  frequency: 'one_time' | 'monthly' | 'yearly'
  date: string
  categories?: { name: string; icon?: string }
}

export async function addExpense(expense: Expense) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase.from('expenses').insert([
    {
      user_id: user.id,
      title: expense.title,
      amount: expense.amount,
      category_id: expense.category_id || null,
      status: expense.status,
      frequency: expense.frequency,
      date: expense.date,
    },
  ])
  .select()
  
  if (error) throw error
  return data
}

export async function getExpenses(): Promise<Expense[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('expenses')
    .select('*, categories(name, icon)')
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function toggleExpenseStatus(id: string, currentStatus: 'pending' | 'paid') {
  const supabase = createClient()
  const newStatus = currentStatus === 'paid' ? 'pending' : 'paid'

  const { error } = await supabase
    .from('expenses')
    .update({ status: newStatus })
    .eq('id', id)

  if (error) throw error
}
