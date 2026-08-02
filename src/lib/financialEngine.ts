export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalDebtsBalance: number;
  totalDebtMinPayments: number;
}

export interface HealthReport {
  healthScore: number; // 0 a 100
  netCashFlow: number;
  debtToIncomeRatio: number;
  savingsCapacity: number;
  alerts: { type: 'danger' | 'warning' | 'success'; message: string }[];
  recommendations: string[];
}

export function analyzeFinancialHealth(summary: FinancialSummary): HealthReport {
  const { totalIncome, totalExpenses, totalDebtsBalance, totalDebtMinPayments } = summary;

  const netCashFlow = totalIncome - totalExpenses;
  const debtToIncomeRatio = totalIncome > 0 ? (totalDebtMinPayments / totalIncome) * 100 : 0;
  const savingsCapacity = netCashFlow > 0 ? netCashFlow : 0;

  const alerts: HealthReport['alerts'] = [];
  const recommendations: string[] = [];
  let score = 100;

  // 1. Regla de Flujo de Caja (Déficit / Superávit)
  if (netCashFlow < 0) {
    score -= 40;
    alerts.push({
      type: 'danger',
      message: `Tus gastos superan tus ingresos por $${Math.abs(netCashFlow).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN.`,
    });
    recommendations.push('Revisa tus gastos no esenciales y reduce suscripciones o consumo variable.');
  } else if (netCashFlow === 0 && totalIncome > 0) {
    score -= 20;
    alerts.push({
      type: 'warning',
      message: 'Estás al límite: tus ingresos equivalen exactamente a tus gastos.',
    });
  }

  // 2. Regla de Nivel de Endeudamiento (Límite saludable: 30% del ingreso)
  if (debtToIncomeRatio > 30) {
    score -= 30;
    alerts.push({
      type: 'warning',
      message: `Tus pagos mínimos de deuda representan el ${debtToIncomeRatio.toFixed(1)}% de tus ingresos (Máximo sugerido: 30%).`,
    });
    recommendations.push('Aplica el Método Avalancha abonando cualquier excedente a la deuda con mayor tasa de interés.');
  }

  // 3. Regla de Capacidad de Ahorro (Mínimo recomendado: 10%-20%)
  const savingsRatio = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;
  if (savingsRatio < 10 && netCashFlow > 0) {
    score -= 15;
    alerts.push({
      type: 'warning',
      message: 'Tu margen de ahorro actual es inferior al 10% de tus ingresos.',
    });
    recommendations.push('Automatiza una transferencia de ahorro de al menos el 10% tan pronto recibas tu ingreso fijo.');
  } else if (savingsRatio >= 20) {
    alerts.push({
      type: 'success',
      message: '¡Excelente disciplina! Estás reteniendo más del 20% de tus ingresos netos.',
    });
  }

  return {
    healthScore: Math.max(0, score),
    netCashFlow,
    debtToIncomeRatio,
    savingsCapacity,
    alerts,
    recommendations,
  };
}