'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  Trash2,
  History,
  CheckCircle2,
  Calendar,
  AlertCircle,
  X,
  DollarSign,
  Percent,
  Flame,
  ArrowUpRight,
  ArrowDownLeft,
  Pencil,
  Check,
} from 'lucide-react'

// Helper para formatear siempre como $0,000.00
const formatCurrency = (amount: number | null | undefined) => {
  const val = Number(amount) || 0
  return '$' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([])
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null)
  const [paymentsHistory, setPaymentsHistory] = useState<any[]>([])

  // Estado para movimientos (Abono o Cargo)
  const [movementType, setMovementType] = useState<'payment' | 'charge'>('payment')
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [showCelebration, setShowCelebration] = useState(false)

  // Estado para edición inline de un movimiento
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editComment, setEditComment] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editMovementType, setEditMovementType] = useState<'payment' | 'charge'>('payment')

  // Estado para el modal de nueva deuda
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    debt_type: 'Tarjeta de Crédito',
    initial_amount: '',
    current_balance: '',
    annual_interest_rate: '',
    minimum_payment: '',
    due_date: '',
  })

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

  // Identificar la deuda de mayor prioridad (mayor tasa de interés entre las activas)
  const highestInterestDebtId = debts
    .filter((d) => (d.current_balance ?? d.initial_amount ?? 0) > 0 && d.annual_interest_rate)
    .sort((a, b) => (Number(b.annual_interest_rate) || 0) - (Number(a.annual_interest_rate) || 0))[0]?.id

  async function openHistory(debt: any) {
    setSelectedDebt(debt)
    setEditingPaymentId(null)
    const { data } = await supabase
      .from('debt_payments')
      .select('*')
      .eq('debt_id', debt.id)
      .order('payment_date', { ascending: false })
    if (data) setPaymentsHistory(data)
  }

  async function handleCreateDebt(e: React.FormEvent) {
    e.preventDefault()

    const initialAmountNum = Number(formData.initial_amount) || 0
    const currentBalanceNum = formData.current_balance !== '' ? Number(formData.current_balance) : initialAmountNum

    const newDebt = {
      name: formData.name,
      debt_type: formData.debt_type,
      initial_amount: initialAmountNum,
      current_balance: currentBalanceNum,
      annual_interest_rate: formData.annual_interest_rate ? Number(formData.annual_interest_rate) : null,
      minimum_payment: formData.minimum_payment ? Number(formData.minimum_payment) : null,
      due_date: formData.due_date || null,
    }

    const { error } = await supabase.from('debts').insert([newDebt])

    if (!error) {
      setFormData({
        name: '',
        debt_type: 'Tarjeta de Crédito',
        initial_amount: '',
        current_balance: '',
        annual_interest_rate: '',
        minimum_payment: '',
        due_date: '',
      })
      setIsModalOpen(false)
      fetchDebts()
    } else {
      console.error('Error al insertar deuda:', error)
    }
  }

  async function handleRegisterMovement(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDebt || !amount) return

    const inputAmount = Number(amount)
    if (isNaN(inputAmount) || inputAmount <= 0) return

    const isPayment = movementType === 'payment'
    const storedAmount = isPayment ? inputAmount : -inputAmount

    const currentBalance = selectedDebt.current_balance ?? selectedDebt.initial_amount ?? 0
    const newBalance = isPayment ? Math.max(0, currentBalance - inputAmount) : currentBalance + inputAmount

    const defaultComment = isPayment ? 'Abono a deuda' : 'Cargo / Gasto recurrente'

    const { error: paymentError } = await supabase.from('debt_payments').insert([
      {
        debt_id: selectedDebt.id,
        amount: storedAmount,
        payment_date: paymentDate,
        comment: comment || defaultComment,
      },
    ])

    if (paymentError) {
      console.error('Error al registrar movimiento:', paymentError)
      alert(`Error al registrar el movimiento: ${paymentError.message}`)
      return
    }

    const { error: updateError } = await supabase
      .from('debts')
      .update({ current_balance: newBalance })
      .eq('id', selectedDebt.id)

    if (updateError) {
      console.error('Error al actualizar el saldo de la deuda:', updateError)
    }

    if (isPayment && newBalance === 0) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 5000)
    }

    setAmount('')
    setComment('')
    const updatedSelected = { ...selectedDebt, current_balance: newBalance }
    setSelectedDebt(updatedSelected)
    openHistory(updatedSelected)
    fetchDebts()
  }

  // --- ELIMINAR UN MOVIMIENTO DEL HISTORIAL ---
  async function handleDeletePayment(payment: any) {
    if (!confirm('¿Deseas eliminar este movimiento? El saldo de la deuda se reajustará automáticamente.')) return

    const oldAmount = Number(payment.amount) || 0
    const currentBalance = selectedDebt.current_balance ?? selectedDebt.initial_amount ?? 0

    // Si borramos un abono (positivo), sumamos al saldo actual.
    // Si borramos un cargo (negativo), restamos al saldo actual.
    const newBalance = Math.max(0, currentBalance + oldAmount)

    // 1. Eliminar movimiento
    const { error: deleteError } = await supabase.from('debt_payments').delete().eq('id', payment.id)

    if (deleteError) {
      alert(`Error al eliminar: ${deleteError.message}`)
      return
    }

    // 2. Actualizar saldo
    await supabase.from('debts').update({ current_balance: newBalance }).eq('id', selectedDebt.id)

    const updatedSelected = { ...selectedDebt, current_balance: newBalance }
    setSelectedDebt(updatedSelected)
    openHistory(updatedSelected)
    fetchDebts()
  }

  // --- PREPARAR MODO EDICIÓN ---
  function startEditingPayment(pay: any) {
    setEditingPaymentId(pay.id)
    const rawAmount = Number(pay.amount) || 0
    setEditMovementType(rawAmount >= 0 ? 'payment' : 'charge')
    setEditAmount(String(Math.abs(rawAmount)))
    setEditComment(pay.comment || '')
    setEditDate(pay.payment_date || new Date().toISOString().split('T')[0])
  }

  // --- GUARDAR EDICIÓN DE MOVIMIENTO ---
  async function handleSaveEditedPayment(payment: any) {
    const inputVal = Number(editAmount)
    if (isNaN(inputVal) || inputVal <= 0) return

    const isPayment = editMovementType === 'payment'
    const newStoredAmount = isPayment ? inputVal : -inputVal
    const oldStoredAmount = Number(payment.amount) || 0

    // Ajustar la diferencia en el balance
    // Diferencia = nuevo_efecto - viejo_efecto
    // Ejemplo:
    // Tenías abono +100 y lo cambias a +150 -> la deuda baja 50 más.
    // Tenías abono +100 y lo cambias a cargo -100 -> la deuda sube 200.
    const currentBalance = selectedDebt.current_balance ?? selectedDebt.initial_amount ?? 0
    const balanceDifference = oldStoredAmount - newStoredAmount
    const newBalance = Math.max(0, currentBalance + balanceDifference)

    // 1. Actualizar movimiento en debt_payments
    const { error: updatePayError } = await supabase
      .from('debt_payments')
      .update({
        amount: newStoredAmount,
        comment: editComment,
        payment_date: editDate,
      })
      .eq('id', payment.id)

    if (updatePayError) {
      alert(`Error al actualizar movimiento: ${updatePayError.message}`)
      return
    }

    // 2. Actualizar saldo de la deuda
    await supabase.from('debts').update({ current_balance: newBalance }).eq('id', selectedDebt.id)

    setEditingPaymentId(null)
    const updatedSelected = { ...selectedDebt, current_balance: newBalance }
    setSelectedDebt(updatedSelected)
    openHistory(updatedSelected)
    fetchDebts()
  }

  async function handleDeleteDebt(debtId: string) {
    if (!confirm('¿Deseas eliminar esta deuda y todo su historial de movimientos?')) return
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
          <p className="text-slate-400 text-sm mt-1">Registra pagos, cargos recurrentes y monitorea tus saldos y tasas.</p>
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
              const initialVal = debt.initial_amount ?? 0
              const currentVal = debt.current_balance ?? initialVal
              const isSettled = currentVal <= 0
              const isSelected = selectedDebt?.id === debt.id
              const isHighPriority = debt.id === highestInterestDebtId

              return (
                <div
                  key={debt.id}
                  onClick={() => openHistory(debt)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-900/20 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : isHighPriority
                      ? 'bg-rose-950/20 border-rose-500/50 hover:border-rose-500/80'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    {isHighPriority && !isSettled && (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-1">
                        <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> Prioridad Alta (Mayor Interés)
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-lg">{debt.name || 'Deuda sin nombre'}</span>
                      {debt.debt_type && (
                        <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {debt.debt_type}
                        </span>
                      )}
                      {isSettled ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Liquidada
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                          Activa
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>Monto Inicial: <strong className="text-slate-300">{formatCurrency(initialVal)}</strong></span>
                      {debt.annual_interest_rate && (
                        <span className="flex items-center gap-1 text-indigo-300">
                          <Percent className="w-3 h-3 text-indigo-400" /> Interés: {debt.annual_interest_rate}%
                        </span>
                      )}
                      {debt.minimum_payment && (
                        <span>Pago Mín: <strong className="text-slate-300">{formatCurrency(debt.minimum_payment)}</strong></span>
                      )}
                      {debt.due_date && (
                        <span className="flex items-center gap-1 text-amber-300/80">
                          <Calendar className="w-3 h-3 text-amber-400" /> Vence: {debt.due_date}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/80">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Balance Actual</span>
                      <span className={`text-xl font-extrabold ${isSettled ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {formatCurrency(currentVal)}
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

        {/* Historial y Registro de Movimientos */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          {selectedDebt ? (
            <>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" /> Historial de {selectedDebt.name}
                </h2>
                <p className="text-xs text-slate-400">Registra, edita o elimina abonos y cargos.</p>
              </div>

              {/* Formulario de Registro Nuevo */}
              <form onSubmit={handleRegisterMovement} className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setMovementType('payment')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                      movementType === 'payment'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" /> Abono (- Deuda)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('charge')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                      movementType === 'charge'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> Cargo (+ Deuda)
                  </button>
                </div>

                <input
                  type="number"
                  step="0.01"
                  placeholder={movementType === 'payment' ? 'Monto del Abono ($)' : 'Monto del Cargo ($)'}
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
                    placeholder="Concepto / Comentario"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full font-semibold text-xs py-2.5 rounded-xl transition shadow-lg ${
                    movementType === 'payment'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  }`}
                >
                  {movementType === 'payment' ? 'Guardar Abono' : 'Guardar Cargo'}
                </button>
              </form>

              {/* Lista de Movimientos con Edición y Eliminación */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {paymentsHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No hay movimientos registrados.</p>
                ) : (
                  paymentsHistory.map((pay) => {
                    const payNum = Number(pay.amount) || 0
                    const isPayment = payNum >= 0
                    const isEditing = editingPaymentId === pay.id

                    return (
                      <div key={pay.id} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs space-y-2">
                        {isEditing ? (
                          /* Modo Edición Inline */
                          <div className="space-y-2 pt-1">
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditMovementType('payment')}
                                className={`py-1 text-[10px] font-bold rounded-md ${
                                  editMovementType === 'payment' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                Abono (-)
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditMovementType('charge')}
                                className={`py-1 text-[10px] font-bold rounded-md ${
                                  editMovementType === 'charge' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                Cargo (+)
                              </button>
                            </div>

                            <input
                              type="number"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                            />

                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                              />
                              <input
                                type="text"
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                placeholder="Comentario"
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingPaymentId(null)}
                                className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditedPayment(pay)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Modo Vista Normal */
                          <div>
                            <div className="flex items-center justify-between text-slate-300">
                              <span
                                className={`font-bold flex items-center gap-1 ${
                                  isPayment ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isPayment ? (
                                  <>
                                    <ArrowDownLeft className="w-3.5 h-3.5" /> Abono: {formatCurrency(payNum)}
                                  </>
                                ) : (
                                  <>
                                    <ArrowUpRight className="w-3.5 h-3.5" /> Cargo: {formatCurrency(Math.abs(payNum))}
                                  </>
                                )}
                              </span>

                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                  <Calendar className="w-3 h-3" /> {pay.payment_date}
                                </span>
                                <button
                                  onClick={() => startEditingPayment(pay)}
                                  className="text-slate-500 hover:text-indigo-400 transition"
                                  title="Editar Movimiento"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePayment(pay)}
                                  className="text-slate-500 hover:text-rose-400 transition"
                                  title="Eliminar Movimiento"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {pay.comment && <p className="text-[11px] text-slate-400 italic mt-0.5">{pay.comment}</p>}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">Haz clic en una deuda para ver su historial y agregar o gestionar abonos y cargos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear Nueva Deuda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-400" /> Registrar Nueva Deuda
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre de la Deuda (`name`)*</label>
                <input
                  type="text"
                  placeholder="Ej. Tarjeta Banamex, Préstamo Personal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tipo (`debt_type`)</label>
                  <select
                    value={formData.debt_type}
                    onChange={(e) => setFormData({ ...formData, debt_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    <option value="Préstamo Personal">Préstamo Personal</option>
                    <option value="Hipoteca">Hipoteca</option>
                    <option value="Automotriz">Automotriz</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Monto Inicial (`initial_amount`)*</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15000.00"
                    value={formData.initial_amount}
                    onChange={(e) => setFormData({ ...formData, initial_amount: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Balance Actual (`current_balance`)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Igual al inicial si se omite"
                    value={formData.current_balance}
                    onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Interés Anual % (`annual_interest_rate`)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 24.5"
                    value={formData.annual_interest_rate}
                    onChange={(e) => setFormData({ ...formData, annual_interest_rate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Pago Mínimo (`minimum_payment`)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 800.00"
                    value={formData.minimum_payment}
                    onChange={(e) => setFormData({ ...formData, minimum_payment: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fecha Límite / Vencimiento (`due_date`)</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
