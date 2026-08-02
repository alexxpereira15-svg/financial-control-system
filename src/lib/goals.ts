import { createClient } from '@/lib/supabase/client'

export interface Goal {
  id?: string
  name: string
  target_amount: number
  current_savings: number
  deadline: string
}

export async function addGoal(goal: Goal) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase.from('goals').insert([
    {
      user_id: user.id,
      name: goal.name,
      target_amount: goal.target_amount,
      current_savings: goal.current_savings || 0,
      deadline: goal.deadline,
    },
  ])
  .select()
  
  if (error) throw error
  return data
}

export async function getGoals(): Promise<Goal[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('deadline', { ascending: true })

  if (error) throw error
  return data || []
}

export async function addSavingsToGoal(goalId: string, currentSavings: number, amountToAdd: number) {
  const supabase = createClient()
  const newSavings = currentSavings + amountToAdd

  const { error } = await supabase
    .from('goals')
    .update({ current_savings: newSavings })
    .eq('id', goalId)

  if (error) throw error
}

// Función auxiliar para calcular el ahorro mensual sugerido y tiempo restante
export function calculateGoalProgress(goal: Goal) {
  const target = Number(goal.target_amount)
  const current = Number(goal.current_savings)
  const remainingAmount = Math.max(0, target - current)
  const percentage = Math.min(100, (current / target) * 100)

  const today = new Date()
  const targetDate = new Date(goal.deadline)

  // Diferencia aproximada en meses
  const monthsRemaining =
    (targetDate.getFullYear() - today.getFullYear()) * 12 +
    (targetDate.getMonth() - today.getMonth())

  const effectiveMonths = Math.max(1, monthsRemaining)
  const monthlySavingsSuggested = remainingAmount > 0 ? remainingAmount / effectiveMonths : 0

  return {
    percentage,
    remainingAmount,
    monthsRemaining: Math.max(0, monthsRemaining),
    monthlySavingsSuggested,
  }
}
