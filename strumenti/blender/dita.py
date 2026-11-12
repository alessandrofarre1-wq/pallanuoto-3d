# Mani, piedi e immagini: quante dita sono davvero separate nella geometria? Taglia la mesh con piani e conta i contorni chiusi.
import bpy, bmesh, sys, json, os
from mathutils import Vector
src, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
o = [x for x in bpy.data.objects if x.type == 'MESH'][0]; M = o.matrix_world
base = bmesh.new(); base.from_mesh(o.data); bmesh.ops.transform(base, matrix=M, verts=base.verts); bmesh.ops.remove_doubles(base, verts=base.verts, dist=1e-5)
xs = [v.co.x for v in base.verts]; zs = [v.co.z for v in base.verts]; ys = [v.co.y for v in base.verts]
mnx, mxx, mnz, mxz = min(xs), max(xs), min(zs), max(zs); H = mxz - mnz
def contorni(co, no, filtro=None):
    bm = base.copy(); r = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=co, plane_no=no, dist=1e-7)
    ed = [e for e in r['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
    if filtro: ed = [e for e in ed if filtro((e.verts[0].co + e.verts[1].co) / 2)]
    vic = {}
    for e in ed:
        a, b = e.verts[0].index, e.verts[1].index; vic.setdefault(a, []).append(b); vic.setdefault(b, []).append(a)
    visti = set(); n = 0; dim = []
    pos = {v.index: v.co.copy() for e in ed for v in e.verts}
    for s in vic:
        if s in visti: continue
        pila = [s]; visti.add(s); pts = []
        while pila:
            a = pila.pop(); pts.append(pos[a])
            for b in vic[a]:
                if b not in visti: visti.add(b); pila.append(b)
        n += 1; dim.append(round(max((p - pts[0]).length for p in pts), 4))
    bm.free(); return n, sorted(dim, reverse=True)
R = {'altezza': H, 'apertura_braccia': mxx - mnx}
# mani: piani perpendicolari al braccio (asse X), dalla punta delle dita verso il polso
for lato, x0, s in (('sinistra_del_modello(+X)', mxx, -1), ('destra_del_modello(-X)', mnx, 1)):
    R['mano_' + lato] = [{'distanza_dalla_punta': d, 'contorni': contorni(Vector((x0 + s * d, 0, 0)), Vector((1, 0, 0)), lambda p: p.z > mnz + 0.6 * H)} for d in (0.005, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.07, 0.09, 0.12)]
# piedi: piani perpendicolari alla direzione delle dita (asse Y, il fronte è -Y), dalla punta verso il tallone
for d in (0.004, 0.008, 0.012, 0.018, 0.025, 0.04):
    R.setdefault('piedi', []).append({'distanza_dalla_punta': d, 'contorni': contorni(Vector((0, min(ys) + d, 0)), Vector((0, 1, 0)), lambda p: p.z < mnz + 0.12 * H)})
# gambe e braccia separate dal busto? contorni a varie quote
for q in (0.05, 0.2, 0.35, 0.45, 0.5, 0.55, 0.7, 0.8, 0.9):
    R.setdefault('sezioni_orizzontali', []).append({'quota': q, 'contorni': contorni(Vector((0, 0, mnz + q * H)), Vector((0, 0, 1)))})
# immagini: salvate per guardarle, più statistiche di metallo e ruvidezza
for im in bpy.data.images:
    if im.size[0] == 0: continue
    f = os.path.join(os.path.dirname(out), 'tex-' + im.name.replace('texture_pbr_20250901', 'base').replace('base_metallic-base_roughness', 'metallo-ruvidezza').replace('base_normal', 'rilievo') + '.png')
    im2 = im.copy(); im2.scale(1024, 1024); im2.filepath_raw = f; im2.file_format = 'PNG'; im2.save()
    px = list(im2.pixels[:]); n = len(px) // 4
    R.setdefault('immagini', {})[im.name] = {'media_RGBA': [round(sum(px[k::4]) / n, 3) for k in range(4)], 'min_max_G': [round(min(px[1::4]), 3), round(max(px[1::4]), 3)], 'min_max_B': [round(min(px[2::4]), 3), round(max(px[2::4]), 3)], 'file': f}
json.dump(R, open(out, 'w'), indent=1); print(json.dumps(R)[:3500])
