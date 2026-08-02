'use client'

import { useState, useEffect } from 'react'
import { addIncome, getIncomes, Income } from '@/lib/incomes'

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Campos del formulario
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'fixed' | 'variable'>('variable')
  const [frequency, setFrequency] = useState('monthly')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadIncomes()
  }, [])

  const loadIncomes = async () => {
    try {
      const data = await getIncomes()
      setIncomes(data)
    } catch (err) {
      console.error('Error al cargar ingresos:', err)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount) return

    setLoading(true)
    try {
      await addIncome({
        title,
        amount: parseFloat(amount),
        type,
        frequency,
        date,
      })

      // Limpiar formulario y recargar historial
      setTitle('')
      setAmount('')
      setDate(new Date().toISOString().split('T')[0])
      await loadIncomes()
    } catch (err) {
      console.error('Error al agregar ingreso:', err)
    } finally {
      setLoading(false)
    }
  }

  // Cálculo del total acumulado
  const totalIncomes = incomes.reduce((acc, curr) => acc + Number(curr.amount), 0)

  return (
    <div className="p-6 md:p-8 bg-gray-950 min-h-screen text-gray-100 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Ingresos</h1>
        <p className="text-sm text-gray-400 mt-1">
          Registra y administra tus sueldos, comisiones o ingresos adicionales en MXN.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de registro */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg h-fit">
          <h2 className="text-lg font-semibold mb-4">Nuevo Ingreso</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Concepto / Nombre
              </label>
              <input
                type="text"
                placeholder="Ej. Salario, Comisión de venta"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Monto (MXN)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Tipo de Ingreso
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'fixed' | 'variable')}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="variable">Variable</option>
                  <option value="fixed">Fijo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Frecuencia
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="monthly">Mensual</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="weekly">Semanal</option>
                  <option value="one_time">Única vez</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Guardando...' : 'Guardar Ingreso'}
            </button>
          </form>
        </div>

        {/* Historial e Indicadores */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-medium">Ingresos Totales Registrados</p>
              <p className="text-3xl font-bold mt-1 text-emerald-400">
                ${totalIncomes.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              {incomes.length} registros
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-gray-800">
              <h3 className="font-semibold text-sm">Historial de Ingresos</h3>
            </div>

            {fetching ? (
              <div className="p-8 text-center text-sm text-gray-500">Cargando registros...</div>
            ) : incomes.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Aún no has registrado ningún ingreso.
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {incomes.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-800/40 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-100">{inc.title}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded uppercase font-semibold">
                          {inc.type === 'fixed' ? 'Fijo' : 'Variable'}
                        </span>
                        <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded capitalize">
                          {inc.frequency}
                        </span>
                        <span className="text-[10px] text-gray-500">{inc.date}</span>
                      </div>
                    </div>

                    <div className="font-bold text-emerald-400 text-base">
                      +${Number(inc.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}