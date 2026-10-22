import { apiRequest } from './client';

export type IntervenantMission = {
  missionId: number;
  intervenantId: number;
  mission: {
    id: number;
    title: string;
    endDate: string;
    status: string;
  };
};

export type Intervenant = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  schoolEndDate: string;
  userId: number | null;
  missions: IntervenantMission[];
};

export type IntervenantInput = {
  firstName: string;
  lastName: string;
  email: string;
  schoolEndDate: string;
};

export function getIntervenants(): Promise<Intervenant[]> {
  return apiRequest('/intervenants');
}

export function createIntervenant(
  data: IntervenantInput,
): Promise<Intervenant> {
  return apiRequest('/intervenants', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateIntervenant(
  id: number,
  data: Partial<IntervenantInput>,
): Promise<Intervenant> {
  return apiRequest(`/intervenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteIntervenant(
  id: number,
): Promise<Intervenant> {
  return apiRequest(`/intervenants/${id}`, {
    method: 'DELETE',
  });
}