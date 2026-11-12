# Render di verifica con Blender (Cycles, senza interfaccia): materiali originali e, a parte, solo geometria (argilla).
# Uso: python -I render.py <model.glb|.blend> <cartella uscita> [nomi viste separati da virgola] [campioni]
import bpy, sys, math, os
from mathutils import Vector
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[-4:]
src, out = args[0], args[1]; solo = args[2].split(',') if len(args) > 2 and args[2] else None; campioni = int(args[3]) if len(args) > 3 else 40
bpy.ops.wm.read_factory_settings(use_empty=True)
if src.endswith('.blend'): bpy.ops.wm.open_mainfile(filepath=src)
else: bpy.ops.import_scene.gltf(filepath=src)
sc = bpy.context.scene
for o in list(bpy.data.objects):
    if o.type in ('CAMERA', 'LIGHT'): bpy.data.objects.remove(o)
maglie = [o for o in bpy.data.objects if o.type == 'MESH']
dg = bpy.context.evaluated_depsgraph_get()
pts = [o.matrix_world @ v.co for o in maglie for v in o.evaluated_get(dg).data.vertices] if src.endswith('.blend') else [o.matrix_world @ Vector(c) for o in maglie for c in o.bound_box]
mn = Vector([min(p[k] for p in pts) for k in range(3)]); mx = Vector([max(p[k] for p in pts) for k in range(3)]); c = (mn + mx) / 2; H = mx.z - mn.z
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = campioni; sc.cycles.use_denoising = True
try: sc.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception: sc.cycles.use_denoising = False
sc.render.film_transparent = False; sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.82, 0.86, 0.92, 1); bg.inputs[1].default_value = 0.75
def luce(nome, pos, forza, lato):
    d = bpy.data.lights.new(nome, 'AREA'); d.energy = forza; d.size = lato; o = bpy.data.objects.new(nome, d); sc.collection.objects.link(o); o.location = pos
    o.rotation_euler = (c - Vector(pos)).to_track_quat('-Z', 'Y').to_euler(); return o
luce('chiave', (c.x - 1.6 * H, c.y - 2.2 * H, c.z + 1.4 * H), 95 * H * H, 2.0 * H)
luce('riemp', (c.x + 2.0 * H, c.y - 1.6 * H, c.z + 0.4 * H), 40 * H * H, 2.5 * H)
luce('dietro', (c.x + 0.5 * H, c.y + 2.4 * H, c.z + 1.2 * H), 70 * H * H, 2.0 * H)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 85; cam.data.clip_start = 0.01; cam.data.clip_end = 100
def scatta(nome, direzione, centro, altezza, rx, ry):
    if solo and nome not in solo: return
    sc.render.resolution_x = rx; sc.render.resolution_y = ry
    d = Vector(direzione).normalized(); fov = 2 * math.atan(cam.data.sensor_width / 2 / cam.data.lens) * (ry / rx if ry < rx else 1)
    fovv = 2 * math.atan(math.tan(2 * math.atan(cam.data.sensor_width / 2 / cam.data.lens) / 2) * (ry / rx)) if rx >= ry else 2 * math.atan(cam.data.sensor_width / 2 / cam.data.lens)
    dist = altezza / 2 / math.tan(fovv / 2) * 1.12
    cam.location = Vector(centro) + d * dist; cam.rotation_euler = (Vector(centro) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(out, nome + '.png'); bpy.ops.render.render(write_still=True); print('fatto', nome)
# il fronte del personaggio guarda verso -Y (convenzione di Blender dopo l'importazione di un glTF)
testaZ = mn.z + H * 0.885
W = max(mx.x - mn.x, mx.y - mn.y, H)
viste = [('p1-fronte', (0, -1, 0.05), c, W, 1100, 1100), ('p2-tre-quarti', (-0.75, -0.7, 0.15), c, W, 1100, 1100), ('p3-schiena', (0.3, 1, 0.1), c, W, 1100, 1100), ('p4-lato', (1, -0.2, 0.05), c, W, 1100, 1100)] + [('1-fronte', (0, -1, 0.04), c, H, 1100, 1300), ('2-profilo', (-1, 0, 0.04), c, H, 1100, 1300), ('3-schiena', (0, 1, 0.04), c, H, 1100, 1300), ('4-tre-quarti', (-0.7, -0.75, 0.12), c, H, 1100, 1300),
         ('5-volto', (-0.25, -1, 0.05), (c.x, c.y, testaZ), H * 0.26, 1200, 1200), ('6-volto-profilo', (-1, -0.05, 0.02), (c.x, c.y, testaZ), H * 0.26, 1000, 1000),
         ('7-mano-sinistra', (0, -0.15, 1), (mx.x - 0.075 * H, c.y, mn.z + H * 0.765), H * 0.2, 1000, 1000), ('7b-mano-da-davanti', (0.15, -1, 0.15), (mx.x - 0.075 * H, c.y, mn.z + H * 0.765), H * 0.2, 1000, 1000), ('7c-mano-da-sotto', (0, -0.2, -1), (mx.x - 0.075 * H, c.y, mn.z + H * 0.765), H * 0.2, 1000, 1000),
         ('8-piedi', (-0.3, -1, 0.6), (c.x, c.y, mn.z + 0.04 * H), H * 0.3, 1100, 800), ('9-busto', (0.2, -1, 0.05), (c.x, c.y, mn.z + H * 0.62), H * 0.45, 1200, 1100), ('9b-busto-schiena', (0.2, 1, 0.05), (c.x, c.y, mn.z + H * 0.62), H * 0.45, 1200, 1100)]
modo = os.environ.get('MODO', 'originale')
if modo == 'argilla':
    m = bpy.data.materials.new('argilla'); m.use_nodes = True; p = m.node_tree.nodes['Principled BSDF']; p.inputs['Base Color'].default_value = (0.36, 0.36, 0.36, 1); p.inputs['Roughness'].default_value = 0.7
    for o in maglie:
        o.data.materials.clear(); o.data.materials.append(m)
if modo == 'zone':
    m = bpy.data.materials.new('zone'); m.use_nodes = True; nt = m.node_tree; p = nt.nodes['Principled BSDF']; ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'zona' if any('zona' in [c.name for c in o.data.color_attributes] for o in maglie) else ''
    nt.links.new(ca.outputs['Color'], p.inputs['Base Color']); p.inputs['Roughness'].default_value = 0.8
    for o in maglie:
        if not ca.layer_name and o.data.color_attributes: ca.layer_name = o.data.color_attributes[0].name
        o.data.materials.clear(); o.data.materials.append(m)
if modo == 'fili':
    for o in maglie:
        md = o.modifiers.new('fili', 'WIREFRAME'); md.thickness = H * 0.0006; md.use_replace = False; md.material_offset = 1
        mw = bpy.data.materials.new('filo'); mw.use_nodes = True; mw.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.02, 0.02, 0.02, 1)
        m = bpy.data.materials.new('base'); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.75, 0.75, 0.75, 1)
        o.data.materials.clear(); o.data.materials.append(m); o.data.materials.append(mw)
for v in viste: scatta(*v)
