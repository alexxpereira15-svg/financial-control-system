'use client'

import { useState, useEffect } from 'react'
import {
  addExpense,
  getExpenses,
  toggleExpenseStatus,
  getPaymentDebts,
  updateExpense,
  deleteExpense,
  calculateNextCutoffDate,
  Expense,
  ExpenseFrequency,
  DebtSource,
} from '@/lib/expenses'
import { CreditCard, Calendar, RefreshCw, CheckCircle, Clock, Pencil, Trash2, X, AlertCircle } from 'lucide-react'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [paymentSources, setPaymentSources] = useState<DebtSource[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Modales
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  // Formulario
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'pending' | 'paid'>('pending')
  const [frequency, setFrequency] = useState<ExpenseFrequency>('monthly')
  const [paymentMethod, setPaymentMethod] = useState('tarjeta_credito')
  const [selectedDebtId, setSelectedDebtId] = useState<string>('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Información de la tarjeta seleccionada
  const [selectedDebt, setSelectedDebt] = useState<DebtSource | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [expensesData, debtsData] = await Promise.all([getExpenses(), getPaymentDebts()])
      setExpenses(expensesData)
      setPaymentSources(debtsData)
    } catch (err) {
      console.error('Error al cargar datos:', err)
    } finally {
      setFetching(false)
    }
  }

  const handleSelectDebt = (debtId: string) => {
    setSelectedDebtId(debtId)
    const debt = paymentSources.find((d) => d.id === debtId) || null
    setSelectedDebt(debt)

    // Si la tarjeta tiene día de corte, autocalculamos la fecha programada del gasto
    if (debt?.cutoff_day) {
      const calculatedDate = calculateNextCutoffDate(debt.cutoff_day)
      setDate(calculatedDate)
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
        payment_method: paymentMethod,
        debt_id: paymentMethod === 'tarjeta_credito' && selectedDebtId ? selectedDebtId : null,
        date,
      })

      setTitle('')
      setAmount('')
      setSelectedDebtId('')
      setSelectedDebt(null)
      setDate(new Date().toISOString().split('T')[0])
      await loadData()
    } catch (err) {
      console.error('Error al guardar gasto:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense || !editingExpense.id) return

    try {
      await updateExpense(editingExpense.id, {
        title: editingExpense.title,
        amount: Number(editingExpense.amount),
        frequency: editingExpense.frequency,
        status: editingExpense.status,
        date: editingExpense.date,
        debt_id: editingExpense.debt_id,
      })
      setEditingExpense(null)
      await loadData()
    } catch (err) {
      console.error('Error al actualizar gasto:', err)
    }
  }

  const handleDelete = async (exp: Expense) => {
    if (!exp.id) return
    if (!confirm(`¿Eliminar el gasto "${exp.title}"?`)) return

    try {
      await deleteExpense(exp.id, exp.amount, exp.status, exp.debt_id)
      await loadData()
    } catch (err) {
      console.error('Error al eliminar gasto:', err)
    }
  }

  const handleToggleStatus = async (exp: Expense) => {
    if (!exp.id) return
    try {
      await toggleExpenseStatus(exp.id, exp.status, exp.amount, exp.debt_id)
      await loadData()
    } catch (err) {
      console.error('Error al cambiar estado:', err)
    }
  }

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
        <h1 className="text-2xl font-bold tracking-tight">Control de Gastos y Cargos Recurrentes</h1>
        <p className="text-sm text-gray-400 mt-1">
          Sincroniza tus servicios fijos y mensuales con la fecha de corte de tus tarjetas Nu, Santander u otras deudas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Gasto Total Programado</p>
          <p className="text-2xl font-bold mt-1 text-rose-400">
            ${totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Cargado / Pagado</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">
            ${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Pendiente de Aplicar</p>
          <p className="text-2xl font-bold mt-1 text-amber-400">
            ${totalPending.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg h-fit space-y-4">
          <h2 className="text-lg font-semibold">Registrar Gasto</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Concepto / Servicio</label>
              <input
                type="text"
                placeholder="Ej. Netflix, Gimnasio, Renta"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Monto (MXN)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Frecuencia</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as ExpenseFrequency)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white"
                >
                  <option value="monthly">Mensual (Fijo)</option>
                  <option value="bimonthly">Bimestral (Fijo)</option>
                  <option value="yearly">Anual (Fijo)</option>
                  <option value="one_time">Única vez (Variable)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'pending' | 'paid')}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white"
                >
                  <option value="pending">Pendiente por cargar</option>
                  <option value="paid">Cargado / Pagado</option>
                </select>
              </div>
            </div>

            {/* Método de Pago y Corte de Tarjeta */}
            <div className="space-y-3 pt-1 border-t border-gray-800">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value)
                    if (e.target.value !== 'tarjeta_credito') {
                      setSelectedDebtId('')
                      setSelectedDebt(null)
                    }
                  }}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white"
                >
                  <option value="tarjeta_credito">Tarjeta de Crédito (Corte Recurrente)</option>
                  <option value="efectivo">Efectivo / Débito</option>
                  <option value="transferencia">Transferencia (SPEI)</option>
                </select>
              </div>

              {paymentMethod === 'tarjeta_credito' && (
                <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl space-y-2">
                  <label className="block text-xs font-medium text-indigo-400 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Seleccionar Tarjeta:
                  </label>
                  <select
                    value={selectedDebtId}
                    onChange={(e) => handleSelectDebt(e.target.value)}
                    required={paymentMethod === 'tarjeta_credito'}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                  >
                    <option value="">-- Selecciona Nu, Santander, etc. --</option>
                    {paymentSources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.name} {source.cutoff_day ? `(Corte día ${source.cutoff_day})` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedDebt?.cutoff_day && (
                    <div className="text-[11px] text-amber-300/90 flex items-start gap-1 bg-amber-950/30 p-2 rounded-lg border border-amber-800/40 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                      <span>
                        Día de corte de esta tarjeta: <strong>Día {selectedDebt.cutoff_day}</strong>. La fecha límite de pago es el día {selectedDebt.payment_due_day || 'N/A'}.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Fecha del Cargo / Fecha de Corte
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-500 font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50 mt-2 text-white"
            >
              {loading ? 'Guardando...' : 'Guardar Gasto'}
            </button>
          </form>
        </div>

        {/* Historial */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-sm">Gastos y Cargos Programados</h3>
              <span className="text-xs text-gray-400">{expenses.length} registros</span>
            </div>

            {fetching ? (
              <div className="p-8 text-center text-sm text-gray-500">Cargando registros...</div>
            ) : expenses.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No hay gastos ni cargos registrados.</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {expenses.map((exp) => {
                  const linkedDebt = paymentSources.find((p) => p.id === exp.debt_id)

                  return (
                    <div
                      key={exp.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-800/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-100">{exp.title}</p>
                          <button
                            onClick={() => setEditingExpense(exp)}
                            className="text-gray-500 hover:text-indigo-400 p-1"
                            title="Editar gasto"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp)}
                            className="text-gray-500 hover:text-rose-400 p-1"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded capitalize flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5" />
                            {exp.frequency === 'one_time'
                              ? 'Única vez'
                              : exp.frequency === 'monthly'
                              ? 'Mensual'
                              : exp.frequency === 'bimonthly'
                              ? 'Bimestral'
                              : 'Anual'}
                          </span>

                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 text-gray-500" /> Corte/Fecha: {exp.date}
                          </span>

                          {linkedDebt && (
                            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded flex items-center gap-1">
                              <CreditCard className="w-2.5 h-2.5 text-indigo-400" />
                              {linkedDebt.name} {linkedDebt.cutoff_day ? `(Corte ${linkedDebt.cutoff_day})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <button
                          onClick={() => handleToggleStatus(exp)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                            exp.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                          }`}
                        >
                          {exp.status === 'paid' ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Cargado a Deuda
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" /> Pendiente de Corte
                            </>
                          )}
                        </button>

                        <div className="font-bold text-rose-400 text-base text-right">
                          -${Number(exp.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-gray-100">Editar Gasto y Fecha de Corte</h3>
              <button onClick={() => setEditingExpense(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Concepto</label>
                <input
                  type="text"
                  value={editingExpense.title}
                  onChange={(e) => setEditingExpense({ ...editingExpense, title: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Monto (MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Frecuencia</label>
                  <select
                    value={editingExpense.frequency}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, frequency: e.target.value as ExpenseFrequency })
                    }
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="bimonthly">Bimestral</option>
                    <option value="yearly">Anual</option>
                    <option value="one_time">Única vez</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Estado</label>
                  <select
                    value={editingExpense.status}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, status: e.target.value as 'pending' | 'paid' })
                    }
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Cargado / Pagado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Tarjeta Vinculada</label>
                <select
                  value={editingExpense.debt_id || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, debt_id: e.target.value || null })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">Sin tarjeta vinculada</option>
                  {paymentSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name} {source.cutoff_day ? `(Corte día ${source.cutoff_day})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Fecha Programada de Corte</label>
                <input
                  type="date"
                  value={editingExpense.date}
                  onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
