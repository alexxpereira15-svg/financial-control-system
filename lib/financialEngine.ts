export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalDebtsBalance: number;
  totalDebtMinPayments: number;
}

export interface FinancialHealthReport {
  healthScore: number; // 0 a 100
  netCashFlow: number;
  savingsCapacity: number;
  debtToIncomeRatio: number; // Porcentaje
  alerts: { type: 'danger' | 'warning' | 'success'; message: string }[];
  recommendations: string[];
}

export function analyzeFinancialHealth(summary: FinancialSummary): FinancialHealthReport {
  const { totalIncome, totalExpenses, totalDebtsBalance, totalDebtMinPayments } = summary;
  
  const netCashFlow = totalIncome - totalExpenses;
  const debtToIncomeRatio = totalIncome > 0 ? (totalDebtMinPayments / totalIncome) * 100 : 0;
  const savingsCapacity = netCashFlow > 0 ? netCashFlow : 0;
  
  const alerts: FinancialHealthReport['alerts'] = [];
  const recommendations: string[] = [];
  let score = 100;

  // 1. Regla: Flujo de Caja
  if (netCashFlow < 0) {
    score -= 40;
    alerts.push({
      type: 'danger',
      message: `Estás operando en déficit. Tus gastos superan tus ingresos por $${Math.abs(netCashFlow).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`,
    });
    recommendations.push('Revisa tus gastos variables inmediatamente y recorta suscripciones o consumos no esenciales.');
  }

  // 2. Regla: Nivel de Endeudamiento (Límite saludable: 30% del ingreso)
  if (debtToIncomeRatio > 30) {
    score -= 30;
    alerts.push({
      type: 'warning',
      message: `Tus compromisos de deuda comprometen el ${debtToIncomeRatio.toFixed(1)}% de tus ingresos mensuales (Límite recomendado: 30%).`,
    });
    recommendations.push('Aplica el Método Avalancha: Destina cualquier excedente a la deuda con la tasa de interés anual más alta.');
  }

  // 3. Regla: Capacidad de Ahorro
  const savingsRatio = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;
  if (savingsRatio < 10 && netCashFlow > 0) {
    score -= 15;
    alerts.push({
      type: 'warning',
      message: 'Estás ahorrando menos del 10% de tus ingresos mensuales.',
    });
    recommendations.push('Intenta automatizar el ahorro de al menos el 10% de tus ingresos fijos apenas los recibas.');
  } else if (savingsRatio >= 20) {
    alerts.push({
      type: 'success',
      message: '¡Excelente capacidad de ahorro! Estás ahorrando más del 20% de tus ingresos.',
    });
  }

  return {
    healthScore: Math.max(0, score),
    netCashFlow,
    savingsCapacity,
    debtToIncomeRatio,
    alerts,
    recommendations,
  };
}