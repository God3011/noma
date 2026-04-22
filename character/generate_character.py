"""
NOMA Character Generator — Blender Python Script
=================================================
Run this inside Blender:  Scripting tab → Open → Run Script
Output: character/noma_character.glb  (shape keys included)

Shape keys driven by health score (0–100):
  "Slim"      → score 80–100  (fit, toned)
  "Normal"    → score 50–79   (average)
  "Overweight"→ score 0–49    (bloated belly, puffy face)

Requirements: Blender 3.6+ (ships with its own Python — no pip needed)
"""

import bpy
import bmesh
import math
import os

# ── helpers ─────────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)

def new_material(name, base_color, roughness=0.5, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat

def assign_material(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

# ── skin / cloth colours ─────────────────────────────────────────────────────
SKIN      = (0.83, 0.62, 0.49)   # warm medium skin
SKIN_DARK = (0.72, 0.50, 0.36)
HAIR      = (0.15, 0.08, 0.04)   # dark brown
SHIRT     = (0.18, 0.22, 0.30)   # dark grey-blue (like the reference image)
JEANS     = (0.22, 0.32, 0.52)
SHOE      = (0.28, 0.18, 0.10)
EYE_W     = (0.95, 0.95, 0.95)
EYE_B     = (0.10, 0.25, 0.55)
TOOTH     = (0.92, 0.90, 0.85)

# ── build body part by part ──────────────────────────────────────────────────

def add_torso():
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16,
                                         radius=1, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "Torso"
    # squash into torso shape
    obj.scale = (0.55, 0.35, 0.75)
    bpy.ops.object.transform_apply(scale=True)
    # move to chest height
    obj.location = (0, 0, 1.15)
    assign_material(obj, new_material("Shirt", SHIRT, roughness=0.85))
    return obj

def add_belly():
    """Extra sphere that inflates for Overweight shape key."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12,
                                         radius=0.38, location=(0, 0.12, 0.95))
    obj = bpy.context.active_object
    obj.name = "Belly"
    obj.scale = (1.0, 0.7, 0.9)
    bpy.ops.object.transform_apply(scale=True)
    assign_material(obj, new_material("Shirt_Belly", SHIRT, roughness=0.85))
    return obj

def add_hips():
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16,
                                         radius=0.58, location=(0, 0, 0.72))
    obj = bpy.context.active_object
    obj.name = "Hips"
    obj.scale = (1.0, 0.65, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    assign_material(obj, new_material("Jeans_Hip", JEANS, roughness=0.9))
    return obj

def add_head():
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16,
                                         radius=0.42, location=(0, 0, 2.12))
    obj = bpy.context.active_object
    obj.name = "Head"
    obj.scale = (1.0, 0.88, 1.05)
    bpy.ops.object.transform_apply(scale=True)
    assign_material(obj, new_material("Skin_Head", SKIN, roughness=0.6))
    return obj

def add_neck():
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.14,
                                        depth=0.28, location=(0, 0, 1.78))
    obj = bpy.context.active_object
    obj.name = "Neck"
    assign_material(obj, new_material("Skin_Neck", SKIN, roughness=0.6))
    return obj

def add_eye(side):
    x = 0.16 * side
    # white
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8,
                                         radius=0.075, location=(x, -0.37, 2.16))
    white = bpy.context.active_object
    white.name = f"Eye_White_{'R' if side > 0 else 'L'}"
    white.scale = (1, 0.55, 0.75)
    bpy.ops.object.transform_apply(scale=True)
    assign_material(white, new_material("Eye_White", EYE_W, roughness=0.1))
    # iris
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8,
                                         radius=0.042, location=(x, -0.435, 2.16))
    iris = bpy.context.active_object
    iris.name = f"Iris_{'R' if side > 0 else 'L'}"
    iris.scale = (1, 0.3, 0.8)
    bpy.ops.object.transform_apply(scale=True)
    assign_material(iris, new_material("Eye_Iris", EYE_B, roughness=0.05, metallic=0.1))

def add_nose():
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8,
                                         radius=0.055, location=(0, -0.42, 2.06))
    obj = bpy.context.active_object
    obj.name = "Nose"
    obj.scale = (0.8, 0.6, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    assign_material(obj, new_material("Skin_Nose", SKIN_DARK, roughness=0.65))
    return obj

def add_ear(side):
    x = 0.42 * side
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8,
                                         radius=0.09, location=(x, -0.04, 2.10))
    obj = bpy.context.active_object
    obj.name = f"Ear_{'R' if side > 0 else 'L'}"
    obj.scale = (0.45, 0.3, 0.75)
    bpy.ops.object.transform_apply(scale=True)
    assign_material(obj, new_material("Skin_Ear", SKIN_DARK, roughness=0.65))

def add_hair():
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16,
                                         radius=0.44, location=(0, 0.02, 2.22))
    obj = bpy.context.active_object
    obj.name = "Hair"
    obj.scale = (1.0, 0.9, 0.65)
    bpy.ops.object.transform_apply(scale=True)
    # clip bottom half (keep only upper dome)
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(obj.data)
    verts_to_delete = [v for v in bm.verts if v.co.z < -0.05]
    bmesh.ops.delete(bm, geom=verts_to_delete, context='VERTS')
    bmesh.update_edit_mesh(obj.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    assign_material(obj, new_material("Hair", HAIR, roughness=0.9))
    return obj

def add_arm(side):
    """side: 1 = right, -1 = left"""
    x_offset = 0.72 * side
    # upper arm
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.105,
                                        depth=0.52, location=(x_offset, 0, 1.48))
    upper = bpy.context.active_object
    upper.name = f"UpperArm_{'R' if side > 0 else 'L'}"
    upper.rotation_euler = (0, 0.22 * side, 0)
    bpy.ops.object.transform_apply(rotation=True)
    assign_material(upper, new_material("Shirt_Arm", SHIRT, roughness=0.85))
    # forearm
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.09,
                                        depth=0.48, location=(x_offset * 1.05, 0, 1.03))
    lower = bpy.context.active_object
    lower.name = f"ForeArm_{'R' if side > 0 else 'L'}"
    assign_material(lower, new_material("Skin_Arm", SKIN, roughness=0.6))
    # hand
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8,
                                         radius=0.11, location=(x_offset * 1.07, 0, 0.74))
    hand = bpy.context.active_object
    hand.name = f"Hand_{'R' if side > 0 else 'L'}"
    hand.scale = (0.9, 0.55, 1.1)
    bpy.ops.object.transform_apply(scale=True)
    assign_material(hand, new_material("Skin_Hand", SKIN, roughness=0.6))

def add_leg(side):
    x_offset = 0.28 * side
    # thigh
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.155,
                                        depth=0.62, location=(x_offset, 0, 0.34))
    thigh = bpy.context.active_object
    thigh.name = f"Thigh_{'R' if side > 0 else 'L'}"
    assign_material(thigh, new_material("Jeans_Leg", JEANS, roughness=0.9))
    # shin
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.11,
                                        depth=0.58, location=(x_offset, 0, -0.28))
    shin = bpy.context.active_object
    shin.name = f"Shin_{'R' if side > 0 else 'L'}"
    assign_material(shin, new_material("Jeans_Shin", JEANS, roughness=0.9))
    # shoe
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8,
                                         radius=0.155, location=(x_offset, -0.06, -0.60))
    shoe = bpy.context.active_object
    shoe.name = f"Shoe_{'R' if side > 0 else 'L'}"
    shoe.scale = (0.9, 1.45, 0.55)
    bpy.ops.object.transform_apply(scale=True)
    assign_material(shoe, new_material("Shoe", SHOE, roughness=0.7))

# ── shape keys (morph targets) ────────────────────────────────────────────────

def add_belly_shape_keys(belly_obj):
    """
    Basis   = normal belly
    Slim    = belly shrunk
    Overweight = belly inflated
    """
    bpy.context.view_layer.objects.active = belly_obj
    bpy.ops.object.shape_key_add(from_mix=False)  # Basis
    belly_obj.data.shape_keys.key_blocks["Basis"].name = "Basis"

    # Slim key — scale belly down
    bpy.ops.object.shape_key_add(from_mix=False)
    slim_key = belly_obj.data.shape_keys.key_blocks[-1]
    slim_key.name = "Slim"
    slim_key.value = 0.0
    bpy.context.object.active_shape_key_index = belly_obj.data.shape_keys.key_blocks.keys().index("Slim")
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.transform.resize(value=(0.4, 0.4, 0.4))
    bpy.ops.object.mode_set(mode='OBJECT')

    # Overweight key — scale belly up
    bpy.ops.object.shape_key_add(from_mix=False)
    fat_key = belly_obj.data.shape_keys.key_blocks[-1]
    fat_key.name = "Overweight"
    fat_key.value = 0.0
    bpy.context.object.active_shape_key_index = belly_obj.data.shape_keys.key_blocks.keys().index("Overweight")
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.transform.resize(value=(1.9, 1.7, 1.6))
    bpy.ops.object.mode_set(mode='OBJECT')

def add_face_shape_keys(head_obj):
    """Puff the face for Overweight, thin for Slim."""
    bpy.context.view_layer.objects.active = head_obj
    bpy.ops.object.shape_key_add(from_mix=False)

    bpy.ops.object.shape_key_add(from_mix=False)
    slim_key = head_obj.data.shape_keys.key_blocks[-1]
    slim_key.name = "Slim"

    bpy.ops.object.shape_key_add(from_mix=False)
    fat_key = head_obj.data.shape_keys.key_blocks[-1]
    fat_key.name = "Overweight"
    fat_key.value = 0.0
    bpy.context.object.active_shape_key_index = head_obj.data.shape_keys.key_blocks.keys().index("Overweight")
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.transform.resize(value=(1.18, 1.12, 1.08))
    bpy.ops.object.mode_set(mode='OBJECT')

# ── assemble ──────────────────────────────────────────────────────────────────

def build_character():
    clear_scene()

    torso  = add_torso()
    belly  = add_belly()
    hips   = add_hips()
    head   = add_head()
    neck   = add_neck()
    hair   = add_hair()

    add_eye(1); add_eye(-1)
    add_nose()
    add_ear(1); add_ear(-1)
    add_arm(1); add_arm(-1)
    add_leg(1); add_leg(-1)

    add_belly_shape_keys(belly)
    add_face_shape_keys(head)

    print("✅  Character mesh built.")

    # ── join all parts into one object ──
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = torso
    bpy.ops.object.join()
    bpy.context.active_object.name = "NomaCharacter"
    print("✅  All parts joined → NomaCharacter")

    # ── smooth shading ──
    bpy.ops.object.shade_smooth()

    # ── export ──
    out_dir = os.path.join(os.path.dirname(bpy.data.filepath), "character") \
              if bpy.data.filepath else os.path.expanduser("~/Desktop/NOMA/character")
    os.makedirs(out_dir, exist_ok=True)
    glb_path = os.path.join(out_dir, "noma_character.glb")

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_morph=True,          # include shape keys
        export_morph_normal=True,
        export_animations=False,
        use_selection=False,
    )
    print(f"✅  Exported → {glb_path}")

build_character()
