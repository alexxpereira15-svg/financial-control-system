'use client'

import { useState, useEffect } from 'react'
import {
  addIncome,
  getIncomes,
  updateIncome,
  deleteIncome,
  Income,
} from '@/lib/incomes'
import { getAccounts, Account } from '@/lib/accounts'
import { Pencil, Trash2, X, Wallet } from 'lucide-react'

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<any[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Campos del formulario
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'fixed' | 'variable'>('variable')
  const [frequency, setFrequency] = useState('monthly')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [accountId, setAccountId] = useState('')

  // Estado para modal de edición
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setFetching(true)
      const [incomesData, accountsData] = await Promise.all([
        getIncomes(),
        getAccounts(),
      ])
      setIncomes(incomesData)
      setAccounts(accountsData)

      // Seleccionar por defecto la primera cuenta (o Efectivo si existe)
      if (accountsData.length > 0 && !accountId) {
        const cashAcc = accountsData.find((a) => a.account_type === 'cash')
        setAccountId(cashAcc ? cashAcc.id! : accountsData[0].id!)
      }
    } catch (err) {
      console.error('Error al cargar datos de ingresos:', err)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount || !accountId) return

    setLoading(true)
    try {
      await addIncome({
        title,
        amount: parseFloat(amount),
        type,
        frequency,
        date,
        account_id: accountId,
      })

      // Limpiar formulario y recargar historial
      setTitle('')
      setAmount('')
      setDate(new Date().toISOString().split('T')[0])
      await loadAllData()
    } catch (err) {
      console.error('Error al agregar ingreso:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingIncome || !editingIncome.id) return

    try {
      const old = incomes.find((i) => i.id === editingIncome.id)
      await updateIncome(
        editingIncome.id,
        {
          title: editingIncome.title,
          amount: Number(editingIncome.amount),
          type: editingIncome.type,
          frequency: editingIncome.frequency,
          date: editingIncome.date,
          account_id: editingIncome.account_id,
        },
        old
      )

      setEditingIncome(null)
      await loadAllData()
    } catch (err) {
      console.error('Error al actualizar ingreso:', err)
    }
  }

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('¿Estás seguro de eliminar este ingreso? Se restará del saldo de la cuenta.')) return
    try {
      await deleteIncome(id)
      await loadAllData()
    } catch (err) {
      console.error('Error al eliminar ingreso:', err)
    }
  }

  // Cálculo del total acumulado
  const totalIncomes = incomes.reduce((acc, curr) => acc + Number(curr.amount), 0)

  return (
    <div className="p-6 md:p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Gestión de Ingresos</h1>
        <p className="text-sm text-slate-400 mt-1">
          Registra y administra tus sueldos, comisiones o ingresos adicionales en MXN.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de registro */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg h-fit space-y-4">
          <h2 className="text-lg font-semibold text-emerald-400">Nuevo Ingreso</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Concepto / Nombre
              </label>
              <input
                type="text"
                placeholder="Ej. Salario, Comisión de venta"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Monto (MXN)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Cuenta de Destino
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.account_type === 'cash' ? 'Efectivo' : 'Débito / Cuenta'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Tipo de Ingreso
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'fixed' | 'variable')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="variable">Variable</option>
                  <option value="fixed">Fijo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Frecuencia
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="monthly">Mensual</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="weekly">Semanal</option>
                  <option value="one_time">Única vez</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 font-medium py-2 rounded-lg text-sm transition-colors text-white disabled:opacity-50 mt-2"
            >
              {loading ? 'Guardando...' : 'Guardar Ingreso'}
            </button>
          </form>
        </div>

        {/* Historial e Indicadores */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-center shadow-md">
            <div>
              <p className="text-xs text-slate-400 font-medium">Ingresos Totales Registrados</p>
              <p className="text-3xl font-bold mt-1 text-emerald-400">
                ${totalIncomes.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              {incomes.length} registros
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-semibold text-sm text-slate-100">Historial de Ingresos</h3>
            </div>

            {fetching ? (
              <div className="p-8 text-center text-sm text-slate-500">Cargando registros...</div>
            ) : incomes.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Aún no has registrado ningún ingreso.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {incomes.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm text-slate-100">{inc.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-semibold">
                          {inc.type === 'fixed' ? 'Fijo' : 'Variable'}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded capitalize">
                          {inc.frequency}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-emerald-400" />
                          {inc.accounts?.name || 'Cuenta'}
                        </span>
                        <span className="text-[10px] text-slate-500">{inc.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="font-bold text-emerald-400 text-base">
                        +${Number(inc.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingIncome(inc)}
                          className="text-slate-500 hover:text-emerald-400 p-1 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inc.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {editingIncome && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100">Editar Ingreso</h3>
              <button onClick={() => setEditingIncome(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Concepto</label>
                <input
                  type="text"
                  value={editingIncome.title}
                  onChange={(e) => setEditingIncome({ ...editingIncome, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Monto (MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingIncome.amount}
                  onChange={(e) => setEditingIncome({ ...editingIncome, amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cuenta de Destino</label>
                <select
                  value={editingIncome.account_id || ''}
                  onChange={(e) => setEditingIncome({ ...editingIncome, account_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tipo</label>
                  <select
                    value={editingIncome.type}
                    onChange={(e) =>
                      setEditingIncome({ ...editingIncome, type: e.target.value as 'fixed' | 'variable' })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="variable">Variable</option>
                    <option value="fixed">Fijo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Frecuencia</label>
                  <select
                    value={editingIncome.frequency}
                    onChange={(e) => setEditingIncome({ ...editingIncome, frequency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="weekly">Semanal</option>
                    <option value="one_time">Única vez</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Fecha</label>
                <input
                  type="date"
                  value={editingIncome.date}
                  onChange={(e) => setEditingIncome({ ...editingIncome, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingIncome(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
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
