# NOMA Character — Setup Guide

## Step 1 — Generate the 3D model in Blender

1. Open **Blender 3.6+**
2. Go to the **Scripting** tab (top menu)
3. Click **Open** → select `character/generate_character.py`
4. Click **▶ Run Script**
5. The file `character/noma_character.glb` will be created automatically

> The script builds a realistic Pixar-style male character with:
> - Proper skin, shirt, jeans, shoes materials with PBR shaders
> - Shape keys: `Slim` (score 80–100) and `Overweight` (score 0–49)
> - All shape keys export into the GLB as morph targets

---

## Step 2 — Copy the GLB into the app

```bash
cp character/noma_character.glb app/assets/noma_character.glb
```

---

## Step 3 — Register the asset in app.json

Add to `app/app.json` → `expo.assetBundlePatterns`:
```json
"assetBundlePatterns": ["assets/**"]
```

---

## Step 4 — Add CharacterScreen to navigation

In your navigation setup (e.g. `App.tsx`), add:

```tsx
import CharacterScreen from './src/screens/CharacterScreen';

// Inside Stack.Navigator:
<Stack.Screen name="Character" component={CharacterScreen} />
```

Then navigate to it from any screen:
```tsx
navigation.navigate('Character');
```

---

## How morphing works

| Health Score | Character Shape         |
|-------------|-------------------------|
| 80 – 100    | Slim / toned body       |
| 50 – 79     | Normal / neutral        |
| 0  – 49     | Bloated / overweight    |

The score is calculated as the average of all scanned product scores.
Morphing is animated smoothly (lerp at 4% per frame).

---

## Files created

| File | Purpose |
|------|---------|
| `character/generate_character.py` | Blender script to build the 3D model |
| `app/src/components/Character3D.tsx` | React Native GL component |
| `app/src/screens/CharacterScreen.tsx` | Full screen with avatar + history |
