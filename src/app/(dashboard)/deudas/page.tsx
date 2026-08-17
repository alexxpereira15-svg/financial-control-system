'use client'

import { useState, useEffect } from 'react'
import { getDebts, addDebt, updateDebt, deleteDebt, Debt } from '@/lib/debts'
import { CreditCard, Plus, Trash2, Pencil, Calendar, AlertCircle } from 'lucide-react'

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Formulario de nueva tarjeta / deuda
  const [name, setName] = useState('')
  const [debtType, setDebtType] = useState<'credit_card' | 'loan' | 'personal'>('credit_card')
  const [creditLimit, setCreditLimit] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [cutoffDay, setCutoffDay] = useState('')
  const [paymentDueDay, setPaymentDueDay] = useState('')

  useEffect(() => {
    loadDebts()
  }, [])

  const loadDebts = async () => {
    try {
      const data = await getDebts()
      setDebts(data)
    } catch (err) {
      console.error('Error al cargar deudas:', err)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    try {
      await addDebt({
        name,
        debt_type: debtType,
        credit_limit: debtType === 'credit_card' && creditLimit ? parseFloat(creditLimit) : null,
        current_balance: currentBalance ? parseFloat(currentBalance) : 0,
        cutoff_day: debtType === 'credit_card' && cutoffDay ? parseInt(cutoffDay) : null,
        payment_due_day: debtType === 'credit_card' && paymentDueDay ? parseInt(paymentDueDay) : null,
      })

      setName('')
      setCreditLimit('')
      setCurrentBalance('')
      setCutoffDay('')
      setPaymentDueDay('')
      await loadDebts()
    } catch (err) {
      console.error('Error al agregar tarjeta/deuda:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('¿Deseas eliminar este registro de deuda/tarjeta?')) return
    try {
      await deleteDebt(id)
      await loadDebts()
    } catch (err) {
      console.error('Error al eliminar:', err)
    }
  }

  return (
    <div className="p-6 md:p-8 bg-gray-950 min-h-screen text-gray-100 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tarjetas de Crédito y Deudas</h1>
        <p className="text-sm text-gray-400 mt-1">
          Configura tus líneas de crédito, límites, días de corte y fechas de pago para enlazar con tus gastos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario para dar de alta Tarjetas/Deudas */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg h-fit space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" /> Registrar Tarjeta / Deuda
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Nombre / Institución</label>
              <input
                type="text"
                placeholder="Ej. Nu México, Santander Fiesta, Préstamo Banamex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Tipo de Registro</label>
              <select
                value={debtType}
                onChange={(e) => setDebtType(e.target.value as any)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none text-white"
              >
                <option value="credit_card">Tarjeta de Crédito</option>
                <option value="loan">Préstamo / Crédito Personal</option>
                <option value="personal">Deuda Personal / Otra</option>
              </select>
            </div>

            {debtType === 'credit_card' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Límite de Crédito (MXN)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 25000.00"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Día de Corte</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ej. 12"
                      value={cutoffDay}
                      onChange={(e) => setCutoffDay(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Día Límite Pago</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ej. 2"
                      value={paymentDueDay}
                      onChange={(e) => setPaymentDueDay(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Deuda Actual / Saldo Usado (MXN)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50 text-white"
            >
              {loading ? 'Guardando...' : 'Guardar Tarjeta / Deuda'}
            </button>
          </form>
        </div>

        {/* Tarjetas Registradas */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Resumen de Cuentas y Tarjetas</h2>

          {fetching ? (
            <div className="p-8 text-center text-sm text-gray-500 bg-gray-900 rounded-2xl border border-gray-800">
              Cargando cuentas...
            </div>
          ) : debts.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 bg-gray-900 rounded-2xl border border-gray-800">
              No tienes tarjetas ni deudas registradas aún.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {debts.map((item) => {
                const limit = Number(item.credit_limit || 0)
                const balance = Number(item.current_balance || 0)
                const available = Math.max(0, limit - balance)
                const usagePercentage = limit > 0 ? Math.min(100, (balance / limit) * 100) : 0

                return (
                  <div
                    key={item.id}
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 relative shadow-lg hover:border-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-400" />
                        <div>
                          <h3 className="font-semibold text-sm text-gray-100">{item.name}</h3>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                            {item.debt_type === 'credit_card' ? 'Tarjeta de Crédito' : 'Crédito / Deuda'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-500 hover:text-rose-400 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.debt_type === 'credit_card' && limit > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Uso de Línea</span>
                          <span className="font-semibold text-gray-200">{usagePercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              usagePercentage > 85
                                ? 'bg-rose-500'
                                : usagePercentage > 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${usagePercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/80 text-xs">
                      <div>
                        <p className="text-gray-400">Deuda / Gastado</p>
                        <p className="font-bold text-rose-400 text-sm mt-0.5">
                          ${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      {item.debt_type === 'credit_card' && (
                        <div>
                          <p className="text-gray-400">Crédito Disponible</p>
                          <p className="font-bold text-emerald-400 text-sm mt-0.5">
                            ${available.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>

                    {item.debt_type === 'credit_card' && (item.cutoff_day || item.payment_due_day) && (
                      <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/60 flex items-center justify-between text-[11px] text-gray-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          Corte: <strong>Día {item.cutoff_day || 'N/A'}</strong>
                        </span>
                        <span>
                          Límite Pago: <strong>Día {item.payment_due_day || 'N/A'}</strong>
                        </span>
                      </div>
                    )}
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
