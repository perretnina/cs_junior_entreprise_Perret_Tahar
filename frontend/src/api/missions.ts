import { apiRequest } from './client';

export type MyMission = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  domain: string;
};

export type Mission = MyMission & {
  price: string;
  signedAt: string | null;
  prospect: {
    id: number;
    name: string;
  };
  intervenants: {
    intervenant: {
      id: number;
      firstName: string;
      lastName: string;
    };
  }[];
};

export type MissionInput = {
  title: string;
  price: number;
  startDate: string;
  endDate: string;
  signedAt?: string | null;
  status:
    | 'DEVIS'
    | 'SIGNE'
    | 'FACTURE_ACOMPTE_EMISE'
    | 'FACTURE_ACOMPTE_PAYEE'
    | 'EN_COURS'
    | 'FACTURE_SOLDE_EMISE'
    | 'FACTURE_SOLDE_PAYEE'
    | 'TERMINEE';
  domain: 'INFORMATIQUE' | 'MICROELECTRONIQUE';
  prospectId: number;
  intervenantIds: number[];
};

export async function getMyMissions(): Promise<MyMission[]> {
  return apiRequest('/missions/mine');
}

export async function getMissions(): Promise<Mission[]> {
  return apiRequest('/missions');
}

export async function getMission(id: number): Promise<Mission> {
  return apiRequest(`/missions/${id}`);
}

export async function createMission(
  data: MissionInput,
): Promise<Mission> {
  return apiRequest('/missions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMission(
  id: number,
  data: Partial<MissionInput>,
): Promise<Mission> {
  return apiRequest(`/missions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteMission(
  id: number,
): Promise<{ message: string }> {
  return apiRequest(`/missions/${id}`, {
    method: 'DELETE',
  });
}
