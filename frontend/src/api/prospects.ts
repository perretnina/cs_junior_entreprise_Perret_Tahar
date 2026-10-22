
import { apiRequest } from './client';

export type ProspectStatus =
  | 'PAS_ENCORE_CONTACTE'
  | 'A_RECONTACTER'
  | 'PAS_INTERESSE'
  | 'EN_COURS'
  | 'A_FIDELISER';

export type ProspectDomain =
  | 'INFORMATIQUE'
  | 'MICROELECTRONIQUE';

export type Prospect = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: ProspectStatus;
  domain: ProspectDomain;
  _count: {
    missions: number;
  };
};

export type ProspectDetail = Omit<Prospect, '_count'> & {
  missions: {
    id: number;
    title: string;
    status: string;
  }[];
};

export type ProspectInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  status: ProspectStatus;
  domain: ProspectDomain;
};

export function getProspects(): Promise<Prospect[]> {
  return apiRequest('/prospects');
}

export function getProspect(id: number): Promise<ProspectDetail> {
  return apiRequest(`/prospects/${id}`);
}

export function createProspect(data: ProspectInput): Promise<Prospect> {
  return apiRequest('/prospects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProspect(
  id: number,
  data: ProspectInput,
): Promise<Prospect> {
  return apiRequest(`/prospects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteProspect(
  id: number,
): Promise<{ message: string }> {
  return apiRequest(`/prospects/${id}`, {
    method: 'DELETE',
  });
}
