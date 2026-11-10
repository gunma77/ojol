import { memo, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ScrollViewInstance,
} from 'react-native';

import { countLoc } from '@/engine/compiler/compile';

interface CodeEditorProps {
  value: string;
  onChangeText: (value: string) => void;
  errorLine: number | null;
  editable: boolean;
}

const syntaxPattern =
  /(#[^\n]*|\b(?:maju|mundur|belokKanan|belokKiri|putarBalik)\b|\b\d+\b|[();])/g;
const commands = new Set(['maju', 'mundur', 'belokKanan', 'belokKiri', 'putarBalik']);

function renderLine(line: string) {
  const segments = line.split(syntaxPattern);
  return segments.map((segment, index) => {
    let color = '#263238';
    if (segment.startsWith('#')) {
      color = '#78909c';
    } else if (commands.has(segment)) {
      color = '#1769aa';
    } else if (/^\d+$/.test(segment)) {
      color = '#c56b16';
    } else if (/^[();]$/.test(segment)) {
      color = '#65736c';
    }

    return (
      <Text key={`${index}-${segment}`} style={{ color }}>
        {segment}
      </Text>
    );
  });
}

export const CodeEditor = memo(function CodeEditor({
  value,
  onChangeText,
  errorLine,
  editable,
}: CodeEditorProps) {
  const numberScrollRef = useRef<ScrollViewInstance>(null);
  const highlightScrollRef = useRef<ScrollViewInstance>(null);
  const [limitReached, setLimitReached] = useState(false);
  const lines = useMemo(() => value.split('\n'), [value]);
  const lineNumbers = useMemo(
    () => lines.map((_, index) => `${index + 1}`).join('\n'),
    [lines],
  );

  const handleChange = (nextValue: string) => {
    if (nextValue.split('\n').length > 50) {
      setLimitReached(true);
      return;
    }
    setLimitReached(false);
    onChangeText(nextValue);
  };

  const syncScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    numberScrollRef.current?.scrollTo({ y, animated: false });
    highlightScrollRef.current?.scrollTo({ y, animated: false });
  };

  return (
    <View style={styles.container}>
      <View style={styles.editorRow}>
        <ScrollView
          ref={numberScrollRef}
          style={styles.lineNumberScroll}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.lineNumbers}>{lineNumbers}</Text>
        </ScrollView>
        <View style={styles.inputContainer}>
          <ScrollView
            ref={highlightScrollRef}
            style={StyleSheet.absoluteFill}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            pointerEvents="none">
            <Text style={styles.highlightText}>
              {lines.map((line, index) => (
                <Text
                  key={index}
                  style={errorLine === index + 1 ? styles.errorLine : undefined}>
                  {renderLine(line)}
                  {'\n'}
                </Text>
              ))}
            </Text>
          </ScrollView>
          <TextInput
            accessibilityLabel="Editor skrip"
            autoCapitalize="none"
            autoCorrect={false}
            editable={editable}
            maxLength={1000}
            multiline
            onChangeText={handleChange}
            onScroll={syncScroll}
            selectionColor="#1769aa"
            spellCheck={false}
            style={styles.input}
            textAlignVertical="top"
            value={value}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.counter}>LOC {countLoc(value)}</Text>
        <Text style={styles.counter}>
          {value.length}/1000 karakter · {lines.length}/50 baris
        </Text>
      </View>
      {limitReached && <Text style={styles.limitMessage}>Batas editor adalah 50 baris.</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 140,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e1dc',
    overflow: 'hidden',
  },
  editorRow: {
    flex: 1,
    flexDirection: 'row',
  },
  lineNumberScroll: {
    width: 42,
    backgroundColor: '#f4f7f5',
    borderRightWidth: 1,
    borderRightColor: '#e1e7e3',
  },
  lineNumbers: {
    paddingTop: 12,
    paddingRight: 9,
    paddingBottom: 12,
    color: '#87938c',
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'right',
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  highlightText: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 23,
  },
  errorLine: {
    backgroundColor: '#fee2e2',
  },
  input: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    color: 'transparent',
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 23,
    backgroundColor: 'transparent',
  },
  footer: {
    minHeight: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#e1e7e3',
  },
  counter: {
    color: '#59665f',
    fontSize: 11,
  },
  limitMessage: {
    paddingHorizontal: 10,
    paddingBottom: 6,
    color: '#b42318',
    fontSize: 12,
  },
});
