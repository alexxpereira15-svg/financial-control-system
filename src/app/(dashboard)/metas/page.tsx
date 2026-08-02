'use client'

import { useState, useEffect } from 'react'
import { addGoal, getGoals, addSavingsToGoal, calculateGoalProgress, Goal } from '@/lib/goals'

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Campos del formulario
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentSavings, setCurrentSavings] = useState('')
  const [deadline, setDeadline] = useState('')

  // Estado para abonar a meta
  const [addingToGoalId, setAddingToGoalId] = useState<string | null>(null)
  const [savingAmount, setSavingAmount] = useState('')

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const data = await getGoals()
      setGoals(data)
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

      // Limpiar campos
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
      await addSavingsToGoal(goal.id, goal.current_savings, parseFloat(savingAmount))
      setAddingToGoalId(null)
      setSavingAmount('')
      await loadGoals()
    } catch (err) {
      console.error('Error al abonar ahorro:', err)
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
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Nombre de la meta
              </label>
              <input
                type="text"
                placeholder="Ej. Fondo de emergencia, Viaje, Auto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Monto Objetivo (MXN)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Ahorro Inicial (Opcional)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Fecha Límite</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
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
                const { percentage, remainingAmount, monthsRemaining, monthlySavingsSuggested } =
                  calculateGoalProgress(goal)

                return (
                  <div
                    key={goal.id}
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <h4 className="font-bold text-base text-gray-100">{goal.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Fecha objetivo: <span className="text-gray-200">{goal.deadline}</span> ({monthsRemaining} {monthsRemaining === 1 ? 'mes restante' : 'meses restantes'})
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
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

                    {/* Desglose de ahorro sugerido y abono */}
                    <div className="pt-3 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div className="bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl text-xs text-gray-300 w-full sm:w-auto">
                        💡 Ahorro mensual sugerido:{' '}
                        <strong className="text-emerald-400">
                          ${monthlySavingsSuggested.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN/mes
                        </strong>
                      </div>

                      {addingToGoalId === goal.id ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="number"
                            placeholder="Monto a sumar"
                            value={savingAmount}
                            onChange={(e) => setSavingAmount(e.target.value)}
                            className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1 text-xs w-28 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => handleAddSavings(goal)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                          >
                            Sumar
                          </button>
                          <button
                            onClick={() => setAddingToGoalId(null)}
                            className="text-xs text-gray-400 hover:text-gray-200 px-1"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingToGoalId(goal.id!)}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-700 transition-colors w-full sm:w-auto text-center"
                        >
                          Abonar a Meta
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}