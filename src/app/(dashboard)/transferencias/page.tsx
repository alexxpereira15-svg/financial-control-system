'use client'

import { useState, useEffect } from 'react'
import { getAccounts, Account } from '@/lib/accounts'
import { getDebts, Debt } from '@/lib/debts'
import { addTransfer, getTransfers, updateTransfer, deleteTransfer } from '@/lib/transfers'
import { ArrowRightLeft, Send, Trash2, Pencil, X, DollarSign } from 'lucide-react'

export default function TransferenciasPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [history, setHistory] = useState<any[]>([])
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Estado para edición
  const [editingTransfer, setEditingTransfer] = useState<any | null>(null)

  // Formulario de Alta
  const [fromAccountId, setFromAccountId] = useState('')
  const [destinationType, setDestinationType] = useState<'account' | 'debt'>('account')
  const [toAccountId, setToAccountId] = useState('')
  const [toDebtId, setToDebtId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setFetching(true)
      const [accountsData, debtsData, transfersData] = await Promise.all([
        getAccounts(),
        getDebts(),
        getTransfers(),
      ])

      setAccounts(accountsData)
      setDebts(debtsData)
      setHistory(transfersData)

      if (accountsData.length > 0 && !fromAccountId) {
        const cashAcc = accountsData.find((a) => a.account_type !== 'credit_card')
        setFromAccountId(cashAcc ? cashAcc.id! : accountsData[0].id!)
      }
    } catch (err) {
      console.error('Error al cargar transferencias:', err)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description || !fromAccountId) return

    if (destinationType === 'account' && !toAccountId) return
    if (destinationType === 'debt' && !toDebtId) return

    setLoading(true)
    try {
      await addTransfer({
        from_account_id: fromAccountId,
        to_account_id: destinationType === 'account' ? toAccountId : null,
        to_debt_id: destinationType === 'debt' ? toDebtId : null,
        amount: parseFloat(amount),
        description,
        date,
      })

      setAmount('')
      setDescription('')
      await loadData()
    } catch (err) {
      console.error('Error al realizar movimiento:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTransfer || !editingTransfer.id) return

    setLoading(true)
    try {
      const old = history.find((t) => t.id === editingTransfer.id)
      await updateTransfer(
        editingTransfer.id,
        {
          from_account_id: editingTransfer.from_account_id,
          to_account_id: editingTransfer.to_account_id,
          to_debt_id: editingTransfer.to_debt_id,
          amount: Number(editingTransfer.amount),
          description: editingTransfer.description,
          date: editingTransfer.date,
        },
        old
      )

      setEditingTransfer(null)
      await loadData()
    } catch (err) {
      console.error('Error al actualizar transferencia:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este movimiento? Se restablecerán los saldos en las cuentas implicadas.'))
      return

    try {
      await deleteTransfer(id)
      await loadData()
    } catch (err) {
      console.error('Error al eliminar transferencia:', err)
    }
  }

  const totalTransferred = history.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

  return (
    <div className="p-6 md:p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Pagos de Deuda y Transferencias</h1>
        <p className="text-sm text-slate-400 mt-1">
          Mueve dinero entre tus cuentas o realiza abonos a tus tarjetas y préstamos sin alterar tu flujo neto.
        </p>
      </div>

      {/* Tarjeta de Resumen */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400">Total Movilizado en Traspasos</p>
          <p className="text-2xl font-bold text-indigo-400 mt-0.5">
            ${totalTransferred.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 h-fit shadow-lg">
          <h2 className="text-lg font-semibold text-indigo-400 flex items-center gap-2">
            <Send className="w-5 h-5" /> Registrar Pago o Traspaso
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Origen (¿De qué cuenta sale el dinero?)
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {accounts
                  .filter((a) => a.account_type !== 'credit_card')
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (${Number(acc.current_balance || 0).toLocaleString('es-MX')} MXN)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Destino</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDestinationType('account')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    destinationType === 'account'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Tarjeta / Cuenta
                </button>
                <button
                  type="button"
                  onClick={() => setDestinationType('debt')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    destinationType === 'debt'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Préstamo / Pasivo
                </button>
              </div>
            </div>

            {destinationType === 'account' ? (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Cuenta / Tarjeta Destino
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Seleccionar --</option>
                  {accounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.account_type === 'credit_card' ? 'Tarjeta Crédito' : 'Cuenta/Débito'})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Préstamo / Deuda a Pagar
                </label>
                <select
                  value={toDebtId}
                  onChange={(e) => setToDebtId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Seleccionar --</option>
                  {debts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Deuda actual: ${Number(d.current_balance || 0).toLocaleString('es-MX')} MXN)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Monto a Transferir ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Concepto / Nota</label>
              <input
                type="text"
                placeholder="Ej. Pago mensual tarjeta, Abono a capital"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-medium py-2.5 rounded-lg text-sm transition-colors text-white disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Realizar Transferencia / Pago'}
            </button>
          </form>
        </div>

        {/* Historial */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Historial de Pagos y Movimientos Internos</h2>

          {fetching ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              Cargando historial...
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              Aún no has registrado ningún pago o traspaso interno.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((t) => {
                const destinationName = t.to_account?.name || t.to_debt?.name || 'Destino'

                return (
                  <div
                    key={t.id}
                    className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex justify-between items-center hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm text-slate-100">{t.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-slate-300 font-medium">{t.from_account?.name}</span>
                        <ArrowRightLeft className="w-3 h-3 text-indigo-400" />
                        <span className="text-indigo-300 font-medium">{destinationName}</span>
                        <span className="text-[10px] text-slate-500">({t.date})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="font-bold text-indigo-400 text-sm">
                        ${Number(t.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingTransfer(t)}
                          className="text-slate-500 hover:text-indigo-400 p-1 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición */}
      {editingTransfer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100">Editar Pago / Traspaso</h3>
              <button onClick={() => setEditingTransfer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Concepto / Nota</label>
                <input
                  type="text"
                  value={editingTransfer.description}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTransfer.amount}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cuenta Origen</label>
                <select
                  value={editingTransfer.from_account_id}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, from_account_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {accounts
                    .filter((a) => a.account_type !== 'credit_card')
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Fecha</label>
                <input
                  type="date"
                  value={editingTransfer.date}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTransfer(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
