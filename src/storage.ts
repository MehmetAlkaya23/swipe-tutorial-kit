/**
 * The minimal async key-value contract the kit needs.
 *
 * `@react-native-async-storage/async-storage`, `expo-secure-store` (via a
 * three-line adapter) and most MMKV wrappers already satisfy it, so the kit
 * never has to depend on a particular storage package.
 */
export interface TutorialStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** What the kit persists for a tutorial once it has been completed. */
export interface TutorialRecord {
  /** The tutorial version the user completed. */
  version: number;
  /** ISO-8601 timestamp of completion. */
  completedAt: string;
}

export const STORAGE_PREFIX = '@swipe-tutorial-kit/';

export function storageKey(id: string): string {
  return `${STORAGE_PREFIX}${id}`;
}

/**
 * Parses a persisted record. Anything malformed is treated as "never seen"
 * rather than thrown, because a corrupt value must not brick the app.
 */
export function parseRecord(raw: string | null): TutorialRecord | null {
  if (raw == null) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as TutorialRecord).version === 'number' &&
      typeof (value as TutorialRecord).completedAt === 'string'
    ) {
      return value as TutorialRecord;
    }
  } catch {
    // Fall through: malformed JSON is the same as no record.
  }
  return null;
}

/** True when the user still needs to see `version` of the tutorial. */
export function needsTutorial(
  record: TutorialRecord | null,
  version: number,
): boolean {
  return record === null || record.version < version;
}

/**
 * A process-lifetime store. Useful for tests, Storybook, and for apps that
 * deliberately want the tutorial on every cold start.
 */
export function createMemoryStorage(
  initial: Record<string, string> = {},
): TutorialStorage {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => Promise.resolve(map.get(key) ?? null),
    setItem: (key, value) => {
      map.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key) => {
      map.delete(key);
      return Promise.resolve();
    },
  };
}
