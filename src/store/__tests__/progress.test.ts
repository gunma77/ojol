import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { loadDraft, loadProgress, saveDraft, saveProgress } from '../progress';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('local progress storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips saved stars and the last level draft', async () => {
    const progress = { lvl_01: { stars: 3 as const, unlocked: true } };

    await saveProgress(progress);
    await saveDraft('lvl_01', 'maju(2)');

    await expect(loadProgress()).resolves.toEqual(progress);
    await expect(loadDraft('lvl_01')).resolves.toBe('maju(2)');
  });

  it('reports corrupt progress data instead of silently resetting it', async () => {
    await AsyncStorage.setItem('codepath/progress', '{"lvl_01":{"stars":9,"unlocked":true}}');

    await expect(loadProgress()).rejects.toThrow('Data progres tersimpan tidak valid.');
  });
});
