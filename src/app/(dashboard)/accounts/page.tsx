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
  SubAccount,
} from '@/lib/subAccounts'
import {
  CreditCard,
  Plus,
  Trash2,
  Pencil,
  Wallet,
  X,
  Lock,
  TrendingUp,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [subAccountsMap, setSubAccountsMap] = useState<Record<string, SubAccount[]>>({})
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Modales
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [creatingSubAccountFor, setCreatingSubAccountFor] = useState<string | null>(null)
  const [transferringSub, setTransferringSub] = useState<{
    subAcc: SubAccount
    parentAccId: string
  } | null>(null)

  // Campos Formulario Alta Cuenta
  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('debit')
  const [initialBalance, setInitialBalance] = useState('')
  const [yieldRate, setYieldRate] = useState('')

  // Campos Alta Apartado
  const [subName, setSubName] = useState('')
  const [subYieldRate, setSubYieldRate] = useState('')
  const [subInitialBalance, setSubInitialBalance] = useState('')

  // Campos Transferencia a Apartado
  const [transferAmount, setTransferAmount] = useState('')
  const [transferAction, setTransferAction] = useState<'deposit' | 'withdraw'>('deposit')

  useEffect(() => {
    loadAllAccounts()
  }, [])

  const loadAllAccounts = async () => {
    try {
      setFetching(true)
      const data = await getAccounts()
      setAccounts(data)

      // Cargar apartados para cada cuenta de débito
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

  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    try {
      const initBal = initialBalance ? parseFloat(initialBalance) : 0
      await addAccount({
        name,
        account_type: accountType,
        initial_balance: initBal,
        current_balance: initBal,
        yield_rate: accountType === 'debit' && yieldRate ? parseFloat(yieldRate) : 0,
      })

      setName('')
      setInitialBalance('')
      setYieldRate('')
      await loadAllAccounts()
    } catch (err) {
      console.error('Error al guardar cuenta:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!creatingSubAccountFor || !subName) return

    try {
      const initSubBal = subInitialBalance ? parseFloat(subInitialBalance) : 0
      await addSubAccount({
        account_id: creatingSubAccountFor,
        name: subName,
        balance: initSubBal,
        yield_rate: subYieldRate ? parseFloat(subYieldRate) : 0,
      })

      setSubName('')
      setSubYieldRate('')
      setSubInitialBalance('')
      setCreatingSubAccountFor(null)
      await loadAllAccounts()
    } catch (err) {
      console.error('Error al crear apartado:', err)
    }
  }

  const handleTransferSubAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferringSub || !transferAmount) return

    try {
      await transferToSubAccount({
        subAccountId: transferringSub.subAcc.id!,
        parentAccountId: transferringSub.parentAccId,
        amount: parseFloat(transferAmount),
        action: transferAction,
      })

      setTransferAmount('')
      setTransferringSub(null)
      await loadAllAccounts()
    } catch (err) {
      console.error('Error al procesar movimiento:', err)
    }
  }

  return (
    <div className="p-6 md:p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Gestión de Cuentas y Apartados</h1>
        <p className="text-sm text-slate-400 mt-1">
          Administra tus cuentas, crea cajitas de ahorro personalizadas con rendimientos individuales y gestiona tu capital.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario Nueva Cuenta */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg h-fit space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-indigo-400">
            <Plus className="w-5 h-5" /> Nueva Cuenta
          </h2>

          <form onSubmit={handleSubmitAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nombre de la Cuenta</label>
              <input
                type="text"
                placeholder="Ej. Mercado Pago, Nu Débito, BBVA"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Cuenta</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="debit">Cuenta de Débito / Banco</option>
                <option value="credit_card">Tarjeta de Crédito</option>
                <option value="cash">Efectivo / Caja</option>
              </select>
            </div>

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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Saldo Total Inicial (MXN)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-medium py-2 rounded-lg text-sm text-white transition-colors"
            >
              {loading ? 'Guardando...' : 'Guardar Cuenta'}
            </button>
          </form>
        </div>

        {/* Lista de Cuentas */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Cuentas y Cajitas de Ahorro</h2>

          {fetching ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              Cargando cuentas...
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((acc) => {
                const current = Number(acc.current_balance || 0)
                const subAccs = subAccountsMap[acc.id!] || []
                
                // Suma de apartados y disponible
                const reservedTotal = subAccs.reduce((sum, s) => sum + Number(s.balance || 0), 0)
                const liquidBalance = Math.max(0, current - reservedTotal)

                // Rendimiento diario cuenta principal
                const mainYieldPct = Number(acc.yield_rate || 0)
                const mainDailyYield = liquidBalance > 0 && mainYieldPct > 0 ? (liquidBalance * (mainYieldPct / 100)) / 365 : 0

                // Rendimiento diario de apartados
                const subDailyYieldTotal = subAccs.reduce((sum, s) => {
                  const bal = Number(s.balance || 0)
                  const rate = Number(s.yield_rate || 0)
                  return sum + (bal > 0 && rate > 0 ? (bal * (rate / 100)) / 365 : 0)
                }, 0)

                const totalDailyYield = mainDailyYield + subDailyYieldTotal
                const isExpanded = expandedAccount === acc.id

                return (
                  <div key={acc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h3 className="font-semibold text-sm text-slate-100">{acc.name}</h3>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {acc.account_type === 'debit' ? 'Débito / Banco' : acc.account_type}
                          </span>
                        </div>
                      </div>

                      {acc.account_type === 'debit' && (
                        <button
                          onClick={() => setCreatingSubAccountFor(acc.id!)}
                          className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Nuevo Apartado
                        </button>
                      )}
                    </div>

                    {/* Desglose de Saldo */}
                    {acc.account_type === 'debit' && (
                      <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                        <div>
                          <p className="text-slate-400">Disponible Líquido</p>
                          <p className="font-bold text-emerald-400 text-sm mt-0.5">
                            ${liquidBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-400" /> Total en Apartados
                          </p>
                          <p className="font-bold text-amber-300 text-sm mt-0.5">
                            ${reservedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rendimiento total combinado de la cuenta */}
                    {acc.account_type === 'debit' && totalDailyYield > 0 && (
                      <div className="bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-emerald-400" /> Rendimiento diario est.
                        </span>
                        <span className="font-bold">+${totalDailyYield.toFixed(2)} MXN/día</span>
                      </div>
                    )}

                    {/* Sub-cuentas / Cajitas */}
                    {acc.account_type === 'debit' && subAccs.length > 0 && (
                      <div className="border-t border-slate-800/80 pt-3 space-y-2">
                        <button
                          onClick={() => setExpandedAccount(isExpanded ? null : acc.id!)}
                          className="flex justify-between items-center w-full text-xs text-slate-400 hover:text-white"
                        >
                          <span>{subAccs.length} Apartados activos</span>
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

                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-amber-300">
                                      ${subBal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </span>
                                    <button
                                      onClick={() => setTransferringSub({ subAcc: sub, parentAccId: acc.id! })}
                                      className="text-indigo-400 hover:text-indigo-300 p-1"
                                      title="Ingresar / Retirar saldo"
                                    >
                                      <ArrowRightLeft className="w-4 h-4" />
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
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Crear Nuevo Apartado */}
      {creatingSubAccountFor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100">Crear Nuevo Apartado / Cajita</h3>
              <button onClick={() => setCreatingSubAccountFor(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Apartado</label>
                <input
                  type="text"
                  placeholder="Ej. Vacaciones, Mantenimiento Spark, Emergencias"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tasa de Rendimiento Anual (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej. 13.5 (Nu), 12.0 (Mercado Pago)"
                  value={subYieldRate}
                  onChange={(e) => setSubYieldRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
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
      )}

      {/* Modal 2: Ingresar / Retirar Dinero del Apartado */}
      {transferringSub && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100">
                Movimiento en "{transferringSub.subAcc.name}"
              </h3>
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

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Monto (MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
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
      )}
    </div>
  )
}
