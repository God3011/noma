import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ActivityIndicator } from 'react-native';

interface Props {
  loading: boolean;
  statusText: string;
}

const FRAME_SIZE = 260;
const CORNER = 28;
const CORNER_THICKNESS = 3;
const ACCENT = '#00E5A0';

export default function ScanFrame({ loading, statusText }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const loop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!loading) {
      loop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ])
      );
      loop.current.start();
    } else {
      loop.current?.stop();
    }
    return () => loop.current?.stop();
  }, [loading]);

  const scanLineY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_SIZE - 2],
  });

  return (
    <View style={styles.overlay}>
      {/* dim overlay with hole — just the dim surrounds */}
      <View style={styles.frameContainer}>
        {/* Corner brackets */}
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />

        {loading ? (
          <ActivityIndicator size="large" color={ACCENT} />
        ) : (
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
          />
        )}
      </View>

      <View style={styles.statusWrap}>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameContainer: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: ACCENT,
  },
  tl: {
    top: 0, left: 0,
    borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderRadius: 2,
  },
  tr: {
    top: 0, right: 0,
    borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderRadius: 2,
  },
  bl: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderRadius: 2,
  },
  br: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderRadius: 2,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: ACCENT,
    opacity: 0.85,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  statusWrap: {
    marginTop: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 99,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
