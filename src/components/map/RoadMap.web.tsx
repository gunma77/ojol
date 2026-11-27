import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import bandungRoadData from '@/data/maps/bandung-roads.json';
import type { LevelData } from '@/engine/compiler/types';

interface RoadMapProps {
  level: LevelData;
  coordinate: [number, number];
  bearing: number;
  movementPath: [number, number][] | null;
  runSequence: number;
}

interface StreetFeature {
  properties: { highway?: string; name?: string };
  geometry: { coordinates: number[][] };
}

const streets: StreetFeature[] = bandungRoadData.features;
const svgWidth = 1000;
const svgHeight = 600;
const metersPerDegree = 111320;

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

function toPath(coordinates: [number, number][], project: (point: [number, number]) => [number, number]) {
  return coordinates
    .map((coordinate, index) => {
      const [x, y] = project(coordinate);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function toCoordinate(position: number[]): [number, number] | null {
  const [longitude, latitude] = position;
  return Number.isFinite(longitude) && Number.isFinite(latitude)
    ? [longitude, latitude]
    : null;
}

function createMapSvg(
  level: LevelData,
  coordinate: [number, number],
  bearing: number,
  project: (point: [number, number]) => [number, number],
) {
  const routeEdges = level.edges.map((edge) => ({
    name: edge.name,
    coordinates: edge.geometry ?? [level.nodes[edge.from], level.nodes[edge.to]],
  }));
  const routeCoordinates = routeEdges.flatMap((edge) => edge.coordinates);
  const [motorX, motorY] = project(coordinate);
  const roadLines = streets.flatMap((street) => {
    const coordinates = street.geometry.coordinates
      .map(toCoordinate)
      .filter((point): point is [number, number] => point !== null);
    if (coordinates.length < 2) {
      return [];
    }
    const points = coordinates.map(project);
    const minX = Math.min(...points.map(([x]) => x));
    const maxX = Math.max(...points.map(([x]) => x));
    const minY = Math.min(...points.map(([, y]) => y));
    const maxY = Math.max(...points.map(([, y]) => y));
    if (maxX < 0 || minX > svgWidth || maxY < 0 || minY > svgHeight) {
      return [];
    }
    const width = street.properties.highway === 'primary' || street.properties.highway === 'secondary'
      ? 3.5
      : 2;
    return [
      `<path d="${toPath(coordinates, project)}" fill="none" stroke="#b8c4c2" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`,
    ];
  });
  const routeLines = routeEdges.map(
    (edge) =>
      `<path d="${toPath(edge.coordinates, project)}" fill="none" stroke="#177245" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  );
  const roadNames = new Set<string>();
  const roadLabels = routeEdges.flatMap((edge) => {
    if (!edge.name || roadNames.has(edge.name)) {
      return [];
    }
    roadNames.add(edge.name);
    const [x, y] = project(edge.coordinates[Math.floor(edge.coordinates.length / 2)]);
    return [
      `<text x="${x}" y="${y - 10}" text-anchor="middle" fill="#435148" font-family="sans-serif" font-size="16" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="5">${escapeXml(edge.name)}</text>`,
    ];
  });
  const placeMarkers = Object.entries(level.nodes).map(([nodeId, position]) => {
    const [x, y] = project(position);
    const isStart = nodeId === level.start.node;
    const isGoal = nodeId === level.goal;
    const label = isStart ? level.start_label : isGoal ? level.goal_label : nodeId;
    const color = isGoal ? '#177245' : isStart ? '#f97316' : '#ffffff';
    const textColor = '#26332d';
    return `<circle cx="${x}" cy="${y}" r="8" fill="${color}" stroke="#fff" stroke-width="3"/><text x="${x}" y="${y - 15}" text-anchor="middle" fill="${textColor}" font-family="sans-serif" font-size="14" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="5">${escapeXml(label)}</text>`;
  });
  const routeBounds = routeCoordinates.map(project);
  const visibleRoute = routeBounds.some(([x, y]) => x >= 0 && x <= svgWidth && y >= 0 && y <= svgHeight);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}"><rect width="100%" height="100%" fill="#f3f5f2"/>${roadLines.join('')}${routeLines.join('')}${roadLabels.join('')}${placeMarkers.join('')}${visibleRoute ? `<circle cx="${motorX}" cy="${motorY}" r="12" fill="#f97316" stroke="#fff" stroke-width="4"/><path d="M${motorX} ${motorY - 7} L${motorX + 5} ${motorY + 5} L${motorX - 5} ${motorY + 5} Z" fill="#fff" transform="rotate(${bearing} ${motorX} ${motorY})"/>` : ''}</svg>`;
}

export function RoadMap({ level, coordinate, bearing }: RoadMapProps) {
  const mapImage = useMemo(() => {
    const routeCoordinates = level.edges.flatMap((edge) =>
      edge.geometry ?? [level.nodes[edge.from], level.nodes[edge.to]],
    );
    const centerLongitude =
      (Math.min(...routeCoordinates.map(([longitude]) => longitude)) +
        Math.max(...routeCoordinates.map(([longitude]) => longitude))) /
      2;
    const centerLatitude =
      (Math.min(...routeCoordinates.map(([, latitude]) => latitude)) +
        Math.max(...routeCoordinates.map(([, latitude]) => latitude))) /
      2;
    const longitudeScale = Math.cos((centerLatitude * Math.PI) / 180);
    const xMeters = routeCoordinates.map(
      ([longitude]) => (longitude - centerLongitude) * metersPerDegree * longitudeScale,
    );
    const yMeters = routeCoordinates.map(
      ([, latitude]) => (latitude - centerLatitude) * metersPerDegree,
    );
    const spanX = Math.max(...xMeters) - Math.min(...xMeters);
    const spanY = Math.max(...yMeters) - Math.min(...yMeters);
    const paddingX = Math.max(spanX * 0.3, 80);
    const paddingY = Math.max(spanY * 0.3, 80);
    const scale = Math.min(
      (svgWidth - 80) / (spanX + paddingX * 2),
      (svgHeight - 80) / (spanY + paddingY * 2),
    );
    const project = ([longitude, latitude]: [number, number]): [number, number] => [
      svgWidth / 2 + (longitude - centerLongitude) * metersPerDegree * longitudeScale * scale,
      svgHeight / 2 - (latitude - centerLatitude) * metersPerDegree * scale,
    ];
    const svg = createMapSvg(level, coordinate, bearing, project);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [bearing, coordinate, level]);
  const currentNode =
    Object.keys(level.nodes).find((node) => level.nodes[node] === coordinate) ?? 'rute';

  return (
    <View style={styles.container}>
      <Image
        accessibilityLabel={`Peta jalan OpenStreetMap untuk ${level.title}`}
        resizeMode="stretch"
        source={{ uri: mapImage }}
        style={styles.map}
      />
      <View style={styles.status}>
        <Text style={styles.mission}>{level.mission}</Text>
        <Text style={styles.position}>Motor di titik {currentNode} · arah {bearing}°</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f5f2',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  status: {
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mission: {
    color: '#435148',
    fontSize: 11,
    fontWeight: '700',
  },
  position: {
    color: '#26332d',
    fontSize: 11,
  },
});
