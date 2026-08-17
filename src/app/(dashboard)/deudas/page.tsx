'use client'

import { useState, useEffect } from 'react'
import { getDebts, addDebt, updateDebt, deleteDebt, Debt } from '@/lib/debts'
import { getAccounts, Account } from '@/lib/accounts'
import {
  CreditCard,
  Plus,
  Trash2,
  Pencil,
  AlertCircle,
  Calendar,
  DollarSign,
  X,
  TrendingUp,
} from 'lucide-react'

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [creditAccounts, setCreditAccounts] = useState<Account[]>([])
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)

  // Estado para edición
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)

  // Formulario
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [minimumPayment, setMinimumPayment] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [interestRate, setInterestRate] = useState('')

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setFetching(true)
      const [debtsData, accountsData] = await Promise.all([getDebts(), getAccounts()])
      setDebts(debtsData)
      // Filtramos las cuentas que son tarjetas de crédito con saldo pendiente/utilizado
      setCreditAccounts(accountsData.filter((a) => a.account_type === 'credit_card'))
    } catch (err) {
      console.error('Error al cargar deudas:', err)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !currentBalance) return

    setLoading(true)
    try {
      const balance = parseFloat(currentBalance)
      const total = totalAmount ? parseFloat(totalAmount) : balance

      await addDebt({
        name,
        description,
        total_amount: total,
        current_balance: balance,
        minimum_payment: minimumPayment ? parseFloat(minimumPayment) : null,
        due_day: dueDay ? parseInt(dueDay) : null,
        interest_rate: interestRate ? parseFloat(interestRate) : null,
      })

      // Limpiar formulario
      setName('')
      setDescription('')
      setTotalAmount('')
      setCurrentBalance('')
      setMinimumPayment('')
      setDueDay('')
      setInterestRate('')
      await loadAllData()
    } catch (err) {
      console.error('Error al agregar deuda:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDebt || !editingDebt.id) return

    try {
      await updateDebt(editingDebt.id, {
        name: editingDebt.name,
        description: editingDebt.description,
        total_amount: Number(editingDebt.total_amount),
        current_balance: Number(editingDebt.current_balance),
        minimum_payment: editingDebt.minimum_payment ? Number(editingDebt.minimum_payment) : null,
        due_day: editingDebt.due_day ? Number(editingDebt.due_day) : null,
        interest_rate: editingDebt.interest_rate ? Number(editingDebt.interest_rate) : null,
      })

      setEditingDebt(null)
      await loadAllData()
    } catch (err) {
      console.error('Error al actualizar deuda:', err)
    }
  }

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('¿Estás seguro de eliminar este registro de deuda?')) return
    try {
      await deleteDebt(id)
      await loadAllData()
    } catch (err) {
      console.error('Error al eliminar deuda:', err)
    }
  }

  // Cálculos consolidados
  const totalCardsDebt = creditAccounts.reduce((acc, card) => acc + Number(card.current_balance || 0), 0)
  const totalDirectDebt = debts.reduce((acc, debt) => acc + Number(debt.current_balance || 0), 0)
  const grandTotalDebt = totalCardsDebt + totalDirectDebt

  const totalMinPaymentCards = creditAccounts.reduce((acc, card) => acc + Number(card.minimum_payment || 0), 0)
  const totalMinPaymentDirect = debts.reduce((acc, debt) => acc + Number(debt.minimum_payment || 0), 0)
  const grandTotalMinPayment = totalMinPaymentCards + totalMinPaymentDirect

  return (
    <div className="p-6 md:p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Consolidado de Deudas</h1>
        <p className="text-sm text-slate-400 mt-1">
          Visualiza el pasivo acumulado de tus tarjetas de crédito y registra préstamos personales o financiamientos fijos.
        </p>
      </div>

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Deuda Total Acumulada</p>
            <p className="text-2xl font-bold text-rose-400 mt-0.5">
              ${grandTotalDebt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Pagos Mínimos / Requeridos del Mes</p>
            <p className="text-2xl font-bold text-amber-400 mt-0.5">
              ${grandTotalMinPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Sección 1: Deudas automáticas provenientes de Tarjetas de Crédito */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-indigo-300">
          <CreditCard className="w-5 h-5" /> Deudas por Tarjetas de Crédito (Desde Cuentas)
        </h2>

        {fetching ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            Cargando tarjetas...
          </div>
        ) : creditAccounts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            No tienes tarjetas de crédito registradas en la sección Cuentas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditAccounts.map((acc) => {
              const current = Number(acc.current_balance || 0)
              const minPay = Number(acc.minimum_payment || 0)

              return (
                <div key={acc.id} className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-100">{acc.name}</h3>
                      <p className="text-[10px] text-slate-400 uppercase">Tarjeta de Crédito</p>
                    </div>
                    <span className="text-xs bg-purple-950/80 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-medium">
                      Automático
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <p className="text-slate-400">Saldo Gastado / Deuda</p>
                      <p className="font-bold text-rose-400 text-sm mt-0.5">
                        ${current.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Pago Mínimo Est.</p>
                      <p className="font-semibold text-amber-300 text-sm mt-0.5">
                        ${minPay.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {acc.payment_due_day && (
                    <div className="text-[11px] bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-400" /> Día Límite Pago:
                      </span>
                      <strong>Día {acc.payment_due_day}</strong>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sección 2: Préstamos y Deudas Directas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 border-t border-slate-800/80">
        {/* Formulario de Alta */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg h-fit space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-purple-300">
            <Plus className="w-5 h-5" /> Registrar Préstamo o Deuda Directa
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Concepto</label>
              <input
                type="text"
                placeholder="Ej. Préstamo Personal BBVA, Crédito Automotriz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Descripción / Nota</label>
              <input
                type="text"
                placeholder="Ej. Préstamo a 12 meses para remodelación"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Monto Original</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="50000.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Saldo Pendiente</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="35000.00"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Pago Mensual</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="2500.00"
                  value={minimumPayment}
                  onChange={(e) => setMinimumPayment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Día de Pago</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="15"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Interés (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="18.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 font-medium py-2 rounded-lg text-sm transition-colors text-white disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Deuda'}
            </button>
          </form>
        </div>

        {/* Lista de Deudas Directas */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Préstamos y Deudas Directas Registradas</h2>

          {fetching ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              Cargando registros...
            </div>
          ) : debts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              No tienes préstamos independientes ni deudas directas registradas.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {debts.map((debt) => {
                const total = Number(debt.total_amount || debt.current_balance)
                const current = Number(debt.current_balance)
                const paidPercentage = total > 0 ? Math.max(0, Math.min(100, ((total - current) / total) * 100)) : 0

                return (
                  <div
                    key={debt.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md relative hover:border-slate-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-sm text-slate-100">{debt.name}</h3>
                        {debt.description && <p className="text-xs text-slate-400 mt-0.5">{debt.description}</p>}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingDebt(debt)}
                          className="text-slate-500 hover:text-purple-400 p-1 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(debt.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Barra de Progreso de Pago */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Avance de Pagos</span>
                        <span className="font-semibold text-purple-300">{paidPercentage.toFixed(1)}% liquidado</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-purple-500 h-full transition-all duration-300"
                          style={{ width: `${paidPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div>
                        <p className="text-slate-400">Saldo Pendiente</p>
                        <p className="font-bold text-rose-400 text-sm mt-0.5">
                          ${current.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Monto Inicial</p>
                        <p className="font-semibold text-slate-300 text-sm mt-0.5">
                          ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {(debt.due_day || debt.minimum_payment) && (
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 flex items-center justify-between text-[11px] text-slate-300">
                        {debt.due_day ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-purple-400" /> Paga el día: <strong>{debt.due_day}</strong>
                          </span>
                        ) : (
                          <span />
                        )}
                        {debt.minimum_payment && (
                          <span>
                            Pago Fijo: <strong>${Number(debt.minimum_payment).toLocaleString('es-MX')}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición de Deuda Directa */}
      {editingDebt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100">Editar Deuda Directa</h3>
              <button onClick={() => setEditingDebt(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingDebt.name}
                  onChange={(e) => setEditingDebt({ ...editingDebt, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Descripción</label>
                <input
                  type="text"
                  value={editingDebt.description || ''}
                  onChange={(e) => setEditingDebt({ ...editingDebt, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Monto Original</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingDebt.total_amount || ''}
                    onChange={(e) => setEditingDebt({ ...editingDebt, total_amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Saldo Pendiente</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingDebt.current_balance}
                    onChange={(e) => setEditingDebt({ ...editingDebt, current_balance: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Pago Fijo Mensual</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingDebt.minimum_payment || ''}
                    onChange={(e) =>
                      setEditingDebt({
                        ...editingDebt,
                        minimum_payment: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Día de Pago</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editingDebt.due_day || ''}
                    onChange={(e) =>
                      setEditingDebt({
                        ...editingDebt,
                        due_day: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDebt(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
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
