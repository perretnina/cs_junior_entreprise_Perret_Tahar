import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { apiRequest, API_URL } from './client';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal('fetch', fetchMock);

  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  );
});

afterEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('apiRequest', () => {
  it('utilise la bonne URL et retourne le JSON', async () => {
    const result = await apiRequest('/health');

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/health`,
      expect.any(Object),
    );

    expect(result).toEqual({ success: true });
  });

  it('transmet le token JWT lorsqu’il existe', async () => {
    sessionStorage.setItem('accessToken', 'token-test');

    await apiRequest('/missions');

    const options = fetchMock.mock.calls[0][1];
    const headers = new Headers(options?.headers);

    expect(headers.get('Authorization')).toBe(
      'Bearer token-test',
    );
  });

  it('ne transmet pas Authorization sans token', async () => {
    await apiRequest('/missions');

    const options = fetchMock.mock.calls[0][1];
    const headers = new Headers(options?.headers);

    expect(headers.has('Authorization')).toBe(false);
  });

  it('ajoute Content-Type pour un corps JSON', async () => {
    await apiRequest('/missions', {
      method: 'POST',
      body: JSON.stringify({ title: 'Mission test' }),
    });

    const options = fetchMock.mock.calls[0][1];
    const headers = new Headers(options?.headers);

    expect(headers.get('Content-Type')).toBe(
      'application/json',
    );
  });

  it('conserve un Content-Type déjà défini', async () => {
    await apiRequest('/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'contenu',
    });

    const options = fetchMock.mock.calls[0][1];
    const headers = new Headers(options?.headers);

    expect(headers.get('Content-Type')).toBe('text/plain');
  });

  it('remonte le message d’erreur du backend', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: 'Accès interdit' }),
        { status: 403 },
      ),
    );

    await expect(
      apiRequest('/missions'),
    ).rejects.toThrow('Accès interdit');
  });

  it('utilise le statut HTTP si le message est absent', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('Erreur serveur', { status: 500 }),
    );

    await expect(
      apiRequest('/missions'),
    ).rejects.toThrow('Erreur HTTP 500');
  });
});
