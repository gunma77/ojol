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
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { LevelData } from '@/engine/compiler/types';

interface RoadMapProps {
  level: LevelData;
  coordinate: [number, number];
  bearing: number;
  runSequence: number;
}

const offlineStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'plain-background',
      type: 'background',
      paint: { 'background-color': '#edf2ee' },
    },
  ],
};

const AnimatedMarker = Animated.createAnimatedComponent(Marker);

function AnimatedMotorMarker({
  coordinate,
  bearing,
}: Pick<RoadMapProps, 'coordinate' | 'bearing'>) {
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
    // Reanimated shared values drive coordinate updates on MapLibre's native marker.
    // eslint-disable-next-line react-hooks/immutability
    animatedLongitude.value = withTiming(coordinate[0], {
      duration: 520,
      easing: Easing.inOut(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/immutability
    animatedLatitude.value = withTiming(coordinate[1], {
      duration: 520,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [animatedBearing, animatedLatitude, animatedLongitude, bearing, coordinate]);

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

export function RoadMap({ level, coordinate, bearing, runSequence }: RoadMapProps) {

  const roads = useMemo<FeatureCollection<LineString>>(
    () => ({
      type: 'FeatureCollection',
      features: level.edges.map((edge) => ({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [level.nodes[edge.from], level.nodes[edge.to]],
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
      <Camera
        initialViewState={{
          center: level.nodes[level.start.node],
          zoom: 15,
        }}
      />
      <GeoJSONSource id="level-roads" data={roads}>
        <Layer
          id="road-lines"
          type="line"
          paint={{ 'line-color': '#80908b', 'line-width': 5, 'line-opacity': 0.82 }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="level-intersections" data={intersections}>
        <Layer
          id="intersection-points"
          type="circle"
          paint={{
            'circle-color': '#ffffff',
            'circle-stroke-color': '#56655f',
            'circle-stroke-width': 2,
            'circle-radius': 5,
          }}
        />
      </GeoJSONSource>
      <AnimatedMotorMarker key={runSequence} coordinate={coordinate} bearing={bearing} />
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
});
