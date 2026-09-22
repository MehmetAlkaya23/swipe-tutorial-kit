import { act, renderHook, waitFor } from '@testing-library/react-native';

import { createMemoryStorage, storageKey, type TutorialStorage } from '../storage';
import { useSwipeTutorial } from '../useSwipeTutorial';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const completed = (version: number) =>
  JSON.stringify({ version, completedAt: '2026-01-01T00:00:00.000Z' });

describe('useSwipeTutorial', () => {
  it('starts loading, then shows the tutorial to a first-time user', async () => {
    const storage = createMemoryStorage();
    const { result } = renderHook(() => useSwipeTutorial({ id: 'deck', storage }));

    expect(result.current.status).toBe('loading');
    expect(result.current.visible).toBe(false);

    await waitFor(() => expect(result.current.status).toBe('pending'));
    expect(result.current.visible).toBe(true);
  });

  it('stays hidden for a user who already completed this version', async () => {
    const storage = createMemoryStorage({ [storageKey('deck')]: completed(1) });
    const { result } = renderHook(() => useSwipeTutorial({ id: 'deck', storage }));

    await waitFor(() => expect(result.current.status).toBe('completed'));
    expect(result.current.visible).toBe(false);
  });

  it('shows again after the version is bumped', async () => {
    const storage = createMemoryStorage({ [storageKey('deck')]: completed(1) });
    const { result } = renderHook(() => useSwipeTutorial({ id: 'deck', storage, version: 2 }));

    await waitFor(() => expect(result.current.status).toBe('pending'));
  });

  it('persists completion with the current version', async () => {
    const storage = createMemoryStorage();
    const { result } = renderHook(() => useSwipeTutorial({ id: 'deck', storage, version: 3 }));
    await waitFor(() => expect(result.current.visible).toBe(true));

    await act(() => result.current.complete());

    expect(result.current.visible).toBe(false);
    const saved = JSON.parse((await storage.getItem(storageKey('deck')))!);
    expect(saved.version).toBe(3);
    expect(typeof saved.completedAt).toBe('string');
  });

  it('reset forgets completion and shows the tutorial', async () => {
    const storage = createMemoryStorage({ [storageKey('deck')]: completed(1) });
    const { result } = renderHook(() => useSwipeTutorial({ id: 'deck', storage }));
    await waitFor(() => expect(result.current.status).toBe('completed'));

    await act(() => result.current.reset());

    expect(result.current.visible).toBe(true);
    expect(await storage.getItem(storageKey('deck'))).toBeNull();
  });

  it('show reopens the tutorial without touching storage', async () => {
    const storage = createMemoryStorage({ [storageKey('deck')]: completed(1) });
    const { result } = renderHook(() => useSwipeTutorial({ id: 'deck', storage }));
    await waitFor(() => expect(result.current.status).toBe('completed'));

    act(() => result.current.show());

    expect(result.current.visible).toBe(true);
    expect(await storage.getItem(storageKey('deck'))).toBe(completed(1));
  });

  it('respects enabled=false', async () => {
    const storage = createMemoryStorage();
    const { result } = renderHook(() => useSwipeTutorial({ id: 'deck', storage, enabled: false }));

    await waitFor(() => expect(result.current.status).toBe('pending'));
    expect(result.current.visible).toBe(false);
  });

  it('does not let a slow read overwrite a completion made while it was pending', async () => {
    const read = deferred<string | null>();
    const storage: TutorialStorage = {
      getItem: () => read.promise,
      setItem: jest.fn(() => Promise.resolve()),
      removeItem: jest.fn(() => Promise.resolve()),
    };
    const { result } = renderHook(() => useSwipeTutorial({ id: 'deck', storage }));

    await act(() => result.current.complete());
    await act(async () => read.resolve(null));

    expect(result.current.status).toBe('completed');
  });

  it('shows the tutorial and reports the error when reading fails', async () => {
    const error = new Error('disk on fire');
    const onError = jest.fn();
    const storage: TutorialStorage = {
      getItem: () => Promise.reject(error),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
    const { result } = renderHook(() => useSwipeTutorial({ id: 'deck', storage, onError }));

    await waitFor(() => expect(result.current.status).toBe('pending'));
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('stays hidden and reports the error when saving fails', async () => {
    const error = new Error('quota exceeded');
    const onError = jest.fn();
    const storage: TutorialStorage = {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.reject(error),
      removeItem: () => Promise.reject(error),
    };
    const { result } = renderHook(() => useSwipeTutorial({ id: 'deck', storage, onError }));
    await waitFor(() => expect(result.current.visible).toBe(true));

    await act(() => result.current.complete());
    expect(result.current.visible).toBe(false);
    expect(onError).toHaveBeenCalledWith(error);

    await act(() => result.current.reset());
    expect(result.current.visible).toBe(true);
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it('re-reads storage when the id changes', async () => {
    const storage = createMemoryStorage({ [storageKey('a')]: completed(1) });
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useSwipeTutorial({ id, storage }),
      { initialProps: { id: 'a' } },
    );
    await waitFor(() => expect(result.current.status).toBe('completed'));

    rerender({ id: 'b' });

    await waitFor(() => expect(result.current.status).toBe('pending'));
  });
});
