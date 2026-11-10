import { StyleSheet, Text, View } from 'react-native';

import type { LevelData } from '@/engine/compiler/types';

interface RoadMapProps {
  level: LevelData;
  coordinate: [number, number];
  bearing: number;
  runSequence: number;
}

export function RoadMap({ level, coordinate, bearing }: RoadMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Peta rute · {level.title}</Text>
      <Text style={styles.route}>
        {level.start.node} → {level.goal}
      </Text>
      <Text style={styles.position}>
        Motor di {Object.keys(level.nodes).find((node) => level.nodes[node] === coordinate) ?? 'rute'}
        {' · arah '}
        {bearing}°
      </Text>
      <Text style={styles.note}>Pratinjau peta native tersedia pada development build Android.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#edf2ee',
    padding: 20,
  },
  title: {
    color: '#26332d',
    fontSize: 17,
    fontWeight: '700',
  },
  route: {
    color: '#38634d',
    fontSize: 30,
    fontWeight: '700',
  },
  position: {
    color: '#26332d',
    fontSize: 14,
  },
  note: {
    color: '#59665f',
    fontSize: 12,
    textAlign: 'center',
  },
});
