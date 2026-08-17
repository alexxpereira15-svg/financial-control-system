import { createClient } from '@/lib/supabase/client'

export interface Goal {
  id?: string
  name: string
  target_amount: number
  current_savings: number
  deadline: string
  created_at?: string
}

export interface Contribution {
  id: string
  goal_id: string
  amount: number
  comment?: string
  created_at: string
}

const supabase = createClient()

export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function addGoal(goal: Omit<Goal, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('goals').insert([goal]).select()
  if (error) throw error
  return data
}

// Actualizar información general de una meta
export async function updateGoal(id: string, updates: Partial<Goal>) {
  const { data, error } = await supabase.from('goals').update(updates).eq('id', id)
  if (error) throw error
  return data
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw error
}

// Obtener historial de abonos de una meta
export async function getGoalContributions(goalId: string): Promise<Contribution[]> {
  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Agregar abono con comentario y recalcular el saldo
export async function addSavingsToGoal(goalId: string, currentSavings: number, amount: number, comment?: string) {
  // 1. Insertar en historial
  const { error: contribError } = await supabase.from('goal_contributions').insert([
    {
      goal_id: goalId,
      amount,
      comment: comment || 'Abono a meta',
    },
  ])
  if (contribError) throw contribError

  // 2. Actualizar balance
  const newBalance = Math.max(0, Number(currentSavings) + Number(amount))
  const { error: goalError } = await supabase
    .from('goals')
    .update({ current_savings: newBalance })
    .eq('id', goalId)

  if (goalError) throw goalError
}

// Eliminar un abono del historial y reajustar el saldo
export async function deleteContribution(contributionId: string, goalId: string, currentSavings: number, contribAmount: number) {
  // 1. Eliminar movimiento
  const { error: deleteError } = await supabase.from('goal_contributions').delete().eq('id', contributionId)
  if (deleteError) throw deleteError

  // 2. Restar el monto eliminado del saldo actual de la meta
  const newBalance = Math.max(0, Number(currentSavings) - Number(contribAmount))
  const { error: goalError } = await supabase
    .from('goals')
    .update({ current_savings: newBalance })
    .eq('id', goalId)

  if (goalError) throw goalError
}

export function calculateGoalProgress(goal: Goal) {
  const percentage = Math.min(100, Math.max(0, (goal.current_savings / goal.target_amount) * 100))
  const remainingAmount = Math.max(0, goal.target_amount - goal.current_savings)

  const today = new Date()
  const targetDate = new Date(goal.deadline)

  const monthsRemaining =
    (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth())

  const validMonths = monthsRemaining > 0 ? monthsRemaining : 1
  const monthlySavingsSuggested = remainingAmount / validMonths

  return {
    percentage,
    remainingAmount,
    monthsRemaining: Math.max(0, monthsRemaining),
    monthlySavingsSuggested,
  }
}
