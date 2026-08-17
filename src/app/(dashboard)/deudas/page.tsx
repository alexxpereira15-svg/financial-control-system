'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import confetti from 'canvas-confetti'
import { CreditCard, Plus, Trash2, History, CheckCircle2, Calendar, AlertCircle } from 'lucide-react'

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([])
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null)
  const [paymentsHistory, setPaymentsHistory] = useState<any[]>([])
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])

  const supabase = createClient()

  useEffect(() => {
    fetchDebts()
  }, [])

  async function fetchDebts() {
    const { data } = await supabase.from('debts').select('*').order('created_at', { ascending: false })
    if (data) setDebts(data)
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

  async function handleRegisterPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDebt || !amount) return

    const payAmount = Number(amount)
    const newRemaining = Math.max(0, selectedDebt.remaining_amount - payAmount)

    // 1. Guardar abono en la tabla de historial
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

    // 3. Celebración de felicitación si la deuda llegó a $0 🎉
    if (newRemaining === 0) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Gestión de Deudas</h1>
        <p className="text-slate-400 text-sm mt-1">Registra pagos, consulta movimientos y liquida tus saldos pendientes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista Principal de Deudas */}
        <div className="lg:col-span-2 space-y-4">
          {debts.map((debt) => {
            const isSettled = debt.remaining_amount <= 0
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
                    <span className="font-bold text-white text-lg">{debt.title}</span>
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
                  <p className="text-xs text-slate-400">Total Inicial: ${debt.total_amount?.toLocaleString()}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Saldo Restante</span>
                    <span className={`text-xl font-extrabold ${isSettled ? 'text-emerald-400' : 'text-amber-400'}`}>
                      ${debt.remaining_amount?.toLocaleString()}
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
          })}
        </div>

        {/* Historial Lateral */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          {selectedDebt ? (
            <>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" /> Historial de {selectedDebt.title}
                </h2>
                <p className="text-xs text-slate-400">Selecciona o registra abonos para este concepto.</p>
              </div>

              {selectedDebt.remaining_amount > 0 ? (
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

              {/* Movimientos Registrados */}
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
              <p className="text-xs">Haz clic en una deuda para ver o agregar sus abonos e historial.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
