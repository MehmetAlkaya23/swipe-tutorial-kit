import {
  createMemoryStorage,
  needsTutorial,
  parseRecord,
  storageKey,
} from '../storage';

describe('parseRecord', () => {
  it('returns null when nothing is stored', () => {
    expect(parseRecord(null)).toBeNull();
  });

  it('parses a valid record', () => {
    const raw = JSON.stringify({ version: 2, completedAt: '2026-01-01T00:00:00.000Z' });
    expect(parseRecord(raw)).toEqual({ version: 2, completedAt: '2026-01-01T00:00:00.000Z' });
  });

  it.each([
    ['malformed JSON', '{not json'],
    ['a primitive', '"true"'],
    ['null', 'null'],
    ['a missing version', JSON.stringify({ completedAt: 'x' })],
    ['a string version', JSON.stringify({ version: '1', completedAt: 'x' })],
  ])('treats %s as never seen', (_label, raw) => {
    expect(parseRecord(raw)).toBeNull();
  });
});

describe('needsTutorial', () => {
  const record = { version: 2, completedAt: '2026-01-01T00:00:00.000Z' };

  it('is true without a record', () => {
    expect(needsTutorial(null, 1)).toBe(true);
  });

  it('is false for the same or an older version', () => {
    expect(needsTutorial(record, 2)).toBe(false);
    expect(needsTutorial(record, 1)).toBe(false);
  });

  it('is true when the tutorial version was bumped', () => {
    expect(needsTutorial(record, 3)).toBe(true);
  });
});

describe('createMemoryStorage', () => {
  it('round-trips values and supports removal', async () => {
    const storage = createMemoryStorage({ seeded: 'yes' });
    expect(await storage.getItem('seeded')).toBe('yes');
    expect(await storage.getItem('missing')).toBeNull();

    await storage.setItem('k', 'v');
    expect(await storage.getItem('k')).toBe('v');

    await storage.removeItem('k');
    expect(await storage.getItem('k')).toBeNull();
  });
});

it('namespaces storage keys', () => {
  expect(storageKey('deck')).toBe('@swipe-tutorial-kit/deck');
});
