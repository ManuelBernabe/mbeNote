import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppUpdate } from './useAppUpdate';

// ── Storage mock ────────────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => { store[k] = v; }),
    removeItem: vi.fn((k: string) => { delete store[k]; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ── Helpers ────────────────────────────────────────────────────────────────────

type RegListener = (event: Event) => void;

function createMockRegistration(overrides: Partial<ServiceWorkerRegistration> = {}) {
  const listeners: Record<string, RegListener[]> = {};
  return {
    waiting: null,
    installing: null,
    active: null,
    update: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn((name: string, cb: RegListener) => {
      if (!listeners[name]) listeners[name] = [];
      listeners[name].push(cb);
    }),
    removeEventListener: vi.fn((name: string, cb: RegListener) => {
      if (listeners[name]) listeners[name] = listeners[name].filter(l => l !== cb);
    }),
    _fireEvent: (name: string) => listeners[name]?.forEach(cb => cb({} as Event)),
    ...overrides,
  };
}

function setupServiceWorker(reg: ReturnType<typeof createMockRegistration>) {
  const swListeners: Record<string, EventListener> = {};
  Object.defineProperty(navigator, 'serviceWorker', {
    writable: true,
    configurable: true,
    value: {
      ready: Promise.resolve(reg),
      controller: { state: 'activated' },
      addEventListener: vi.fn((event: string, cb: EventListener) => { swListeners[event] = cb; }),
      removeEventListener: vi.fn(),
    },
  });
}

function mockFetch(version: string | null) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: version !== null,
    json: async () => ({ version }),
  }));
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useAppUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('starts with needsRefresh = false', () => {
    mockFetch('v1');
    const reg = createMockRegistration();
    setupServiceWorker(reg);

    const { result } = renderHook(() => useAppUpdate());
    expect(result.current.needsRefresh).toBe(false);
  });

  it('stores server version in localStorage on first load', async () => {
    mockFetch('2024-01-01T00:00:00Z');
    const reg = createMockRegistration();
    setupServiceWorker(reg);

    renderHook(() => useAppUpdate());
    await act(async () => { await Promise.resolve(); });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'mbenote_server_version',
      '2024-01-01T00:00:00Z'
    );
  });

  it('checkForUpdate returns false when server version has not changed', async () => {
    mockFetch('v1');
    localStorageMock.getItem.mockReturnValue('v1');

    const reg = createMockRegistration();
    setupServiceWorker(reg);

    const { result } = renderHook(() => useAppUpdate());
    await act(async () => { await Promise.resolve(); });

    let found: boolean | undefined;
    act(() => { result.current.checkForUpdate().then(v => { found = v; }); });

    await act(async () => { await Promise.resolve(); });
    act(() => { vi.advanceTimersByTime(1100); });
    await act(async () => { await Promise.resolve(); });

    expect(found).toBe(false);
    expect(result.current.needsRefresh).toBe(false);
  });

  it('checkForUpdate returns true and sets needsRefresh when server version changed (new Railway deploy)', async () => {
    // Stored version is old; server now returns new version
    localStorageMock.getItem.mockReturnValue('v1');
    mockFetch('v2');

    const reg = createMockRegistration();
    setupServiceWorker(reg);

    const { result } = renderHook(() => useAppUpdate());
    await act(async () => { await Promise.resolve(); });

    let found: boolean | undefined;
    await act(async () => {
      found = await result.current.checkForUpdate();
    });

    expect(found).toBe(true);
    expect(result.current.needsRefresh).toBe(true);
    // New version saved to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('mbenote_server_version', 'v2');
  });

  it('checkForUpdate returns true when SW updatefound fires (fallback path)', async () => {
    // Server versions match → rely on SW detection
    mockFetch('v1');
    localStorageMock.getItem.mockReturnValue('v1');

    // Capture the updatefound listener as it is registered
    let capturedUpdateFound: (() => void) | null = null;
    const reg = createMockRegistration({
      addEventListener: vi.fn((name: string, cb: any) => {
        if (name === 'updatefound') capturedUpdateFound = cb;
      }),
      removeEventListener: vi.fn(),
    });
    setupServiceWorker(reg);

    const { result } = renderHook(() => useAppUpdate());
    await act(async () => { await Promise.resolve(); });

    let found: boolean | undefined;
    // Start checkForUpdate without awaiting so we can fire the event concurrently
    const checkPromise = result.current.checkForUpdate().then(v => { found = v; });

    // Flush several microtask cycles: fetch resolve + SW path setup
    await act(async () => {
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });

    // Listener should now be registered — fire updatefound
    await act(async () => {
      capturedUpdateFound?.();
      await Promise.resolve();
    });

    await act(async () => { await checkPromise; });

    expect(found).toBe(true);
    expect(result.current.needsRefresh).toBe(true);
  });

  it('checkForUpdate returns false when server is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    localStorageMock.getItem.mockReturnValue('v1');

    const reg = createMockRegistration({
      update: vi.fn().mockRejectedValueOnce(new Error('Network error')),
    });
    setupServiceWorker(reg);

    const { result } = renderHook(() => useAppUpdate());
    await act(async () => { await Promise.resolve(); });

    let found: boolean | undefined;
    await act(async () => { found = await result.current.checkForUpdate(); });

    expect(found).toBe(false);
  });

  it('applyUpdate clears stored version, posts SKIP_WAITING and reloads', async () => {
    mockFetch('v1');
    const mockPostMessage = vi.fn();
    const waitingSW = { state: 'installed', postMessage: mockPostMessage, addEventListener: vi.fn() } as unknown as ServiceWorker;
    const reg = createMockRegistration({ waiting: waitingSW });
    setupServiceWorker(reg);

    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: { href: 'http://localhost/', origin: 'http://localhost', pathname: '/' },
    });

    const { result } = renderHook(() => useAppUpdate());
    await act(async () => { await Promise.resolve(); });

    act(() => { result.current.applyUpdate(); });

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('mbenote_server_version');
    expect(window.location.href).toMatch(/\?v=\d+/);
  });
});
