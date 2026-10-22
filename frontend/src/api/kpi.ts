
import { apiRequest } from './client';

export type KpiDomain = 'INFORMATIQUE' | 'MICROELECTRONIQUE';

export type Kpi = {
  filters: {
    domain: KpiDomain | null;
    startDate: string | null;
    endDate: string | null;
  };
  totalMissions: number;
  signedRevenue: number;
  averageSignedPrice: number;
  averageDurationDays: number;
  distinctIntervenants: number;
  conversionRate: number;
  contactedProspects: number;
  convertedProspects: number;
};

export async function getKpi(
  year?: number,
  domain?: KpiDomain,
  month?: number,
): Promise<Kpi> {
  const params = new URLSearchParams();

  if (year !== undefined) {
    if (month !== undefined && year === new Date().getFullYear()) {
      const monthText = String(month).padStart(2, '0');
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

      params.set('startDate', `${year}-${monthText}-01`);
      params.set('endDate', `${year}-${monthText}-${String(lastDay).padStart(2, '0')}`);
    } else {
      params.set('startDate', `${year}-01-01`);
      params.set('endDate', `${year}-12-31`);
    }
  }

  if (domain !== undefined) {
    params.set('domain', domain);
  }

  const query = params.toString();

  return apiRequest(`/kpi${query ? `?${query}` : ''}`);
}
