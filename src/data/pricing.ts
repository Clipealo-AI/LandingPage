/** Shared public prices for the landing, pricing page and checkout. */
export const planCatalog = {
  free: { name: 'Free', monthlyPEN: 0, annualPEN: 0, monthlyUSD: 0, annualUSD: 0, credits: 30 },
  basico: { name: 'Básico', monthlyPEN: 45, annualPEN: 36, monthlyUSD: 12.5, annualUSD: 10, credits: 300 },
  estandar: { name: 'Estándar', monthlyPEN: 90, annualPEN: 72, monthlyUSD: 25, annualUSD: 20, credits: 600 },
  premium: { name: 'Premium', monthlyPEN: 180, annualPEN: 144, monthlyUSD: 50, annualUSD: 40, credits: 1200 },
} as const;

export const creditPacks = [
  { credits: 60, hours: 1, pen: 5.5, usd: 1.5 },
  { credits: 180, hours: 3, pen: 16.5, usd: 4.6 },
  { credits: 300, hours: 5, pen: 27.5, usd: 7.65 },
] as const;

export const extraCreditPrice = { penPerCredit: 0.092, usdPerCredit: 0.025 } as const;
