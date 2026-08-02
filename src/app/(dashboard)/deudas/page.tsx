'use client'

import { useState, useEffect } from 'react'
import { addDebt, getDebts, recordDebtPayment, Debt } from '@/lib/debts'

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Formulario de nueva deuda
  const [name, setName] = useState('')
  const [type, setType] = useState<Debt['type']>('credit_card')
  const [initialAmount, setInitialAmount] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [annualInterestRate, setAnnualInterestRate] = useState('')
  const [minimumPayment, setMinimumPayment] = useState('')
  const [dueDate, setDueDate] = useState('15')

  // Estado para modal/input de abono
  const [payingDebtId, setPayingDebtId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')

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
    if (!name || !currentBalance || !annualInterestRate) return

    setLoading(true)
    try {
      await addDebt({
        name,
        type,
        initial_amount: parseFloat(initialAmount || currentBalance),
        current_balance: parseFloat(currentBalance),
        annual_interest_rate: parseFloat(annualInterestRate),
        minimum_payment: parseFloat(minimumPayment || '0'),
        due_date: parseInt(dueDate, 10),
      })

      // Limpiar formulario
      setName('')
      setInitialAmount('')
      setCurrentBalance('')
      setAnnualInterestRate('')
      setMinimumPayment('')
      await loadDebts()
    } catch (err) {
      console.error('Error al crear deuda:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMakePayment = async (debt: Debt) => {
    if (!paymentAmount || !debt.id) return
    try {
      await recordDebtPayment(debt.id, debt.current_balance, parseFloat(paymentAmount))
      setPayingDebtId(null)
      setPaymentAmount('')
      await loadDebts()
    } catch (err) {
      console.error('Error al registrar pago:', err)
    }
  }

  // Totales
  const totalBalance = debts.reduce((acc, curr) => acc + Number(curr.current_balance), 0)
  const totalMinPayments = debts.reduce((acc, curr) => acc + Number(curr.minimum_payment), 0)

  return (
    <div className="p-6 md:p-8 bg-gray-950 min-h-screen text-gray-100 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administrador de Deudas</h1>
        <p className="text-sm text-gray-400 mt-1">
          Estrategia de pago optimizada usando el <strong className="text-amber-400">Método Avalancha</strong> (prioriza la mayor tasa de interés).
        </p>
      </div>

      {/* Indicadores generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Deuda Total Acumulada</p>
          <p className="text-3xl font-bold mt-1 text-rose-400">
            ${totalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Compromiso Mínimo Mensual</p>
          <p className="text-3xl font-bold mt-1 text-amber-400">
            ${totalMinPayments.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de registro */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg h-fit">
          <h2 className="text-lg font-semibold mb-4">Registrar Crédito / Deuda</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Nombre de la deuda / Tarjeta
              </label>
              <input
                type="text"
                placeholder="Ej. Tarjeta Banregio, Préstamo Personal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Debt['type'])}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="credit_card">Tarjeta de Crédito</option>
                  <option value="personal_loan">Préstamo Personal</option>
                  <option value="mortgage">Hipotecario / Auto</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Tasa Interés Anual (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej. 45.5"
                  value={annualInterestRate}
                  onChange={(e) => setAnnualInterestRate(e.target.value)}
                  required
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Monto Inicial
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Saldo Actual
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  required
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Pago Mínimo
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={minimumPayment}
                  onChange={(e) => setMinimumPayment(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Día Límite de Pago
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-500 text-gray-950 font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Guardando...' : 'Agregar a la Avalancha'}
            </button>
          </form>
        </div>

        {/* Lista de deudas con prioridad Avalancha */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-semibold text-sm">Prioridad de Pago (Avalancha)</h3>
            <span className="text-xs text-amber-400 font-medium">
              🔥 Ordenado por mayor tasa de interés
            </span>
          </div>

          {fetching ? (
            <div className="p-8 bg-gray-900 border border-gray-800 rounded-2xl text-center text-sm text-gray-500">
              Cargando estrategia de deudas...
            </div>
          ) : debts.length === 0 ? (
            <div className="p-8 bg-gray-900 border border-gray-800 rounded-2xl text-center text-sm text-gray-500">
              ¡Felicidades! No tienes deudas registradas.
            </div>
          ) : (
            <div className="space-y-4">
              {debts.map((debt, index) => {
                const initial = Number(debt.initial_amount) || Number(debt.current_balance)
                const current = Number(debt.current_balance)
                const paidPercentage = Math.min(100, Math.max(0, ((initial - current) / initial) * 100))

                return (
                  <div
                    key={debt.id}
                    className={`bg-gray-900 border rounded-2xl p-5 relative overflow-hidden transition-all ${
                      index === 0
                        ? 'border-amber-500/50 shadow-lg shadow-amber-500/5'
                        : 'border-gray-800'
                    }`}
                  >
                    {/* Badge de Prioridad #1 */}
                    {index === 0 && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-gray-950 text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
                        Atacar Primero (Prioridad 1)
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-base text-gray-100">{debt.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Tasa Anual: <span className="text-amber-400 font-semibold">{debt.annual_interest_rate}%</span> | Día límite: {debt.due_date} de cada mes
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-gray-400">Saldo Pendiente:</span>
                        <p className="text-xl font-bold text-rose-400">
                          ${current.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                        </p>
                      </div>
                    </div>

                    {/* Barra de progreso de liquidación */}
                    <div className="space-y-1 my-3">
                      <div className="flex justify-between text-[11px] text-gray-400">
                        <span>Progreso de Pago</span>
                        <span>{paidPercentage.toFixed(1)}% Pagado</span>
                      </div>
                      <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-800">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${paidPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Acciones de abono */}
                    <div className="pt-3 border-t border-gray-800/60 flex flex-col sm:flex-row justify-between items-center gap-3">
                      <span className="text-xs text-gray-400">
                        Pago mínimo sugerido: <strong className="text-gray-200">${Number(debt.minimum_payment).toLocaleString('es-MX')} MXN</strong>
                      </span>

                      {payingDebtId === debt.id ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="number"
                            placeholder="Monto a abonar"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1 text-xs w-28 focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            onClick={() => handleMakePayment(debt)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setPayingDebtId(null)}
                            className="text-xs text-gray-400 hover:text-gray-200 px-1"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPayingDebtId(debt.id!)}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-700 transition-colors w-full sm:w-auto text-center"
                        >
                          Abonar a Deuda
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