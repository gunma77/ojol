import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { level01 } from '@/data/levels';
import { compileProgram } from '@/engine/compiler/compile';

import { CodeEditor } from '../editor/CodeEditor';
import { RoadMap } from '../map/RoadMap';

const level = level01;
const initialScript = 'maju(2)\nbelokKanan()\nmaju(1)';
const animationDuration = 520;

export function GameScreen() {
  const [script, setScript] = useState(initialScript);
  const [coordinate, setCoordinate] = useState<[number, number]>(level.nodes[level.start.node]);
  const [bearing, setBearing] = useState(level.start.bearing);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [outcome, setOutcome] = useState('Tulis skrip, lalu jalankan untuk mengantar motor.');
  const [running, setRunning] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [runSequence, setRunSequence] = useState(0);

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
    setOutcome('Memeriksa skrip…');
    setCoordinate(level.nodes[level.start.node]);
    setBearing(level.start.bearing);
    setRunSequence((sequence) => sequence + 1);

    const startedAt = performance.now();
    const result = compileProgram(script, level);
    const compileTime = performance.now() - startedAt;

    if (!result.ok) {
      setErrorLine(result.error.line > 0 ? result.error.line : null);
      setOutcome(`${result.error.message} (${compileTime.toFixed(1)} ms)`);
      setRunning(false);
      return;
    }

    for (const step of result.trajectory) {
      setBearing(step.bearing);
      if (step.action === 'CRASH') {
        break;
      }
      if (step.action === 'MOVE') {
        setCoordinate(step.coordinate);
        await waitForAnimation(animationDuration);
      } else {
        await waitForAnimation(300);
      }
    }

    if (result.crashed) {
      setOutcome(`CRASH di simpang ${result.finalNode}. Periksa perintah pada baris ${result.trajectory.at(-1)?.line ?? 1}.`);
    } else if (result.reachedGoal) {
      setOutcome(`Tujuan tercapai! Kompilasi ${compileTime.toFixed(1)} ms · ${result.loc} LOC.`);
    } else {
      setOutcome(`Motor berhenti di simpang ${result.finalNode}, belum sampai tujuan.`);
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
            <Text style={styles.title}>Level 1: {level.title}</Text>
          </View>
          <Text style={styles.levelTag}>01</Text>
        </View>

        <View style={[styles.mapPanel, { flex: keyboardVisible ? 2 : 3 }]}>
          <RoadMap
            level={level}
            coordinate={coordinate}
            bearing={bearing}
            runSequence={runSequence}
          />
          <View style={styles.mapBadge}>
            <Text style={styles.mapBadgeText}>PETA OFFLINE · BANDUNG</Text>
          </View>
        </View>

        <View style={[styles.editorPanel, { flex: keyboardVisible ? 4 : 3 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skrip perjalanan</Text>
            <Text style={styles.commandHint}>maju · belokKanan · belokKiri · putarBalik · mundur</Text>
          </View>
          <CodeEditor
            value={script}
            onChangeText={setScript}
            errorLine={errorLine}
            editable={!running}
          />
          <Text accessibilityLiveRegion="polite" style={styles.outcome}>
            {outcome}
          </Text>
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
    paddingBottom: 8,
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
  levelTag: {
    overflow: 'hidden',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 6,
    color: '#38634d',
    backgroundColor: '#e2eee6',
    fontWeight: '800',
  },
  mapPanel: {
    minHeight: 115,
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
  editorPanel: {
    minHeight: 220,
    gap: 8,
    paddingTop: 13,
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
    minHeight: 34,
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
});
