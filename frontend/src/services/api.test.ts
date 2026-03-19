import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  deleteReminder,
  updateReminder,
  completeReminder,
  createReminder,
  getReminders,
} from './api';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
  localStorage.setItem('token', 'test-token');
});

afterEach(() => {
  localStorage.clear();
});

function mockOk(body: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function mockNoContent() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 204,
    json: () => Promise.resolve(undefined),
    text: () => Promise.resolve(''),
  });
}

// ── deleteReminder ─────────────────────────────────────────────────────────────

describe('deleteReminder', () => {
  it('calls DELETE /api/reminders/:id', async () => {
    mockNoContent();

    await deleteReminder('42');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/reminders/42');
    expect(options.method).toBe('DELETE');
  });

  it('sends Authorization header', async () => {
    mockNoContent();

    await deleteReminder('1');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer test-token');
  });
});

// ── updateReminder ─────────────────────────────────────────────────────────────

describe('updateReminder', () => {
  it('calls PUT /api/reminders/:id with body', async () => {
    const mockResponse = { id: 5, title: 'Actualizado', status: 'Active' };
    mockOk(mockResponse);

    const update = { title: 'Actualizado', status: 'Active' as const };
    await updateReminder('5', update as never);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/reminders/5');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toMatchObject({ title: 'Actualizado' });
  });
});

// ── completeReminder ───────────────────────────────────────────────────────────

describe('completeReminder', () => {
  it('calls POST /api/reminders/:id/complete', async () => {
    mockOk({ id: 3, status: 'Completed' });

    await completeReminder('3');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/reminders/3/complete');
    expect(options.method).toBe('POST');
  });
});

// ── createReminder ─────────────────────────────────────────────────────────────

describe('createReminder', () => {
  it('calls POST /api/reminders', async () => {
    mockOk({ id: 1, title: 'Nuevo aviso', status: 'Active' });

    await createReminder({
      title: 'Nuevo aviso',
      startDateTime: new Date().toISOString(),
      isAllDay: false,
      priority: 'Medium',
      notificationOffsets: '[15]',
      notificationChannels: 'InApp',
    } as never);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/reminders');
    expect(options.method).toBe('POST');
  });
});

// ── getReminders ───────────────────────────────────────────────────────────────

describe('getReminders', () => {
  it('calls GET /api/reminders without filters', async () => {
    mockOk({ items: [], totalCount: 0, page: 1, pageSize: 50 });

    await getReminders();

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/reminders');
  });

  it('appends query params when provided', async () => {
    mockOk({ items: [], totalCount: 0, page: 1, pageSize: 50 });

    await getReminders({ status: 'Active', page: 2 } as never);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('status=Active');
    expect(url).toContain('page=2');
  });
});

// ── Error handling ─────────────────────────────────────────────────────────────

describe('apiFetch error handling', () => {
  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve('{"message":"Not found"}'),
    });

    await expect(deleteReminder('999')).rejects.toThrow('Not found');
  });

  it('redirects to /login on 401', async () => {
    const originalLocation = window.location.href;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: originalLocation },
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    await expect(deleteReminder('1')).rejects.toThrow('No autorizado');
    expect(window.location.href).toBe('/login');
  });
});
