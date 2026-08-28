'use client'

import { useState, useEffect } from 'react'
import {
  getAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  Account,
  AccountType,
} from '@/lib/accounts'
import {
  getSubAccounts,
  addSubAccount,
  transferToSubAccount,
  deleteSubAccount,
  SubAccount,
} from '@/lib/subAccounts'
import {
  CreditCard,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  Wallet,
  X,
  Lock,
  TrendingUp,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Percent,
} from 'lucide-react'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [subAccountsMap, setSubAccountsMap] = useState<Record<string, SubAccount[]>>({})
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Estado para edición
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  // Modales de Apartados
  const [creatingSubAccountFor, setCreatingSubAccountFor] = useState<Account | null>(null)
  const [transferringSub, setTransferringSub] = useState<{
    subAcc: SubAccount
    parentAcc: Account
  } | null>(null)

  // Formulario de nueva cuenta
  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('debit')
  const [creditLimit, setCreditLimit] = useState('')
  const [initialBalance, setInitialBalance] = useState('')
  const [reservedBalance, setReservedBalance] = useState('')
  const [yieldRate, setYieldRate] = useState('')
  const [cutoffDay, setCutoffDay] = useState('')
  const [paymentDueDay, setPaymentDueDay] = useState('')
  const [annualInterestRate, setAnnualInterestRate] = useState('')
  const [minimumPayment, setMinimumPayment] = useState('')

  // Campos Alta Apartado
  const [subName, setSubName] = useState('')
  const [subYieldRate, setSubYieldRate] = useState('')
  const [subInitialBalance, setSubInitialBalance] = useState('')

  // Campos Transferencia a Apartado
  const [transferAmount, setTransferAmount] = useState('')
  const [transferAction, setTransferAction] = useState<'deposit' | 'withdraw'>('deposit')

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setFetching(true)
      const data = await getAccounts()
      setAccounts(data)

      const subMap: Record<string, SubAccount[]> = {}
      for (const acc of data) {
        if (acc.id && acc.account_type === 'debit') {
          subMap[acc.id] = await getSubAccounts(acc.id)
        }
      }
      setSubAccountsMap(subMap)
    } catch (err) {
      console.error('Error al cargar cuentas:', err)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    try {
      const initBal = initialBalance ? parseFloat(initialBalance) : 0
      await addAccount({
        name,
        account_type: accountType,
        credit_limit: accountType === 'credit_card' && creditLimit ? parseFloat(creditLimit) : null,
        initial_balance: initBal,
        current_balance: initBal,
        reserved_balance: accountType === 'debit' && reservedBalance ? parseFloat(reservedBalance) : 0,
        yield_rate: accountType === 'debit' && yieldRate ? parseFloat(yieldRate) : 0,
        cutoff_day: accountType === 'credit_card' && cutoffDay ? parseInt(cutoffDay) : null,
        payment_due_day: accountType === 'credit_card' && paymentDueDay ? parseInt(paymentDueDay) : null,
        annual_interest_rate: accountType === 'credit_card' && annualInterestRate ? parseFloat(annualInterestRate) : null,
        minimum_payment: accountType === 'credit_card' && minimumPayment ? parseFloat(minimumPayment) : null,
      })

      setName('')
      setCreditLimit('')
      setInitialBalance('')
      setReservedBalance('')
      setYieldRate('')
      setCutoffDay('')
      setPaymentDueDay('')
      setAnnualInterestRate('')
      setMinimumPayment('')
      await loadAccounts()
    } catch (err) {
      console.error('Error al guardar la cuenta:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccount || !editingAccount.id) return

    try {
      await updateAccount(editingAccount.id, {
        name: editingAccount.name,
        account_type: editingAccount.account_type,
        credit_limit: editingAccount.credit_limit ? Number(editingAccount.credit_limit) : null,
        initial_balance: editingAccount.initial_balance ? Number(editingAccount.initial_balance) : 0,
        current_balance: Number(editingAccount.current_balance),
        reserved_balance: editingAccount.reserved_balance ? Number(editingAccount.reserved_balance) : 0,
        yield_rate: editingAccount.yield_rate ? Number(editingAccount.yield_rate) : 0,
        cutoff_day: editingAccount.cutoff_day ? Number(editingAccount.cutoff_day) : null,
        payment_due_day: editingAccount.payment_due_day ? Number(editingAccount.payment_due_day) : null,
        annual_interest_rate: editingAccount.annual_interest_rate ? Number(editingAccount.annual_interest_rate) : null,
        minimum_payment: editingAccount.minimum_payment ? Number(editingAccount.minimum_payment) : null,
      })

      setEditingAccount(null)
      await loadAccounts()
    } catch (err) {
      console.error('Error al actualizar cuenta:', err)
    }
  }

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('¿Estás seguro de eliminar esta cuenta?')) return
    try {
      await deleteAccount(id)
      await loadAccounts()
    } catch (err) {
      console.error('Error al eliminar:', err)
    }
  }

  const handleCreateSubAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!creatingSubAccountFor || !subName) return

    const parentAcc = creatingSubAccountFor
    const subAccs = subAccountsMap[parentAcc.id!] || []
    const reservedFromSubs = subAccs.reduce((sum, s) => sum + Number(s.balance || 0), 0)
    const currentLiquidBalance = Math.max(0, Number(parentAcc.current_balance || 0) - reservedFromSubs)
    const initSubBal = subInitialBalance ? parseFloat(subInitialBalance) : 0

    if (initSubBal > currentLiquidBalance) {
      alert(`No tienes suficiente saldo disponible líquido en ${parentAcc.name}. Disponible actual: $${currentLiquidBalance.toLocaleString('es-MX')} MXN.`)
      return
    }

    try {
      await addSubAccount({
        account_id: parentAcc.id!,
        name: subName,
        balance: initSubBal,
        yield_rate: subYieldRate ? parseFloat(subYieldRate) : 0,
      })

      setSubName('')
      setSubYieldRate('')
      setSubInitialBalance('')
      setCreatingSubAccountFor(null)
      await loadAccounts()
    } catch (err) {
      console.error('Error al crear apartado:', err)
    }
  }

  const handleDeleteSubAccount = async (sub: SubAccount) => {
    if (Number(sub.balance) > 0) {
      alert(`No puedes eliminar el apartado "${sub.name}" porque aún tiene $${Number(sub.balance).toLocaleString('es-MX')} MXN. Regresa el dinero a disponible primero.`)
      return
    }

    if (!confirm(`¿Eliminar el apartado "${sub.name}"?`)) return

    try {
      await deleteSubAccount(sub.id!, Number(sub.balance))
      await loadAccounts()
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el apartado.')
    }
  }

  const handleTransferSubAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferringSub || !transferAmount) return

    const amountNum = parseFloat(transferAmount)
    const { subAcc, parentAcc } = transferringSub
    const subAccs = subAccountsMap[parentAcc.id!] || []
    const reservedFromSubs = subAccs.reduce((sum, s) => sum + Number(s.balance || 0), 0)
    const currentLiquidBalance = Math.max(0, Number(parentAcc.current_balance || 0) - reservedFromSubs)

    if (transferAction === 'deposit' && amountNum > currentLiquidBalance) {
      alert(`No tienes suficiente disponible líquido en ${parentAcc.name}. Disponible actual: $${currentLiquidBalance.toLocaleString('es-MX')} MXN.`)
      return
    }

    if (transferAction === 'withdraw' && amountNum > Number(subAcc.balance || 0)) {
      alert(`El monto excede lo guardado en este apartado. Guardado en apartado: $${Number(subAcc.balance).toLocaleString('es-MX')} MXN.`)
      return
    }

    try {
      await transferToSubAccount({
        subAccountId: subAcc.id!,
        parentAccountId: parentAcc.id!,
        amount: amountNum,
        action: transferAction,
      })

      setTransferAmount('')
      setTransferringSub(null)
      await loadAccounts()
    } catch (err) {
      console.error('Error al procesar movimiento:', err)
    }
  }

  return (
    <div className="p-6 md:p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Gestión de Cuentas y Tarjetas</h1>
        <p className="text-sm text-slate-400 mt-1">
          Administra tus tarjetas de crédito, cuentas de débito, rendimientos y apartados de dinero.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Alta */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg h-fit space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-indigo-400">
            <Plus className="w-5 h-5" /> Nueva Cuenta / Tarjeta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nombre de la Cuenta</label>
              <input
                type="text"
                placeholder="Ej. Nu Débito, Mercado Pago, BBVA Nómina"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Cuenta</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none text-white"
              >
                <option value="debit">Cuenta de Débito / Banco</option>
                <option value="credit_card">Tarjeta de Crédito</option>
                <option value="cash">Efectivo / Caja</option>
              </select>
            </div>

            {/* Campos de Débito: Rendimiento Anual */}
            {accountType === 'debit' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Rendimiento Anual Cuenta Principal (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej. 12.0 (Mercado Pago=12, Nu=0)"
                  value={yieldRate}
                  onChange={(e) => setYieldRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>
            )}

            {accountType === 'credit_card' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Límite de Crédito (MXN)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="25000.00"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Día de Corte</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ej. 12"
                      value={cutoffDay}
                      onChange={(e) => setCutoffDay(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Día Límite Pago</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ej. 2"
                      value={paymentDueDay}
                      onChange={(e) => setPaymentDueDay(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Interés Anual (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej. 45.0"
                      value={annualInterestRate}
                      onChange={(e) => setAnnualInterestRate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Pago Mínimo Est.</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej. 800.00"
                      value={minimumPayment}
                      onChange={(e) => setMinimumPayment(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {accountType === 'credit_card' ? 'Saldo Deuda Actual (MXN)' : 'Saldo Total en la Cuenta (MXN)'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50 text-white"
            >
              {loading ? 'Guardando...' : 'Guardar Cuenta'}
            </button>
          </form>
        </div>

        {/* Lista de Cuentas */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Cuentas Registradas</h2>

          {fetching ? (
            <div className="p-8 text-center text-sm text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              Cargando cuentas...
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              No tienes cuentas registradas.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc) => {
                const limit = Number(acc.credit_limit || 0)
                const currentTotal = Number(acc.current_balance || 0)
                const subAccs = subAccountsMap[acc.id!] || []
                
                const reservedFromSubs = subAccs.reduce((sum, s) => sum + Number(s.balance || 0), 0)
                const reserved = subAccs.length > 0 ? reservedFromSubs : Number(acc.reserved_balance || 0)
                
                const liquidBalance = Math.max(0, currentTotal - reserved)
                const availableCredit = Math.max(0, limit - currentTotal)
                const usage = limit > 0 ? Math.min(100, (currentTotal / limit) * 100) : 0

                const mainYieldPct = Number(acc.yield_rate || 0)
                const mainDailyYield = liquidBalance > 0 && mainYieldPct > 0 ? (liquidBalance * (mainYieldPct / 100)) / 365 : 0

                const subDailyYieldTotal = subAccs.reduce((sum, s) => {
                  const bal = Number(s.balance || 0)
                  const rate = Number(s.yield_rate || 0)
                  return sum + (bal > 0 && rate > 0 ? (bal * (rate / 100)) / 365 : 0)
                }, 0)

                const totalDailyYield = mainDailyYield + subDailyYieldTotal
                const isExpanded = expandedAccount === acc.id

                return (
                  <div
                    key={acc.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 relative shadow-lg hover:border-slate-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {acc.account_type === 'credit_card' ? (
                          <CreditCard className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <Wallet className="w-5 h-5 text-emerald-400" />
                        )}
                        <div>
                          <h3 className="font-semibold text-sm text-slate-100">{acc.name}</h3>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {acc.account_type === 'credit_card'
                              ? 'Tarjeta de Crédito'
                              : acc.account_type === 'debit'
                              ? 'Débito'
                              : 'Efectivo'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {acc.account_type === 'debit' && (
                          <button
                            onClick={() => setCreatingSubAccountFor(acc)}
                            className="text-slate-500 hover:text-emerald-400 p-1 transition-colors"
                            title="Añadir apartado"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditingAccount(acc)}
                          className="text-slate-500 hover:text-indigo-400 p-1 transition-colors"
                          title="Editar cuenta"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(acc.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bloque 1: Vista para Tarjetas de Crédito */}
                    {acc.account_type === 'credit_card' ? (
                      <div className="space-y-3">
                        {limit > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Línea Utilizada</span>
                              <span className="font-semibold text-slate-200">{usage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  usage > 85 ? 'bg-rose-500' : usage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${usage}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-center">
                          <div>
                            <p className="text-slate-400 text-[10px]">Límite Crédito</p>
                            <p className="font-semibold text-slate-200 mt-0.5">
                              ${limit.toLocaleString('es-MX')}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px]">Deuda Actual</p>
                            <p className="font-bold text-rose-400 mt-0.5">
                              ${currentTotal.toLocaleString('es-MX')}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px]">Disponible</p>
                            <p className="font-bold text-emerald-400 mt-0.5">
                              ${availableCredit.toLocaleString('es-MX')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                          <div>
                            <p className="text-slate-400 text-[10px]">Pago Mínimo Est.</p>
                            <p className="font-semibold text-amber-300 mt-0.5">
                              ${Number(acc.minimum_payment || 0).toLocaleString('es-MX')}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px]">Interés Anual</p>
                            <p className="font-semibold text-slate-300 mt-0.5">
                              {acc.annual_interest_rate ? `${acc.annual_interest_rate}%` : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {(acc.cutoff_day || acc.payment_due_day) && (
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 flex items-center justify-between text-[11px] text-slate-300">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-400" />
                              Corte: <strong>Día {acc.cutoff_day || 'N/A'}</strong>
                            </span>
                            <span>
                              Pago Límite: <strong>Día {acc.payment_due_day || 'N/A'}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Bloque 2: Vista para Cuentas de Débito / Efectivo */
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                          <div>
                            <p className="text-slate-400 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-400" /> Apartado / Retenido
                            </p>
                            <p className="font-semibold text-amber-300 text-xs mt-0.5">
                              ${reserved.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">Disponible Líquido</p>
                            <p className="font-bold text-emerald-400 text-xs mt-0.5">
                              ${liquidBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        {totalDailyYield > 0 && (
                          <div className="bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl flex items-center justify-between text-[11px] text-emerald-300">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Rendimiento diario est.
                            </span>
                            <span>
                              +${totalDailyYield.toFixed(2)} MXN/día
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                          <div>
                            <p className="text-slate-400">Saldo Total Cuenta</p>
                            <p className="font-bold text-emerald-400 text-sm mt-0.5">
                              ${currentTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Tasa Anual Base</p>
                            <p className="font-semibold text-slate-300 text-sm mt-0.5">
                              {mainYieldPct > 0 ? `${mainYieldPct}%` : '0%'}
                            </p>
                          </div>
                        </div>

                        {/* Desglose de Apartados */}
                        {subAccs.length > 0 && (
                          <div className="border-t border-slate-800/80 pt-3 space-y-2">
                            <button
                              onClick={() => setExpandedAccount(isExpanded ? null : acc.id!)}
                              className="flex justify-between items-center w-full text-xs text-slate-400 hover:text-white"
                            >
                              <span>{subAccs.length} Apartados con rendimiento</span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {isExpanded && (
                              <div className="space-y-2 pt-1">
                                {subAccs.map((sub) => {
                                  const subBal = Number(sub.balance || 0)
                                  const subRate = Number(sub.yield_rate || 0)
                                  const subYield = subBal > 0 && subRate > 0 ? (subBal * (subRate / 100)) / 365 : 0

                                  return (
                                    <div
                                      key={sub.id}
                                      className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <p className="font-semibold text-slate-200">{sub.name}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                          Tasa: {subRate}% anual • +${subYield.toFixed(2)} MXN/día
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-amber-300">
                                          ${subBal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </span>
                                        <button
                                          onClick={() => setTransferringSub({ subAcc: sub, parentAcc: acc })}
                                          className="text-indigo-400 hover:text-indigo-300 p-1"
                                          title="Meter / Sacar saldo"
                                        >
                                          <ArrowRightLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSubAccount(sub)}
                                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                                          title="Eliminar apartado"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
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

      {/* Modal 1: Editar Cuenta */}
      {editingAccount && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100">Editar Cuenta</h3>
              <button onClick={() => setEditingAccount(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {editingAccount.account_type === 'credit_card' ? 'Saldo Gastado / Deuda' : 'Saldo Total Cuenta'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingAccount.current_balance}
                  onChange={(e) => setEditingAccount({ ...editingAccount, current_balance: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              {editingAccount.account_type === 'credit_card' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Límite de Crédito</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingAccount.credit_limit || ''}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
                          credit_limit: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Día de Corte</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={editingAccount.cutoff_day || ''}
                        onChange={(e) =>
                          setEditingAccount({
                            ...editingAccount,
                            cutoff_day: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Día Límite Pago</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={editingAccount.payment_due_day || ''}
                        onChange={(e) =>
                          setEditingAccount({
                            ...editingAccount,
                            payment_due_day: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Interés Anual (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingAccount.annual_interest_rate || ''}
                        onChange={(e) =>
                          setEditingAccount({
                            ...editingAccount,
                            annual_interest_rate: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Pago Mínimo</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingAccount.minimum_payment || ''}
                        onChange={(e) =>
                          setEditingAccount({
                            ...editingAccount,
                            minimum_payment: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Crear Nuevo Apartado */}
      {creatingSubAccountFor && (() => {
        const parentAcc = creatingSubAccountFor
        const subAccs = subAccountsMap[parentAcc.id!] || []
        const reservedFromSubs = subAccs.reduce((sum, s) => sum + Number(s.balance || 0), 0)
        const currentLiquidBalance = Math.max(0, Number(parentAcc.current_balance || 0) - reservedFromSubs)

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-slate-100">Crear Nuevo Apartado / Cajita</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cuenta: <span className="text-slate-200 font-semibold">{parentAcc.name}</span>
                  </p>
                </div>
                <button onClick={() => setCreatingSubAccountFor(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubAccount} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Apartado</label>
                  <input
                    type="text"
                    placeholder="Ej. Vacaciones, Emergencias, Mantenimiento Spark"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Rendimiento Anual del Apartado (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 13.5 (Nu), 12.0 (Mercado Pago)"
                    value={subYieldRate}
                    onChange={(e) => setSubYieldRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-slate-400">Monto Inicial a Apartar ($)</label>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      Disponible: ${currentLiquidBalance.toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={subInitialBalance}
                    onChange={(e) => setSubInitialBalance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreatingSubAccountFor(null)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Crear Apartado
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

      {/* Modal 3: Meter / Sacar Dinero del Apartado */}
      {transferringSub && (() => {
        const { subAcc, parentAcc } = transferringSub
        const subAccs = subAccountsMap[parentAcc.id!] || []
        const reservedFromSubs = subAccs.reduce((sum, s) => sum + Number(s.balance || 0), 0)
        const currentLiquidBalance = Math.max(0, Number(parentAcc.current_balance || 0) - reservedFromSubs)
        const subBalance = Number(subAcc.balance || 0)

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-slate-100">
                    Movimiento en "{subAcc.name}"
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cuenta: <span className="text-slate-200 font-semibold">{parentAcc.name}</span>
                  </p>
                </div>
                <button onClick={() => setTransferringSub(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTransferSubAccount} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferAction('deposit')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      transferAction === 'deposit'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Meter a Cajita
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferAction('withdraw')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      transferAction === 'withdraw'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Regresar a Disponible
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                  {transferAction === 'deposit' ? (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Disponible Líquido en {parentAcc.name}:</span>
                      <strong className="text-emerald-400 font-bold">
                        ${currentLiquidBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </strong>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Guardado en "{subAcc.name}":</span>
                      <strong className="text-amber-300 font-bold">
                        ${subBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </strong>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Monto a Mover ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTransferringSub(null)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Confirmar Movimiento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
