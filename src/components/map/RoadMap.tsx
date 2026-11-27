import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';
import type { FeatureCollection, LineString, Point } from 'geojson';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useAnimatedProps,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import bandungRoadData from '@/data/maps/bandung-roads.json';
import type { LevelData } from '@/engine/compiler/types';

interface RoadMapProps {
  level: LevelData;
  coordinate: [number, number];
  bearing: number;
  movementPath: [number, number][] | null;
  runSequence: number;
}

const bandungRoads = bandungRoadData as FeatureCollection<LineString>;

const offlineStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'plain-background',
      type: 'background',
      paint: { 'background-color': '#f3f5f2' },
    },
  ],
};

const AnimatedMarker = Animated.createAnimatedComponent(Marker);

function AnimatedMotorMarker({
  coordinate,
  bearing,
  movementPath,
}: Pick<RoadMapProps, 'coordinate' | 'bearing' | 'movementPath'>) {
  const [initialCoordinate] = useState(coordinate);
  const animatedBearing = useSharedValue(bearing);
  const animatedLongitude = useSharedValue(coordinate[0]);
  const animatedLatitude = useSharedValue(coordinate[1]);
  const motorStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animatedBearing.value}deg` }],
  }));
  const markerProps = useAnimatedProps(() => ({
    lngLat: [animatedLongitude.value, animatedLatitude.value] as [number, number],
  }));

  useEffect(() => {
    let targetBearing = bearing;
    while (targetBearing - animatedBearing.value > 180) {
      targetBearing -= 360;
    }
    while (targetBearing - animatedBearing.value < -180) {
      targetBearing += 360;
    }
    animatedBearing.value = withTiming(targetBearing, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });

    const points =
      movementPath && movementPath.length > 1 ? movementPath.slice(1) : [coordinate];
    const segmentDuration = 520 / points.length;
    // Reanimated shared values animate the native MapLibre marker along OSM vertices.
    // eslint-disable-next-line react-hooks/immutability
    animatedLongitude.value = withSequence(
      ...points.map(([longitude]) =>
        withTiming(longitude, {
          duration: segmentDuration,
          easing: Easing.inOut(Easing.cubic),
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/immutability
    animatedLatitude.value = withSequence(
      ...points.map(([, latitude]) =>
        withTiming(latitude, {
          duration: segmentDuration,
          easing: Easing.inOut(Easing.cubic),
        }),
      ),
    );
  }, [animatedBearing, animatedLatitude, animatedLongitude, bearing, coordinate, movementPath]);

  return (
    <AnimatedMarker
      animatedProps={markerProps}
      lngLat={initialCoordinate}
      anchor="center">
      <Animated.View style={[styles.motor, motorStyle]}>
        <Text style={styles.motorIcon}>▲</Text>
      </Animated.View>
    </AnimatedMarker>
  );
}

function getCameraView(level: LevelData) {
  const coordinates = Object.values(level.nodes);
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const span = Math.max(maxLongitude - minLongitude, maxLatitude - minLatitude, 0.001);

  return {
    center: [(minLongitude + maxLongitude) / 2, (minLatitude + maxLatitude) / 2] as [
      number,
      number,
    ],
    zoom: Math.max(13, Math.min(17, 15 - Math.log2(span / 0.0035))),
  };
}

export function RoadMap({
  level,
  coordinate,
  bearing,
  movementPath,
  runSequence,
}: RoadMapProps) {
  const routeRoads = useMemo<FeatureCollection<LineString>>(
    () => ({
      type: 'FeatureCollection',
      features: level.edges.map((edge) => ({
        type: 'Feature',
        properties: { name: edge.name ?? '' },
        geometry: {
          type: 'LineString',
          coordinates: edge.geometry ?? [level.nodes[edge.from], level.nodes[edge.to]],
        },
      })),
    }),
    [level],
  );
  const intersections = useMemo<FeatureCollection<Point>>(
    () => ({
      type: 'FeatureCollection',
      features: Object.entries(level.nodes).map(([nodeId, position]) => ({
        type: 'Feature',
        properties: { nodeId },
        geometry: { type: 'Point', coordinates: position },
      })),
    }),
    [level],
  );
  const roadLabels = useMemo(() => {
    const seen = new Set<string>();
    return level.edges.flatMap((edge) => {
      if (!edge.name || seen.has(edge.name)) {
        return [];
      }
      seen.add(edge.name);
      const coordinates = edge.geometry ?? [level.nodes[edge.from], level.nodes[edge.to]];
      return [{ name: edge.name, coordinate: coordinates[Math.floor(coordinates.length / 2)] }];
    });
  }, [level]);
  const camera = useMemo(() => getCameraView(level), [level]);

  return (
    <Map
      style={styles.map}
      mapStyle={offlineStyle}
      logo={false}
      attribution={false}
      compass={false}
      dragPan={false}
      touchZoom={false}
      touchRotate={false}>
      <Camera initialViewState={camera} />
      <GeoJSONSource id="bandung-streets" data={bandungRoads}>
        <Layer
          id="bandung-street-lines"
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': '#bac5c3', 'line-width': 2.5, 'line-opacity': 0.9 }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="level-roads" data={routeRoads}>
        <Layer
          id="route-lines"
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': '#177245', 'line-width': 5, 'line-opacity': 0.95 }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="level-intersections" data={intersections}>
        <Layer
          id="intersection-points"
          type="circle"
          paint={{
            'circle-color': '#ffffff',
            'circle-stroke-color': '#38634d',
            'circle-stroke-width': 2,
            'circle-radius': 5,
          }}
        />
      </GeoJSONSource>
      {roadLabels.map(({ name, coordinate: labelCoordinate }) => (
        <Marker key={name} lngLat={labelCoordinate} anchor="center">
          <View style={styles.roadLabel}>
            <Text style={styles.roadLabelText}>{name}</Text>
          </View>
        </Marker>
      ))}
      <Marker lngLat={level.nodes[level.start.node]} anchor="bottom">
        <View style={styles.placeLabel}>
          <Text style={styles.placeLabelText}>{level.start_label}</Text>
        </View>
      </Marker>
      <Marker lngLat={level.nodes[level.goal]} anchor="bottom">
        <View style={[styles.placeLabel, styles.goalLabel]}>
          <Text style={styles.placeLabelText}>{level.goal_label}</Text>
        </View>
      </Marker>
      <AnimatedMotorMarker
        key={runSequence}
        coordinate={coordinate}
        bearing={bearing}
        movementPath={movementPath}
      />
    </Map>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  motor: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  motorIcon: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  roadLabel: {
    maxWidth: 150,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: '#ffffffdd',
  },
  roadLabelText: {
    color: '#53625b',
    fontSize: 9,
    fontWeight: '700',
  },
  placeLabel: {
    maxWidth: 160,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderColor: '#38634d',
    borderWidth: 1,
  },
  goalLabel: {
    backgroundColor: '#e2eee6',
  },
  placeLabelText: {
    color: '#1e2b24',
    fontSize: 10,
    fontWeight: '800',
  },
});
