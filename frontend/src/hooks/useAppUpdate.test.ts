import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppUpdate } from './useAppUpdate';

// ── Helpers ────────────────────────────────────────────────────────────────────

function createMockRegistration(overrides: Partial<ServiceWorkerRegistration> = {}): ServiceWorkerRegistration {
  return {
    waiting: null,
    installing: null,
    active: null,
    update: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ...overrides,
  } as unknown as ServiceWorkerRegistration;
}

function setupServiceWorker(reg: ServiceWorkerRegistration) {
  const listeners: Record<string, EventListener> = {};

  Object.defineProperty(navigator, 'serviceWorker', {
    writable: true,
    value: {
      ready: Promise.resolve(reg),
      controller: { state: 'activated' },
      addEventListener: vi.fn((event: string, cb: EventListener) => {
        listeners[event] = cb;
      }),
      removeEventListener: vi.fn(),
      _fireEvent: (event: string) => listeners[event]?.({} as Event),
    },
  });

  return listeners;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useAppUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with needsRefresh = false', () => {
    const reg = createMockRegistration();
    setupServiceWorker(reg);

    const { result } = renderHook(() => useAppUpdate());

    expect(result.current.needsRefresh).toBe(false);
  });

  it('sets needsRefresh = true when a waiting SW is already present on mount', async () => {
    const waitingSW = { state: 'installed', addEventListener: vi.fn() } as unknown as ServiceWorker;
    const reg = createMockRegistration({ waiting: waitingSW });
    setupServiceWorker(reg);

    const { result } = renderHook(() => useAppUpdate());

    // Wait for the `ready` promise to resolve
    await act(async () => {});

    expect(result.current.needsRefresh).toBe(true);
  });

  it('checkForUpdate calls reg.update()', async () => {
    const reg = createMockRegistration();
    setupServiceWorker(reg);

    const { result } = renderHook(() => useAppUpdate());

    // Allow ready promise to resolve and store registrationRef
    await act(async () => {});

    const success = await result.current.checkForUpdate();
    expect(success).toBe(true);
    expect(reg.update).toHaveBeenCalledOnce();
  });

  it('checkForUpdate returns false when reg.update() throws', async () => {
    const reg = createMockRegistration({
      update: vi.fn().mockRejectedValueOnce(new Error('Network error')),
    });
    setupServiceWorker(reg);

    const { result } = renderHook(() => useAppUpdate());
    await act(async () => {});

    const success = await result.current.checkForUpdate();
    expect(success).toBe(false);
  });

  it('applyUpdate posts SKIP_WAITING and reloads', async () => {
    const mockPostMessage = vi.fn();
    const waitingSW = {
      state: 'installed',
      postMessage: mockPostMessage,
      addEventListener: vi.fn(),
    } as unknown as ServiceWorker;
    const reg = createMockRegistration({ waiting: waitingSW });
    setupServiceWorker(reg);

    // Mock location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/', origin: 'http://localhost', pathname: '/' },
    });

    const { result } = renderHook(() => useAppUpdate());
    await act(async () => {});

    act(() => {
      result.current.applyUpdate();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(window.location.href).toContain('?v=');
  });
});
