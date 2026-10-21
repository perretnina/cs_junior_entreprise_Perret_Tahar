import { apiRequest } from './client';

export type MyMission = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  domain: string;
};

export async function getMyMissions(): Promise<MyMission[]> {
  return apiRequest('/missions/mine');
}
