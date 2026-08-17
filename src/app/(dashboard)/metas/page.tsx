'use client'

import { useState, useEffect } from 'react'
import {
  addGoal,
  getGoals,
  addSavingsToGoal,
  calculateGoalProgress,
  updateGoal,
  deleteGoal,
  getGoalContributions,
  deleteContribution,
  Goal,
  Contribution,
} from '@/lib/goals'
import { Pencil, Trash2, History, Plus, X, MessageSquare, Calendar } from 'lucide-react'

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Campos para crear nueva meta
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentSavings, setCurrentSavings] = useState('')
  const [deadline, setDeadline] = useState('')

  // Estado para abonar a meta (monto + comentario)
  const [addingToGoalId, setAddingToGoalId] = useState<string | null>(null)
  const [savingAmount, setSavingAmount] = useState('')
  const [savingComment, setSavingComment] = useState('')

  // Estado para la meta que se está editando
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  // Estado para ver e interactuar con el historial
  const [selectedGoalForHistory, setSelectedGoalForHistory] = useState<Goal | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const data = await getGoals()
      setGoals(data)

      // Actualizar la meta en vista si está seleccionado el historial
      if (selectedGoalForHistory) {
        const updated = data.find((g) => g.id === selectedGoalForHistory.id)
        if (updated) setSelectedGoalForHistory(updated)
      }
    } catch (err) {
      console.error('Error al cargar metas:', err)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !targetAmount || !deadline) return

    setLoading(true)
    try {
      await addGoal({
        name,
        target_amount: parseFloat(targetAmount),
        current_savings: currentSavings ? parseFloat(currentSavings) : 0,
        deadline,
      })

      setName('')
      setTargetAmount('')
      setCurrentSavings('')
      setDeadline('')
      await loadGoals()
    } catch (err) {
      console.error('Error al crear meta:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSavings = async (goal: Goal) => {
    if (!savingAmount || !goal.id) return
    try {
      await addSavingsToGoal(goal.id, goal.current_savings, parseFloat(savingAmount), savingComment)
      setAddingToGoalId(null)
      setSavingAmount('')
      setSavingComment('')
      await loadGoals()

      if (selectedGoalForHistory?.id === goal.id) {
        loadHistory(goal)
      }
    } catch (err) {
      console.error('Error al abonar ahorro:', err)
    }
  }

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGoal || !editingGoal.id) return

    try {
      await updateGoal(editingGoal.id, {
        name: editingGoal.name,
        target_amount: Number(editingGoal.target_amount),
        deadline: editingGoal.deadline,
      })
      setEditingGoal(null)
      await loadGoals()
    } catch (err) {
      console.error('Error al actualizar meta:', err)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('¿Deseas eliminar esta meta y todo su historial de abonos?')) return
    try {
      await deleteGoal(goalId)
      if (selectedGoalForHistory?.id === goalId) setSelectedGoalForHistory(null)
      await loadGoals()
    } catch (err) {
      console.error('Error al eliminar meta:', err)
    }
  }

  const loadHistory = async (goal: Goal) => {
    setSelectedGoalForHistory(goal)
    if (!goal.id) return
    try {
      const data = await getGoalContributions(goal.id)
      setContributions(data)
    } catch (err) {
      console.error('Error al cargar historial de abonos:', err)
    }
  }

  const handleDeleteContribution = async (contrib: Contribution) => {
    if (!selectedGoalForHistory) return
    if (!confirm('¿Eliminar este abono? El total guardado se ajustará.')) return

    try {
      await deleteContribution(
        contrib.id,
        selectedGoalForHistory.id!,
        selectedGoalForHistory.current_savings,
        contrib.amount
      )
      await loadHistory(selectedGoalForHistory)
      await loadGoals()
    } catch (err) {
      console.error('Error al eliminar abono:', err)
    }
  }

  const totalTarget = goals.reduce((acc, curr) => acc + Number(curr.target_amount), 0)
  const totalSaved = goals.reduce((acc, curr) => acc + Number(curr.current_savings), 0)

  return (
    <div className="p-6 md:p-8 bg-gray-950 min-h-screen text-gray-100 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Metas Financieras</h1>
        <p className="text-sm text-gray-400 mt-1">
          Planifica tus proyectos y proyecta la cuota mensual de ahorro necesaria para alcanzarlos a tiempo.
        </p>
      </div>

      {/* Indicadores globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Ahorro Objetivo Acumulado</p>
          <p className="text-3xl font-bold mt-1 text-indigo-400">
            ${totalTarget.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Ahorro Real Acreditado</p>
          <p className="text-3xl font-bold mt-1 text-emerald-400">
            ${totalSaved.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario para agregar meta */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg h-fit">
          <h2 className="text-lg font-semibold mb-4">Nueva Meta de Ahorro</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Nombre de la meta</label>
              <input
                type="text"
                placeholder="Ej. Fondo de emergencia, Viaje, Auto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Monto Objetivo (MXN)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Ahorro Inicial (Opcional)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Fecha Límite</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Creando...' : 'Crear Meta'}
            </button>
          </form>
        </div>

        {/* Listado de Metas */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-sm px-1">Tus Objetivos en Curso</h3>

          {fetching ? (
            <div className="p-8 bg-gray-900 border border-gray-800 rounded-2xl text-center text-sm text-gray-500">
              Cargando tus metas...
            </div>
          ) : goals.length === 0 ? (
            <div className="p-8 bg-gray-900 border border-gray-800 rounded-2xl text-center text-sm text-gray-500">
              No has definido ninguna meta todavía.
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const { percentage, monthsRemaining, monthlySavingsSuggested } = calculateGoalProgress(goal)

                return (
                  <div key={goal.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-gray-100">{goal.name}</h4>
                          <button
                            onClick={() => setEditingGoal(goal)}
                            className="text-gray-500 hover:text-indigo-400 p-1"
                            title="Editar Meta"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => goal.id && handleDeleteGoal(goal.id)}
                            className="text-gray-500 hover:text-rose-400 p-1"
                            title="Eliminar Meta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Fecha objetivo: <span className="text-gray-200">{goal.deadline}</span> ({monthsRemaining}{' '}
                          {monthsRemaining === 1 ? 'mes restante' : 'meses restantes'})
                        </p>
                      </div>

                      <div className="text-left sm:text-right flex items-center sm:block justify-between gap-4">
                        <span className="text-xs text-gray-400">Objetivo:</span>
                        <p className="text-lg font-bold text-indigo-400">
                          ${Number(goal.target_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                        </p>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-gray-400">
                        <span>
                          Ahorrado: ${Number(goal.current_savings).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                        <span>{percentage.toFixed(1)}% completado</span>
                      </div>
                      <div className="w-full bg-gray-950 h-2.5 rounded-full overflow-hidden border border-gray-800">
                        <div
                          className="bg-indigo-500 h-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Sugerencia, Botón de Historial y Formulario de Abono */}
                    <div className="pt-3 border-t border-gray-800 flex flex-col space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl text-xs text-gray-300 w-full sm:w-auto">
                          💡 Ahorro mensual sugerido:{' '}
                          <strong className="text-emerald-400">
                            ${monthlySavingsSuggested.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN/mes
                          </strong>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => loadHistory(goal)}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-700 transition-colors flex items-center gap-1.5"
                          >
                            <History className="w-3.5 h-3.5" /> Historial
                          </button>

                          {addingToGoalId !== goal.id && (
                            <button
                              onClick={() => setAddingToGoalId(goal.id!)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Abonar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandir Formulario de Abono con Comentario */}
                      {addingToGoalId === goal.id && (
                        <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Monto a abonar ($)"
                              value={savingAmount}
                              onChange={(e) => setSavingAmount(e.target.value)}
                              className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="Comentario / Nota (ej. Bono de trabajo)"
                              value={savingComment}
                              onChange={(e) => setSavingComment(e.target.value)}
                              className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setAddingToGoalId(null)}
                              className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleAddSavings(goal)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                            >
                              Guardar Abono
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición de Meta */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-gray-100">Editar Meta</h3>
              <button onClick={() => setEditingGoal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingGoal.name}
                  onChange={(e) => setEditingGoal({ ...editingGoal, name: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Monto Objetivo (MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingGoal.target_amount}
                  onChange={(e) => setEditingGoal({ ...editingGoal, target_amount: Number(e.target.value) })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Fecha Límite</label>
                <input
                  type="date"
                  value={editingGoal.deadline}
                  onChange={(e) => setEditingGoal({ ...editingGoal, deadline: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Panel Lateral para Historial de Abonos */}
      {selectedGoalForHistory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-gray-900 border-l border-gray-800 w-full max-w-md h-full p-6 space-y-5 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-gray-100 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" /> Historial de Abonos
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedGoalForHistory.name}</p>
              </div>
              <button onClick={() => setSelectedGoalForHistory(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {contributions.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No hay abonos registrados para esta meta.</p>
              ) : (
                contributions.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-950 border border-gray-800 rounded-xl space-y-1 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-400 text-sm">
                        +${Number(item.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString('es-MX')}
                        </span>
                        <button
                          onClick={() => handleDeleteContribution(item)}
                          className="text-gray-500 hover:text-rose-400 transition"
                          title="Eliminar Abono"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {item.comment && (
                      <p className="text-gray-400 flex items-center gap-1 text-[11px] italic">
                        <MessageSquare className="w-3 h-3 text-gray-500" /> {item.comment}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
