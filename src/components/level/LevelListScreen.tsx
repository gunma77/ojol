import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { levels } from '@/data/levels';
import { isLevelUnlocked } from '@/data/levels/progression';
import type { ProgressMap } from '@/store/progress';

interface LevelListScreenProps {
  progress: ProgressMap;
  persistenceError: string | null;
  onSelectLevel: (levelId: string) => void;
}

export function LevelListScreen({
  progress,
  persistenceError,
  onSelectLevel,
}: LevelListScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CODEPATH · OJOL EDITION</Text>
        <Text style={styles.title}>Pilih level</Text>
        <Text style={styles.subtitle}>Selesaikan level untuk membuka perjalanan berikutnya.</Text>
        {persistenceError && (
          <Text accessibilityLiveRegion="polite" style={styles.persistenceError}>
            {persistenceError}
          </Text>
        )}
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={levels}
        keyExtractor={(level) => level.level_id}
        renderItem={({ item: level, index }) => {
          const unlocked = isLevelUnlocked(levels, progress, index);
          const stars = progress[level.level_id]?.stars ?? 0;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !unlocked }}
              disabled={!unlocked}
              onPress={() => onSelectLevel(level.level_id)}
              style={({ pressed }) => [
                styles.levelCard,
                !unlocked && styles.levelCardLocked,
                pressed && unlocked && styles.levelCardPressed,
              ]}>
              <View style={styles.levelNumber}>
                <Text style={styles.levelNumberText}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <View style={styles.levelDetails}>
                <Text style={[styles.levelTitle, !unlocked && styles.lockedText]}>{level.title}</Text>
                <Text numberOfLines={2} style={styles.mission}>
                  {level.mission}
                </Text>
                <Text style={styles.levelStatus}>
                  {unlocked ? `Terbuka · Bintang ${stars}/3` : 'Terkunci'}
                </Text>
              </View>
              <Text style={styles.levelAction}>{unlocked ? 'Mulai' : 'Kunci'}</Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9f7',
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 28,
    paddingBottom: 20,
  },
  eyebrow: {
    color: '#617269',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  title: {
    marginTop: 6,
    color: '#1e2b24',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 7,
    color: '#69766e',
    fontSize: 14,
    lineHeight: 20,
  },
  persistenceError: {
    marginTop: 10,
    color: '#a32020',
    fontSize: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  levelCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dce5df',
    backgroundColor: '#ffffff',
  },
  levelCardLocked: {
    backgroundColor: '#f0f3f1',
  },
  levelCardPressed: {
    opacity: 0.8,
  },
  levelNumber: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#e2eee6',
  },
  levelNumberText: {
    color: '#38634d',
    fontWeight: '800',
  },
  levelDetails: {
    flex: 1,
    gap: 4,
  },
  levelTitle: {
    color: '#1e2b24',
    fontSize: 15,
    fontWeight: '700',
  },
  mission: {
    color: '#69766e',
    fontSize: 11,
    lineHeight: 15,
  },
  lockedText: {
    color: '#77827b',
  },
  levelStatus: {
    color: '#69766e',
    fontSize: 12,
  },
  levelAction: {
    color: '#177245',
    fontSize: 12,
    fontWeight: '800',
  },
});
