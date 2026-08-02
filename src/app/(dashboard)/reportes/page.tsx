'use client'

import { useState, useEffect } from 'react'
import { getFilteredReport, CategoryBreakdown, PaymentMethodBreakdown } from '@/lib/reports'

export default function ReportsPage() {
  // Inicializar con el mes actual por defecto
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = today.toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(lastDay)
  const [loading, setLoading] = useState(false)

  const [reportData, setReportData] = useState<{
    totalIncomes: number
    totalExpenses: number
    netBalance: number
    expensesByCategory: CategoryBreakdown[]
    expensesByPaymentMethod: PaymentMethodBreakdown[]
  }>({
    totalIncomes: 0,
    totalExpenses: 0,
    netBalance: 0,
    expensesByCategory: [],
    expensesByPaymentMethod: [],
  })

  useEffect(() => {
    handleFetchReport()
  }, [])

  const handleFetchReport = async () => {
    setLoading(true)
    try {
      const data = await getFilteredReport({ startDate, endDate })
      setReportData(data)
    } catch (err) {
      console.error('Error al generar el reporte:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 bg-gray-950 min-h-screen text-gray-100 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historial y Corte de Caja</h1>
          <p className="text-sm text-gray-400 mt-1">
            Filtra por cualquier rango de fechas para revisar tus flujos de efectivo y distribución de gastos.
          </p>
        </div>
      </div>

      {/* Bar de Filtros por Rango de Fechas */}
      <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col sm:flex-row items-end gap-4 shadow-sm">
        <div className="w-full sm:w-auto flex-1">
          <label className="block text-xs font-medium text-gray-400 mb-1">Fecha Inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-gray-200"
          />
        </div>

        <div className="w-full sm:w-auto flex-1">
          <label className="block text-xs font-medium text-gray-400 mb-1">Fecha Final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-gray-200"
          />
        </div>

        <button
          onClick={handleFetchReport}
          disabled={loading}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Filtrando...' : 'Aplicar Corte'}
        </button>
      </div>

      {/* Resumen del Corte */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Ingresos en el Periodo</p>
          <p className="text-2xl font-bold mt-2 text-emerald-400">
            ${reportData.totalIncomes.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Gastos en el Periodo</p>
          <p className="text-2xl font-bold mt-2 text-rose-400">
            ${reportData.totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 font-medium">Balance Neto del Rango</p>
          <p
            className={`text-2xl font-bold mt-2 ${
              reportData.netBalance >= 0 ? 'text-indigo-400' : 'text-rose-500'
            }`}
          >
            ${reportData.netBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>
      </div>

      {/* Desglose por Categoría y Método de Pago */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Desglose por Categoría */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg space-y-4">
          <h3 className="font-semibold text-sm text-gray-200">Gastos por Categoría</h3>

          {reportData.expensesByCategory.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4">No hay gastos registrados en este periodo.</p>
          ) : (
            <div className="space-y-4">
              {reportData.expensesByCategory.map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-300">{cat.category}</span>
                    <span className="text-gray-400">
                      ${cat.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-800">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desglose por Método de Pago */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg space-y-4">
          <h3 className="font-semibold text-sm text-gray-200">Gastos por Método de Pago</h3>

          {reportData.expensesByPaymentMethod.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4">No hay operaciones registradas en este periodo.</p>
          ) : (
            <div className="space-y-3">
              {reportData.expensesByPaymentMethod.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-gray-950 border border-gray-800 px-4 py-3 rounded-xl text-xs"
                >
                  <span className="font-medium text-gray-300 capitalize">{item.method}</span>
                  <span className="font-bold text-gray-100">
                    ${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}