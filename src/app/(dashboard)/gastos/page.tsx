'use client'

import { useState, useEffect } from 'react'
import { getExpenses, addExpense, deleteExpense, ExpenseFrequency } from '@/lib/expenses'
import { getAccounts, Account } from '@/lib/accounts'
import { Plus, Trash2, Wallet, DollarSign, Tag, RefreshCw } from 'lucide-react'

const FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  unique: 'Única vez',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  annual: 'Anual',
}

export default function GastosPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Formulario
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Alimentos / Súper')
  const [accountId, setAccountId] = useState('')
  const [frequency, setFrequency] = useState<ExpenseFrequency>('unique')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setFetching(true)
      const [expensesData, accountsData] = await Promise.all([
        getExpenses(),
        getAccounts(),
      ])
      setExpenses(expensesData)
      setAccounts(accountsData)
      if (accountsData.length > 0 && !accountId) {
        setAccountId(accountsData[0].id!)
      }
    } catch (err) {
      console.error('Error al cargar gastos:', err)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description || !accountId) return

    setLoading(true)
    try {
      await addExpense({
        amount: parseFloat(amount),
        description,
        category,
        account_id: accountId,
        frequency,
        date: new Date().toISOString(),
      })

      setAmount('')
      setDescription('')
      setFrequency('unique')
      await loadData()
    } catch (err) {
      console.error('Error al agregar gasto:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este gasto? Se reajustará el saldo de la cuenta.')) return
    try {
      await deleteExpense(id)
      await loadData()
    } catch (err) {
      console.error('Error al eliminar gasto:', err)
    }
  }

  const totalGastos = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

  return (
    <div className="p-6 md:p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Registro de Gastos</h1>
        <p className="text-sm text-slate-400 mt-1">
          Administra tus salidas de dinero e identifica la frecuencia con la que se realizan.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400">Total Gastado Registrado</p>
          <p className="text-2xl font-bold text-rose-400 mt-0.5">
            ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 h-fit shadow-lg">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-rose-400">
            <Plus className="w-5 h-5" /> Registrar Nuevo Gasto
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Monto ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="150.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Concepto / Descripción</label>
              <input
                type="text"
                placeholder="Ej. Netflix, Súper, Gasolina"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Alimentos / Súper">Alimentos / Súper</option>
                  <option value="Servicios / Hogar">Servicios / Hogar</option>
                  <option value="Transporte / Gasolina">Transporte / Gasolina</option>
                  <option value="Entretenimiento">Entretenimiento</option>
                  <option value="Salud">Salud</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Periodicidad</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as ExpenseFrequency)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="unique">Única vez</option>
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="monthly">Mensual</option>
                  <option value="bimonthly">Bimestral</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="annual">Anual</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Cuenta / Método de Pago</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.account_type === 'credit_card' ? 'Tarjeta Crédito' : 'Efectivo/Débito'})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-500 font-medium py-2 rounded-lg text-sm transition-colors text-white disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Gasto'}
            </button>
          </form>
        </div>

        {/* Historial */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Historial Reciente de Gastos</h2>

          {fetching ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              Cargando historial...
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              No hay gastos registrados aún.
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => {
                const freqKey = (expense.frequency || 'unique') as ExpenseFrequency
                const isRecurring = freqKey !== 'unique'

                return (
                  <div
                    key={expense.id}
                    className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex justify-between items-center hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-slate-100">{expense.description}</p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                            isRecurring
                              ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {FREQUENCY_LABELS[freqKey] || 'Única vez'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-rose-400" /> {expense.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-indigo-400" /> {expense.accounts?.name || 'Cuenta'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-rose-400 text-sm">
                        -${Number(expense.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
