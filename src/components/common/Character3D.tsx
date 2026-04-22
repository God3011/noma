import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { theme } from '../../constants/theme';
import { BodyState } from '../../utils/bodyState';

const { width: SCREEN_W } = Dimensions.get('window');
const AVATAR_H = Dimensions.get('window').height * 0.34;

const STEPS = [
  'Initializing avatar...',
  'Loading body mesh...',
  'Applying textures...',
  'Finalizing character...',
  'Almost ready...',
];

interface Props {
  bodyState?: BodyState;
}

export function Character3D({ bodyState = { fatLevel: 0.2, muscleLevel: 0.1 } }: Props) {
  const [modelB64, setModelB64] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState(STEPS[0]);
  const [loaded, setLoaded] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const webViewRef = useRef<WebView>(null);

  const animateTo = (val: number, duration = 600) => {
    Animated.timing(progressAnim, { toValue: val, duration, useNativeDriver: false }).start();
    setProgress(val);
  };

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < STEPS.length) {
        setStepLabel(STEPS[step]);
        animateTo((step / STEPS.length) * 75);
      }
    }, 600);

    (async () => {
      try {
        const asset = Asset.fromModule(require('../../../avatar/avatar_final.glb'));
        await asset.downloadAsync();
        const b64 = await FileSystem.readAsStringAsync(asset.localUri!, {
          encoding: 'base64' as any,
        });
        clearInterval(interval);
        setStepLabel('Rendering character...');
        animateTo(90, 300);
        setModelB64(b64);
      } catch (e) {
        clearInterval(interval);
        console.warn('Character3D load error:', e);
      }
    })();

    return () => clearInterval(interval);
  }, []);

  // Send updated body state to WebView whenever it changes
  useEffect(() => {
    if (loaded && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `applyBodyState(${bodyState.fatLevel}, ${bodyState.muscleLevel}); true;`
      );
    }
  }, [bodyState, loaded]);

  const lastX = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderGrant: (_, gs) => { lastX.current = gs.x0; },
      onPanResponderMove: (_, gs) => {
        const delta = gs.moveX - lastX.current;
        lastX.current = gs.moveX;
        webViewRef.current?.injectJavaScript(`rotateDelta(${delta}); true;`);
      },
      onPanResponderRelease: () => {
        webViewRef.current?.injectJavaScript(`releaseRotate(); true;`);
      },
    })
  ).current;

  const onWebViewMessage = (e: any) => {
    if (e.nativeEvent.data === 'MODEL_READY') {
      animateTo(100, 400);
      setStepLabel('Avatar ready!');
      setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true })
          .start(() => setLoaded(true));
      }, 400);
    }
  };

  const html = modelB64 ? `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>* { margin:0; padding:0; touch-action:none; } body { background:#131313; overflow:hidden; }</style>
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/loaders/DRACOLoader.js"></script>
<script>
var W = window.innerWidth, H = window.innerHeight;
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x131313, 1);
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x131313);

var camera = new THREE.PerspectiveCamera(80, W / H, 0.1, 1000);
camera.position.set(0, -0.1, 0.65);
camera.lookAt(0, -0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 1.8));
var dir = new THREE.DirectionalLight(0xffffff, 2);
dir.position.set(2, 4, 3);
scene.add(dir);
var dir2 = new THREE.DirectionalLight(0xffffff, 0.8);
dir2.position.set(-2, 2, -2);
scene.add(dir2);

var model = null;
var rotationY = 0;
var velocity = 0;
var dragging = false;
var AUTO_SPEED = 0.004;

// Current and target body shape values (lerped smoothly)
var currentFat = 0.2, targetFat = 0.2;
var currentMuscle = 0.1, targetMuscle = 0.1;

function rotateDelta(dx) {
  dragging = true;
  velocity = dx * 0.012;
  rotationY += velocity;
}
function releaseRotate() { dragging = false; }

// Called from React Native when user data changes
function applyBodyState(fat, muscle) {
  targetFat = Math.max(0, Math.min(1, fat));
  targetMuscle = Math.max(0, Math.min(1, muscle));
}

// Apply body deformation to the model
function deformBody(fat, muscle) {
  if (!model) return;

  // Combined effects on body shape:
  // fat:    wider torso (X/Z), slightly shorter (Y), bigger belly
  // muscle: broader shoulders, narrower waist, taller posture

  var scaleX = 1 + fat * 0.35 - muscle * 0.05;   // fat → wider, muscle → slightly less
  var scaleY = 1 - fat * 0.06 + muscle * 0.04;    // fat → shorter, muscle → taller
  var scaleZ = 1 + fat * 0.30 - muscle * 0.05;    // fat → deeper body

  model.scale.set(scaleX, scaleY, scaleZ);

  // Try bone-level deformation if skeleton exists
  model.traverse(function(child) {
    if (!child.isBone) return;
    var name = child.name.toLowerCase();

    // Spine / torso — expand with fat
    if (name.includes('spine') || name.includes('chest') || name.includes('torso')) {
      child.scale.set(
        1 + fat * 0.25 - muscle * 0.05,
        1,
        1 + fat * 0.20
      );
    }
    // Hips / pelvis — fat widens them
    if (name.includes('hip') || name.includes('pelvis')) {
      child.scale.set(1 + fat * 0.30, 1 + fat * 0.15, 1 + fat * 0.25);
    }
    // Arms — muscle makes them bigger
    if (name.includes('arm') || name.includes('upper') || name.includes('bicep')) {
      child.scale.set(1 + muscle * 0.20 + fat * 0.10, 1, 1 + muscle * 0.20 + fat * 0.10);
    }
    // Shoulders — muscle broadens them
    if (name.includes('shoulder') || name.includes('clavicle')) {
      child.scale.set(1 + muscle * 0.15, 1, 1);
    }
    // Legs — fat thickens them
    if (name.includes('leg') || name.includes('thigh') || name.includes('calf')) {
      child.scale.set(1 + fat * 0.20 + muscle * 0.10, 1, 1 + fat * 0.20 + muscle * 0.10);
    }
  });
}

var dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/libs/draco/');
dracoLoader.preload();

var loader = new THREE.GLTFLoader();
loader.setDRACOLoader(dracoLoader);

var b64 = '${modelB64}';
var binary = atob(b64);
var bytes = new Uint8Array(binary.length);
for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

loader.parse(bytes.buffer, '', function(gltf) {
  model = gltf.scene;
  var box = new THREE.Box3().setFromObject(model);
  var center = box.getCenter(new THREE.Vector3());
  var size = box.getSize(new THREE.Vector3());

  model.position.sub(center);
  var maxDim = Math.max(size.x, size.y, size.z);
  model.scale.setScalar(10.2 / maxDim);
  model.position.y -= size.y * 0.05;

  // Remove all lines and wireframes
  var toRemove = [];
  model.traverse(function(child) {
    if (child.isLine || child.isLineSegments || child.isLineLoop ||
        child.type === 'Line' || child.type === 'LineSegments' || child.type === 'LineLoop') {
      toRemove.push(child);
    }
    if (child.isMesh) {
      var mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(function(m) { m.wireframe = false; });
    }
  });
  toRemove.forEach(function(c) { if (c.parent) c.parent.remove(c); });

  scene.add(model);

  // Apply initial body state
  deformBody(${bodyState.fatLevel}, ${bodyState.muscleLevel});
  currentFat = ${bodyState.fatLevel};
  currentMuscle = ${bodyState.muscleLevel};
  targetFat = ${bodyState.fatLevel};
  targetMuscle = ${bodyState.muscleLevel};

  window.ReactNativeWebView && window.ReactNativeWebView.postMessage('MODEL_READY');
}, function(err) {
  window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ERR: ' + err.message);
});

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    // Smooth rotation
    if (!dragging) {
      velocity *= 0.92;
      rotationY += Math.abs(velocity) < 0.0005 ? AUTO_SPEED : velocity;
    }
    model.rotation.y = rotationY;

    // Smooth body shape lerp (gradual changes feel natural)
    var lerpSpeed = 0.02;
    var newFat = currentFat + (targetFat - currentFat) * lerpSpeed;
    var newMuscle = currentMuscle + (targetMuscle - currentMuscle) * lerpSpeed;

    if (Math.abs(newFat - currentFat) > 0.0001 || Math.abs(newMuscle - currentMuscle) > 0.0001) {
      currentFat = newFat;
      currentMuscle = newMuscle;
      deformBody(currentFat, currentMuscle);
    }
  }

  renderer.render(scene, camera);
}
animate();
</script>
</body>
</html>` : '';

  const barWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      {modelB64 && (
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
          <WebView
            ref={webViewRef}
            source={{ html }}
            style={[StyleSheet.absoluteFill, { backgroundColor: '#131313' }]}
            scrollEnabled={false}
            javaScriptEnabled
            originWhitelist={['*']}
            onMessage={onWebViewMessage}
          />
        </View>
      )}

      {!loaded && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Creating Your Avatar</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: barWidth }]} />
          </View>
          <Text style={styles.percent}>{Math.round(progress)}%</Text>
          <Text style={styles.label}>{stepLabel}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: AVATAR_H,
    alignSelf: 'center',
    marginHorizontal: -20,
    marginVertical: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary, letterSpacing: 0.3 },
  progressTrack: {
    width: '60%', height: 6,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  percent: { fontSize: 28, fontWeight: '800', color: theme.colors.primary },
  label: { fontSize: 13, color: theme.colors.textMuted, fontWeight: '500' },
});
