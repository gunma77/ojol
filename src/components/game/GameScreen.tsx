import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { levels } from '@/data/levels';
import { compileProgram } from '@/engine/compiler/compile';
import type { LevelData } from '@/engine/compiler/types';
import type { StarRating } from '@/engine/scoring';
import { scoreResult } from '@/engine/scoring';

import { ExternalLink } from '../external-link';
import { CodeEditor } from '../editor/CodeEditor';
import { RoadMap } from '../map/RoadMap';

const animationDuration = 520;
const previousLevelOneDefault = 'maju(2)\nbelokKanan()\nmaju(1)';

interface GameScreenProps {
  level: LevelData;
  initialScript?: string;
  savedStars: StarRating;
  persistenceError: string | null;
  onBackToLevels: () => void;
  onComplete: (levelId: string, stars: 1 | 2 | 3) => void;
  onDraftChange: (levelId: string, draft: string) => void;
}

export function GameScreen({
  level,
  initialScript,
  savedStars,
  persistenceError,
  onBackToLevels,
  onComplete,
  onDraftChange,
}: GameScreenProps) {
  const [script, setScript] = useState(
    level.level_id === 'lvl_01' && initialScript === previousLevelOneDefault
      ? 'maju(1)'
      : initialScript ?? 'maju(1)',
  );
  const [coordinate, setCoordinate] = useState<[number, number]>(level.nodes[level.start.node]);
  const [bearing, setBearing] = useState(level.start.bearing);
  const [movementPath, setMovementPath] = useState<[number, number][] | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [syntaxError, setSyntaxError] = useState<{ line: number; message: string } | null>(null);
  const [scoreModal, setScoreModal] = useState<{
    stars: 1 | 2 | 3;
    bestStars: StarRating;
    compileTime: number;
    loc: number;
  } | null>(null);
  const [stoppedModal, setStoppedModal] = useState<string | null>(null);
  const [outcome, setOutcome] = useState('Tulis skrip, lalu jalankan untuk mengantar motor.');
  const [running, setRunning] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [runSequence, setRunSequence] = useState(0);
  const levelNumber = levels.findIndex((entry) => entry.level_id === level.level_id) + 1;

  useEffect(() => {
    const timer = setTimeout(() => onDraftChange(level.level_id, script), 350);
    return () => clearTimeout(timer);
  }, [level.level_id, onDraftChange, script]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const waitForAnimation = (duration: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, duration));

  const runProgram = async () => {
    if (running) {
      return;
    }

    setRunning(true);
    setErrorLine(null);
    setSyntaxError(null);
    setOutcome('Memeriksa skrip…');
    setCoordinate(level.nodes[level.start.node]);
    setBearing(level.start.bearing);
    setMovementPath(null);
    setRunSequence((sequence) => sequence + 1);

    const startedAt = performance.now();
    const result = compileProgram(script, level);
    const compileTime = performance.now() - startedAt;

    if (!result.ok) {
      setErrorLine(result.error.line > 0 ? result.error.line : null);
      setOutcome(`${result.error.message} (${compileTime.toFixed(1)} ms)`);
      setSyntaxError({ line: result.error.line, message: result.error.message });
      Keyboard.dismiss();
      setRunning(false);
      return;
    }

    const stars = scoreResult(result, level);
    if (stars !== 0) {
      onComplete(level.level_id, stars);
    }

    for (const step of result.trajectory) {
      setBearing(step.bearing);
      if (step.action === 'CRASH') {
        break;
      }
      if (step.action === 'MOVE') {
        setCoordinate(step.coordinate);
        setMovementPath(step.geometry ?? [step.coordinate]);
        await waitForAnimation(animationDuration);
      } else {
        setMovementPath(null);
        await waitForAnimation(300);
      }
    }

    if (result.crashed) {
      setOutcome(`CRASH di titik ${result.finalNode}. Periksa perintah pada baris ${result.trajectory.at(-1)?.line ?? 1}.`);
    } else if (result.reachedGoal && stars !== 0) {
      Keyboard.dismiss();
      setOutcome('');
      setScoreModal({
        stars,
        bestStars: savedStars > stars ? savedStars : stars,
        compileTime,
        loc: result.loc,
      });
    } else {
      Keyboard.dismiss();
      setOutcome('');
      setStoppedModal(`Motor berhenti di simpang ${result.finalNode}, belum sampai tujuan.`);
    }
    setRunning(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>CODEPATH · OJOL EDITION</Text>
            <Text style={styles.title}>Level {levelNumber}: {level.title}</Text>
            <Text numberOfLines={2} style={styles.missionText}>
              {level.mission}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={running}
            onPress={() => {
              Keyboard.dismiss();
              onBackToLevels();
            }}
            style={styles.levelTag}>
            <Text style={styles.levelTagText}>Daftar level</Text>
          </Pressable>
        </View>

        <View style={[styles.mapPanel, { flex: keyboardVisible ? 2 : 3 }]}>
          <RoadMap
            level={level}
            coordinate={coordinate}
            bearing={bearing}
            movementPath={movementPath}
            runSequence={runSequence}
          />
          <View style={styles.mapBadge}>
            <Text style={styles.mapBadgeText}>PETA BANDUNG · DATA OFFLINE</Text>
            <ExternalLink
              href="https://www.openstreetmap.org/copyright"
              style={styles.mapAttribution}>
              © OpenStreetMap contributors
            </ExternalLink>
          </View>
        </View>

        <View style={[styles.editorPanel, { flex: keyboardVisible ? 4 : 3 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skrip perjalanan</Text>
            <Text style={styles.commandHint}>maju · belokKanan · belokKiri · putarBalik · mundur</Text>
          </View>
          {persistenceError && (
            <Text accessibilityLiveRegion="polite" style={styles.persistenceError}>
              {persistenceError}
            </Text>
          )}
          <CodeEditor
            value={script}
            onChangeText={setScript}
            errorLine={errorLine}
            editable={!running}
          />
          {outcome.length > 0 && (
            <Text accessibilityLiveRegion="polite" style={styles.outcome}>
              {outcome}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={running}
            onPress={runProgram}
            style={({ pressed }) => [
              styles.runButton,
              running && styles.runButtonDisabled,
              pressed && !running && styles.runButtonPressed,
            ]}>
            <Text style={styles.runButtonText}>
              {running ? 'Motor sedang berjalan…' : 'Kompilasi & Jalankan'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <Modal
        animationType="fade"
        onRequestClose={() => setSyntaxError(null)}
        transparent
        visible={syntaxError !== null}>
        <View style={styles.modalBackdrop}>
          <View accessibilityRole="alert" style={styles.errorModal}>
            <Text style={styles.errorTitle}>Syntax Error</Text>
            <Text style={styles.errorLineText}>
              {syntaxError?.line ? `Baris ${syntaxError.line}` : 'Data skrip'}
            </Text>
            <Text style={styles.errorMessage}>{syntaxError?.message}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSyntaxError(null)}
              style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Perbaiki skrip</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        onRequestClose={() => setStoppedModal(null)}
        transparent
        visible={stoppedModal !== null}>
        <View style={styles.modalBackdrop}>
          <View accessibilityRole="alert" style={styles.scoreModal}>
            <Text style={styles.scoreTitle}>Belum sampai tujuan</Text>
            <Text style={styles.stoppedMessage}>{stoppedModal}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setStoppedModal(null)}
              style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Kembali mengedit</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setStoppedModal(null);
                Keyboard.dismiss();
                onBackToLevels();
              }}
              style={styles.levelsButton}>
              <Text style={styles.levelsButtonText}>Daftar level</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        onRequestClose={() => setScoreModal(null)}
        transparent
        visible={scoreModal !== null}>
        <View style={styles.modalBackdrop}>
          <View accessibilityRole="alert" style={styles.scoreModal}>
            <Text style={styles.scoreTitle}>Tujuan tercapai!</Text>
            <Text
              accessibilityLabel={`${scoreModal?.stars ?? 0} dari 3 bintang`}
              style={styles.scoreStars}>
              {Array.from({ length: 3 }, (_, index) =>
                index < (scoreModal?.stars ?? 0) ? '★' : '☆',
              ).join(' ')}
            </Text>
            <Text style={styles.scoreSummary}>
              Bintang terbaik: {scoreModal?.bestStars ?? 0}/3
            </Text>
            <Text style={styles.scoreDetails}>
              {scoreModal?.compileTime.toFixed(1)} ms · {scoreModal?.loc} LOC
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setScoreModal(null)}
              style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Kembali mengedit</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setScoreModal(null);
                Keyboard.dismiss();
                onBackToLevels();
              }}
              style={styles.levelsButton}>
              <Text style={styles.levelsButtonText}>Daftar level</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f9f7',
  },
  keyboardAvoider: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  header: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  eyebrow: {
    color: '#617269',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  title: {
    marginTop: 3,
    color: '#1e2b24',
    fontSize: 18,
    fontWeight: '800',
  },
  missionText: {
    maxWidth: 250,
    marginTop: 3,
    color: '#617269',
    fontSize: 10,
    lineHeight: 14,
  },
  levelTag: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: '#e2eee6',
  },
  levelTagText: {
    color: '#38634d',
    fontWeight: '800',
  },
  mapPanel: {
    minHeight: 80,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dce5df',
    backgroundColor: '#edf2ee',
  },
  mapBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#ffffffdd',
  },
  mapBadgeText: {
    color: '#48584e',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  mapAttribution: {
    color: '#59665f',
    fontSize: 9,
    fontWeight: '600',
  },
  editorPanel: {
    minHeight: 0,
    flexShrink: 1,
    gap: 8,
    paddingTop: 13,
  },
  persistenceError: {
    color: '#a32020',
    fontSize: 11,
  },
  sectionHeader: {
    gap: 3,
  },
  sectionTitle: {
    color: '#1e2b24',
    fontSize: 16,
    fontWeight: '800',
  },
  commandHint: {
    color: '#69766e',
    fontSize: 10,
  },
  outcome: {
    minHeight: 24,
    color: '#435148',
    fontSize: 12,
    lineHeight: 17,
  },
  runButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#177245',
  },
  runButtonDisabled: {
    backgroundColor: '#84968b',
  },
  runButtonPressed: {
    opacity: 0.85,
  },
  runButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#10251dcc',
  },
  errorModal: {
    gap: 10,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#ffffff',
  },
  scoreModal: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  scoreTitle: {
    color: '#1e2b24',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  scoreStars: {
    color: '#f0a000',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 2,
  },
  scoreSummary: {
    color: '#38634d',
    fontSize: 16,
    fontWeight: '800',
  },
  scoreDetails: {
    color: '#69766e',
    fontSize: 12,
  },
  stoppedMessage: {
    color: '#435148',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#a32020',
    fontSize: 20,
    fontWeight: '800',
  },
  errorLineText: {
    color: '#59665f',
    fontSize: 13,
    fontWeight: '700',
  },
  errorMessage: {
    color: '#263238',
    fontSize: 15,
    lineHeight: 22,
  },
  closeButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#177245',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  levelsButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  levelsButtonText: {
    color: '#38634d',
    fontSize: 14,
    fontWeight: '800',
  },
});
