# PROVA di scheletro (provvisorio, non definitivo): ossatura umanoide messa sulle misure del modello, pesi automatici di Blender,
# una posa da pallanuoto (braccio di tiro alzato, gomito piegato, busto ruotato, gambe a bicicletta) per vedere come si deforma.
# Uso: python -I prova_scheletro.py <player_base_LOD1.glb> <uscita.blend>
import bpy, sys, math, json
from mathutils import Vector, Euler, Matrix
src, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
o = [x for x in bpy.data.objects if x.type == 'MESH'][0]
bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
import bmesh
bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5); bm.to_mesh(o.data); bm.free(); o.data.update()      # guscio unico: serve ai pesi automatici
V = [v.co.copy() for v in o.data.vertices]; H = max(v.z for v in V); mxx = max(v.x for v in V)
def centro(filtro):
    p = [v for v in V if filtro(v)]; return Vector((sum(v.x for v in p) / len(p), sum(v.y for v in p) / len(p), sum(v.z for v in p) / len(p)))
def gamba(s, q): return centro(lambda v: v.x * s > 0.01 and abs(v.z - q * H) < 0.012 * H)
def braccio(s, ax): return centro(lambda v: abs(v.x * s - ax) < 0.012 and v.z > 0.68 * H)
G = {}
G['bacino'] = centro(lambda v: abs(v.z - 0.53 * H) < 0.01 * H); G['schiena'] = centro(lambda v: abs(v.z - 0.60 * H) < 0.01 * H and abs(v.x) < 0.25); G['petto'] = centro(lambda v: abs(v.z - 0.70 * H) < 0.01 * H and abs(v.x) < 0.2)
G['collo'] = centro(lambda v: abs(v.z - 0.805 * H) < 0.008 * H and abs(v.x) < 0.09); G['testa'] = G['collo'] + Vector((0, 0, 0.045 * H)); G['cima'] = Vector((G['collo'].x, G['collo'].y, H))
for nome, s in (('S', 1), ('D', -1)):
    G['anca' + nome] = gamba(s, 0.47) + Vector((0, 0, 0.03 * H)); G['ginocchio' + nome] = gamba(s, 0.27); G['caviglia' + nome] = gamba(s, 0.05); G['punta' + nome] = G['caviglia' + nome] + Vector((0, -0.16, -0.06))
    G['spalla' + nome] = braccio(s, 0.24); G['clav' + nome] = Vector((s * 0.05, G['petto'].y, G['spalla' + nome].z)); G['gomito' + nome] = braccio(s, 0.50); G['polso' + nome] = braccio(s, 0.715); G['dita' + nome] = Vector((s * mxx * 0.985, G['polso' + nome].y, G['polso' + nome].z))
arm = bpy.data.armatures.new('Scheletro'); A = bpy.data.objects.new('Scheletro', arm); bpy.context.scene.collection.objects.link(A)
bpy.context.view_layer.objects.active = A; bpy.ops.object.mode_set(mode='EDIT')
def osso(nome, a, b, padre=None, unito=True):
    e = arm.edit_bones.new(nome); e.head = a; e.tail = b
    if padre: e.parent = arm.edit_bones[padre]; e.use_connect = unito and (arm.edit_bones[padre].tail - Vector(a)).length < 1e-4
    return e
osso('bacino', G['bacino'], G['schiena']); osso('schiena', G['schiena'], G['petto'], 'bacino'); osso('petto', G['petto'], G['collo'], 'schiena'); osso('collo', G['collo'], G['testa'], 'petto'); osso('testa', G['testa'], G['cima'], 'collo')
for n in ('S', 'D'):
    osso('clavicola_' + n, G['clav' + n], G['spalla' + n], 'petto', False); osso('braccio_' + n, G['spalla' + n], G['gomito' + n], 'clavicola_' + n); osso('avambraccio_' + n, G['gomito' + n], G['polso' + n], 'braccio_' + n); osso('mano_' + n, G['polso' + n], G['dita' + n], 'avambraccio_' + n)
    osso('coscia_' + n, G['anca' + n], G['ginocchio' + n], 'bacino', False); osso('gamba_' + n, G['ginocchio' + n], G['caviglia' + n], 'coscia_' + n); osso('piede_' + n, G['caviglia' + n], G['punta' + n], 'gamba_' + n)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); A.select_set(True); bpy.context.view_layer.objects.active = A
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
senza = sum(1 for v in o.data.vertices if not v.groups)
# posa di prova
bpy.ops.object.mode_set(mode='POSE'); P = A.pose.bones
def gira(nome, asse, gradi):
    b = P[nome]; b.rotation_mode = 'QUATERNION'; M = A.matrix_world @ b.matrix
    R = Matrix.Rotation(math.radians(gradi), 4, asse); piv = Matrix.Translation(M.to_translation())
    b.matrix = A.matrix_world.inverted() @ (piv @ R @ piv.inverted() @ M); bpy.context.view_layer.update()
gira('petto', 'Z', 28); gira('schiena', 'Z', 12)                 # busto ruotato
gira('braccio_D', 'Y', -62); gira('avambraccio_D', 'Y', -75)       # braccio di tiro: alzato, gomito piegato
gira('braccio_S', 'Y', -38); gira('braccio_S', 'Z', 30); gira('avambraccio_S', 'Z', 35)      # braccio libero in appoggio, avanti e in basso
gira('coscia_S', 'X', -62); gira('coscia_S', 'Y', 28); gira('gamba_S', 'X', 85)             # gambe a bicicletta
gira('coscia_D', 'X', -40); gira('coscia_D', 'Y', -30); gira('gamba_D', 'X', 100)
gira('testa', 'Z', -18)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
print(json.dumps({'ossa': len(arm.bones), 'punti': len(o.data.vertices), 'punti_senza_pesi': senza, 'giunture': {k: [round(x, 3) for x in v] for k, v in G.items()}}))
