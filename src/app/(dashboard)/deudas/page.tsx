'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, History, CheckCircle2, Calendar, AlertCircle, X, DollarSign } from 'lucide-react'

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([])
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null)
  const [paymentsHistory, setPaymentsHistory] = useState<any[]>([])
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [showCelebration, setShowCelebration] = useState(false)

  // Estado para el modal de nueva deuda
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTotalAmount, setNewTotalAmount] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchDebts()
  }, [])

  async function fetchDebts() {
    const { data, error } = await supabase.from('debts').select('*').order('created_at', { ascending: false })
    if (!error && data) {
      setDebts(data)
    }
  }

  async function openHistory(debt: any) {
    setSelectedDebt(debt)
    const { data } = await supabase
      .from('debt_payments')
      .select('*')
      .eq('debt_id', debt.id)
      .order('payment_date', { ascending: false })
    if (data) setPaymentsHistory(data)
  }

  async function handleCreateDebt(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle || !newTotalAmount) return

    const total = Number(newTotalAmount)

    const { error } = await supabase.from('debts').insert([
      {
        title: newTitle,
        total_amount: total,
        remaining_amount: total,
      },
    ])

    if (!error) {
      setNewTitle('')
      setNewTotalAmount('')
      setIsModalOpen(false)
      fetchDebts()
    }
  }

  async function handleRegisterPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDebt || !amount) return

    const payAmount = Number(amount)
    const currentRemaining = selectedDebt.remaining_amount ?? selectedDebt.total_amount ?? 0
    const newRemaining = Math.max(0, currentRemaining - payAmount)

    // 1. Guardar abono en el historial
    await supabase.from('debt_payments').insert([
      {
        debt_id: selectedDebt.id,
        amount: payAmount,
        payment_date: paymentDate,
        comment: comment || 'Abono a deuda',
      },
    ])

    // 2. Actualizar monto restante en la deuda principal
    await supabase.from('debts').update({ remaining_amount: newRemaining }).eq('id', selectedDebt.id)

    // 3. Animación / aviso de liquidación
    if (newRemaining === 0) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 5000)
    }

    setAmount('')
    setComment('')
    openHistory({ ...selectedDebt, remaining_amount: newRemaining })
    fetchDebts()
  }

  async function handleDeleteDebt(debtId: string) {
    if (!confirm('¿Deseas eliminar esta deuda y todo su historial de abonos?')) return
    await supabase.from('debts').delete().eq('id', debtId)
    if (selectedDebt?.id === debtId) setSelectedDebt(null)
    fetchDebts()
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      {/* Banner de Celebración */}
      {showCelebration && (
        <div className="bg-emerald-500 text-slate-950 font-extrabold p-4 rounded-2xl shadow-2xl text-center animate-bounce">
          🎉 ¡Felicidades! Has liquidado por completo esta deuda.
        </div>
      )}

      {/* Encabezado y Botón Crear */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Gestión de Deudas</h1>
          <p className="text-slate-400 text-sm mt-1">Registra pagos, consulta movimientos y liquida tus saldos pendientes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Agregar Deuda
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista Principal de Deudas */}
        <div className="lg:col-span-2 space-y-4">
          {debts.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500">
              No tienes deudas registradas aún. ¡Haz clic en "Agregar Deuda" para comenzar!
            </div>
          ) : (
            debts.map((debt) => {
              const totalVal = debt.total_amount ?? 0
              const remainingVal = debt.remaining_amount ?? totalVal
              const isSettled = remainingVal <= 0
              const isSelected = selectedDebt?.id === debt.id

              return (
                <div
                  key={debt.id}
                  onClick={() => openHistory(debt)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-indigo-900/20 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-lg">{debt.title || debt.name || 'Deuda'}</span>
                      {isSettled ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Liquidada
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                          En Proceso
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">Total Inicial: ${totalVal.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">Saldo Restante</span>
                      <span className={`text-xl font-extrabold ${isSettled ? 'text-emerald-400' : 'text-amber-400'}`}>
                        ${remainingVal.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDebt(debt.id)
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                      title="Eliminar Deuda"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Historial y Abonos */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          {selectedDebt ? (
            <>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" /> Historial de {selectedDebt.title || selectedDebt.name}
                </h2>
                <p className="text-xs text-slate-400">Registra abonos o revisa los pagos guardados.</p>
              </div>

              {(selectedDebt.remaining_amount ?? selectedDebt.total_amount ?? 0) > 0 ? (
                <form onSubmit={handleRegisterPayment} className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block">Registrar Nuevo Abono</span>
                  <input
                    type="number"
                    placeholder="Monto ($)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Comentario"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20"
                  >
                    Guardar Abono
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium text-center">
                  🎉 ¡Esta deuda está completamente saldada!
                </div>
              )}

              {/* Lista de Movimientos */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {paymentsHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No hay abonos registrados.</p>
                ) : (
                  paymentsHistory.map((pay) => (
                    <div key={pay.id} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-bold text-emerald-400">+${pay.amount?.toLocaleString()}</span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar className="w-3 h-3" /> {pay.payment_date}
                        </span>
                      </div>
                      {pay.comment && <p className="text-[11px] text-slate-400 italic">{pay.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">Haz clic en una deuda para ver su historial y agregar abonos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear Nueva Deuda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-400" /> Registrar Nueva Deuda
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre / Concepto</label>
                <input
                  type="text"
                  placeholder="Ej. Tarjeta de Crédito, Préstamo Banamex"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Monto Total Inicial ($)</label>
                <input
                  type="number"
                  placeholder="Ej. 15000"
                  value={newTotalAmount}
                  onChange={(e) => setNewTotalAmount(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  Guardar Deuda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
