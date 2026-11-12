# Seconda analisi: dopo aver saldato i punti doppi lungo le cuciture delle immagini, com'è davvero la superficie?
import bpy, bmesh, sys, json
from mathutils import Vector
src, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
o = [x for x in bpy.data.objects if x.type == 'MESH'][0]
bm = bmesh.new(); bm.from_mesh(o.data)
prima = len(bm.verts)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
visti = set(); comp = []
for v in bm.verts:
    if v.index in visti: continue
    pila = [v]; visti.add(v.index); n = 0; mn = [1e9] * 3; mx = [-1e9] * 3; facce = set()
    while pila:
        a = pila.pop(); n += 1
        for k in range(3): mn[k] = min(mn[k], a.co[k]); mx[k] = max(mx[k], a.co[k])
        for f in a.link_faces: facce.add(f.index)
        for e in a.link_edges:
            b = e.other_vert(a)
            if b.index not in visti: visti.add(b.index); pila.append(b)
    comp.append({'punti': n, 'facce': len(facce), 'min': [round(x, 3) for x in mn], 'max': [round(x, 3) for x in mx]})
comp.sort(key=lambda c: -c['punti'])
bordo = [e for e in bm.edges if len(e.link_faces) == 1]; nonman = [e for e in bm.edges if len(e.link_faces) > 2]
# anelli di bordo (buchi)
R = {'punti_prima': prima, 'punti_dopo': len(bm.verts), 'componenti': len(comp), 'componenti_elenco': comp[:15], 'spigoli_di_bordo': len(bordo), 'spigoli_non_manifold': len(nonman),
     'dove_non_manifold': [[round(x, 3) for x in ((e.verts[0].co + e.verts[1].co) / 2)] for e in nonman[:30]],
     'dove_bordo': [[round(x, 3) for x in ((e.verts[0].co + e.verts[1].co) / 2)] for e in bordo[:30]],
     'punti_non_manifold': sum(1 for v in bm.verts if not v.is_manifold)}
vol = sum(f.verts[0].co.dot(f.verts[1].co.cross(f.verts[2].co)) / 6 for f in bm.faces if len(f.verts) == 3); R['volume'] = round(vol, 5)
inc = 0
for e in bm.edges:
    if len(e.link_faces) == 2:
        f1, f2 = e.link_faces; l1 = [l for l in f1.loops if l.edge == e][0]; l2 = [l for l in f2.loops if l.edge == e][0]
        if l1.vert == l2.vert: inc += 1
R['spigoli_verso_incoerente'] = inc
json.dump(R, open(out, 'w'), indent=1); print(json.dumps({k: v for k, v in R.items() if k not in ('dove_bordo',)}, indent=0)[:2500])
