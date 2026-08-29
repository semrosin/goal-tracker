import { readJson, writeJson } from './safeStorage';

describe('safeStorage', () => {
  const isVersionedValue = (value: unknown): value is { version: number } =>
    typeof value === 'object' && value !== null && 'version' in value && typeof value.version === 'number';

  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when data is missing', () => {
    expect(readJson('goal-tracker-state', isVersionedValue)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    localStorage.setItem('goal-tracker-state', '{not-json');

    expect(readJson('goal-tracker-state', isVersionedValue)).toBeNull();
  });

  it('returns null when stored data fails validation', () => {
    localStorage.setItem('goal-tracker-state', '{"version":"1"}');

    expect(readJson('goal-tracker-state', isVersionedValue)).toBeNull();
  });

  it('writes serializable data and reports success', () => {
    expect(writeJson('goal-tracker-state', { version: 1 })).toBe(true);
    expect(localStorage.getItem('goal-tracker-state')).toBe('{"version":1}');
  });
});
