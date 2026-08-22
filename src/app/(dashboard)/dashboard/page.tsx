'use client'

import { useState, useEffect } from 'react'
import { getIncomes } from '@/lib/incomes'
import { getExpenses } from '@/lib/expenses'
import { getDebts } from '@/lib/debts'
import { getAccounts } from '@/lib/accounts'
import { analyzeFinancialHealth, HealthReport } from '@/lib/financialEngine'
import { processRecurringTransactions } from '@/lib/recurringEngine'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalDebtsBalance: 0,
    totalDebtMinPayments: 0,
    creditCardDebt: 0,
    directDebt: 0,
  })
  const [report, setReport] = useState<HealthReport | null>(null)

  useEffect(() => {
    const initApp = async () => {
      await processRecurringTransactions()
      await fetchDashboardData()
    }

    initApp()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [incomesData, expensesData, debtsData, accountsData] = await Promise.all([
        getIncomes(),
        getExpenses(),
        getDebts(),
        getAccounts(),
      ])

      const totalIncome = incomesData.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
      const totalExpenses = expensesData.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

      // 1. Deuda directa / préstamos (de la tabla debts)
      const directDebt = debtsData.reduce((acc, curr) => acc + Number(curr.current_balance || 0), 0)

      // 2. Deuda de Tarjetas de Crédito (de la tabla accounts filtrado por credit_card)
      const creditCardDebt = accountsData
        .filter((acc) => acc.account_type === 'credit_card')
        .reduce((acc, card) => acc + Number(card.current_balance || 0), 0)

      // 3. Deuda acumulada total consolidada
      const totalDebtsBalance = directDebt + creditCardDebt

      // Pago mínimo total (préstamos + pagos mínimos configurados en tarjetas)
      const cardMinPayments = accountsData
        .filter((acc) => acc.account_type === 'credit_card')
        .reduce((acc, card) => acc + Number(card.minimum_payment || 0), 0)
        
      const directMinPayments = debtsData.reduce((acc, curr) => acc + Number(curr.minimum_payment || 0), 0)
      const totalDebtMinPayments = directMinPayments + cardMinPayments

      const summary = {
        totalIncome,
        totalExpenses,
        totalDebtsBalance,
        totalDebtMinPayments,
        creditCardDebt,
        directDebt,
      }

      setMetrics(summary)
      setReport(analyzeFinancialHealth(summary))
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-slate-400 flex items-center justify-center">
        Cargando indicadores financieros...
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard General</h1>
          <p className="text-sm text-slate-400 mt-1">
            Resumen en tiempo real y diagnóstico automatizado de tus finanzas.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300">
          Moneda: <span className="font-semibold text-emerald-400">MXN</span>
        </div>
      </div>

      {/* Indicadores Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Ingresos Totales</p>
          <p className="text-2xl font-bold mt-2 text-emerald-400">
            ${metrics.totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Gastos Totales</p>
          <p className="text-2xl font-bold mt-2 text-rose-400">
            ${metrics.totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Flujo Neto Disponible</p>
          <p
            className={`text-2xl font-bold mt-2 ${
              report && report.netCashFlow >= 0 ? 'text-indigo-400' : 'text-red-500'
            }`}
          >
            ${report?.netCashFlow.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Deuda Total Acumulada</p>
          <p className="text-2xl font-bold mt-2 text-amber-400">
            ${metrics.totalDebtsBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Tarjetas: ${metrics.creditCardDebt.toLocaleString('es-MX')} | Préstamos: ${metrics.directDebt.toLocaleString('es-MX')}
          </p>
        </div>
      </div>

      {/* Salud Financiera y Diagnóstico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Widget del Health Score */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="font-semibold text-sm text-slate-300">Nivel de Salud Financiera</h3>
            <p className="text-xs text-slate-500 mt-1">Calculado en base a liquidez y reglas de endeudamiento</p>
          </div>

          <div className="my-6 text-center">
            <span
              className={`text-6xl font-extrabold ${
                (report?.healthScore || 0) >= 80
                  ? 'text-emerald-400'
                  : (report?.healthScore || 0) >= 50
                  ? 'text-amber-400'
                  : 'text-rose-500'
              }`}
            >
              {report?.healthScore}
            </span>
            <span className="text-slate-500 text-lg font-bold"> / 100</span>
            <p className="text-xs text-slate-400 mt-2">
              {(report?.healthScore || 0) >= 80
                ? '🟢 Situación Financiera Robusta'
                : (report?.healthScore || 0) >= 50
                ? '🟡 Requiere Ajustes Moderados'
                : '🔴 Estado Crítico de Flujo/Deuda'}
            </p>
          </div>

          {/* Ratio de endeudamiento */}
          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Ratio Compromiso Deuda/Ingreso:</span>
              <span className="font-semibold text-slate-200">
                {report?.debtToIncomeRatio.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  (report?.debtToIncomeRatio || 0) > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, report?.debtToIncomeRatio || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Alertas y Recomendaciones del Motor */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
          <div>
            <h3 className="font-semibold text-sm text-slate-200">Diagnóstico del Motor Financiero</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Alertas y recomendaciones automáticas basadas en tu actividad.
            </p>
          </div>

          {/* Alertas */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Alertas activas</h4>
            {report?.alerts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Sin alertas ni riesgos detectados actualmente.</p>
            ) : (
              report?.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border text-xs font-medium ${
                    alert.type === 'danger'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : alert.type === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {alert.message}
                </div>
              ))
            )}
          </div>

          {/* Recomendaciones */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Acciones Recomendadas
            </h4>
            {report?.recommendations.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Sigue manteniendo la gestión actual de tu capital.</p>
            ) : (
              <ul className="space-y-2">
                {report?.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
