'use client'

import { useState, useEffect } from 'react'
import { addExpense, getExpenses, toggleExpenseStatus, Expense } from '@/lib/expenses'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Formulario
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'pending' | 'paid'>('paid')
  const [frequency, setFrequency] = useState<'one_time' | 'monthly' | 'yearly'>('one_time')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      const data = await getExpenses()
      setExpenses(data)
    } catch (err) {
      console.error('Error al cargar gastos:', err)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount) return

    setLoading(true)
    try {
      await addExpense({
        title,
        amount: parseFloat(amount),
        status,
        frequency,
        date,
      })

      setTitle('')
      setAmount('')
      setDate(new Date().toISOString().split('T')[0])
      await loadExpenses()
    } catch (err) {
      console.error('Error al guardar gasto:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: 'pending' | 'paid') => {
    try {
      await toggleExpenseStatus(id, currentStatus)
      await loadExpenses()
    } catch (err) {
      console.error('Error al cambiar estado:', err)
    }
  }

  // Métricas
  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0)
  const totalPaid = expenses
    .filter((e) => e.status === 'paid')
    .reduce((acc, curr) => acc + Number(curr.amount), 0)
  const totalPending = expenses
    .filter((e) => e.status === 'pending')
    .reduce((acc, curr) => acc + Number(curr.amount), 0)

  return (
    <div className="p-6 md:p-8 bg-gray-950 min-h-screen text-gray-100 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Control de Gastos</h1>
        <p className="text-sm text-gray-400 mt-1">
          Registra tus consumos, servicios, salidas y controla tus compromisos pendientes.
        </p>
      </div>

      {/* Indicadores clave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Gasto Total</p>
          <p className="text-2xl font-bold mt-1 text-rose-400">
            ${totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Gastos Liquidados</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">
            ${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Pendientes por Pagar</p>
          <p className="text-2xl font-bold mt-1 text-amber-400">
            ${totalPending.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg h-fit">
          <h2 className="text-lg font-semibold mb-4">Nuevo Gasto</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Concepto / Servicio
              </label>
              <input
                type="text"
                placeholder="Ej. Renta, Supermercado, Netflix"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Monto (MXN)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Recurrencia
                </label>
                <select
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(e.target.value as 'one_time' | 'monthly' | 'yearly')
                  }
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
                >
                  <option value="one_time">Única vez</option>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Estado Inicial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'pending' | 'paid')}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
                >
                  <option value="paid">Pagado</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-500 font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50 mt-2 text-white"
            >
              {loading ? 'Registrando...' : 'Registrar Gasto'}
            </button>
          </form>
        </div>

        {/* Historial */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-sm">Historial de Gastos</h3>
              <span className="text-xs text-gray-400">{expenses.length} registros</span>
            </div>

            {fetching ? (
              <div className="p-8 text-center text-sm text-gray-500">Cargando registros...</div>
            ) : expenses.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Aún no has registrado ningún gasto.
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-800/40 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-100">{exp.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded capitalize">
                          {exp.frequency === 'one_time'
                            ? 'Única vez'
                            : exp.frequency === 'monthly'
                            ? 'Mensual'
                            : 'Anual'}
                        </span>
                        <span className="text-[10px] text-gray-500">{exp.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleStatus(exp.id!, exp.status)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                          exp.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                      >
                        {exp.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </button>

                      <div className="font-bold text-rose-400 text-base text-right">
                        -${Number(exp.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}