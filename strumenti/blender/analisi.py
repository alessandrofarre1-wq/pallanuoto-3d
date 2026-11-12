# Analisi tecnica del GLB con Blender (bpy) senza interfaccia. Uso: python -I analisi.py <model.glb> <uscita.json>
import bpy, bmesh, sys, json, math
from mathutils import Vector
src, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
R = {'blender': bpy.app.version_string, 'oggetti': [], 'materiali': [], 'immagini': [], 'armature': [o.name for o in bpy.data.objects if o.type == 'ARMATURE'], 'animazioni': len(bpy.data.actions)}
for im in bpy.data.images:
    R['immagini'].append({'nome': im.name, 'dim': list(im.size), 'canali': im.channels, 'spazio': im.colorspace_settings.name})
for m in bpy.data.materials:
    d = {'nome': m.name, 'nodi': []}
    if m.node_tree:
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                d['principled'] = {i.name: (i.links[0].from_node.type + (':' + i.links[0].from_node.image.name if i.links[0].from_node.type == 'TEX_IMAGE' and i.links[0].from_node.image else '')) if i.is_linked else (list(i.default_value) if hasattr(i.default_value, '__len__') else i.default_value) for i in n.inputs if i.name in ('Base Color', 'Metallic', 'Roughness', 'Normal', 'Emission Color', 'Alpha')}
            d['nodi'].append(n.type)
    R['materiali'].append(d)
for o in bpy.data.objects:
    if o.type != 'MESH': continue
    me = o.data; bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
    tri = sum(len(f.verts) - 2 for f in bm.faces)
    # componenti collegate
    visti = [False] * len(bm.verts); comp = []
    for v in bm.verts:
        if visti[v.index]: continue
        pila = [v]; visti[v.index] = True; n = 0; mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
        while pila:
            a = pila.pop(); n += 1
            for k in range(3): mn[k] = min(mn[k], a.co[k]); mx[k] = max(mx[k], a.co[k])
            for e in a.link_edges:
                b = e.other_vert(a)
                if not visti[b.index]: visti[b.index] = True; pila.append(b)
        comp.append({'punti': n, 'min': [round(x, 3) for x in mn], 'max': [round(x, 3) for x in mx]})
    comp.sort(key=lambda c: -c['punti'])
    bordo = sum(1 for e in bm.edges if len(e.link_faces) == 1); nonman = sum(1 for e in bm.edges if len(e.link_faces) > 2); liberi = sum(1 for e in bm.edges if len(e.link_faces) == 0)
    degeneri = sum(1 for f in bm.faces if f.calc_area() < 1e-12)
    # normali: volume con segno (positivo = normali verso l'esterno) e spigoli con verso incoerente
    vol = sum(f.verts[0].co.dot(f.verts[1].co.cross(f.verts[2].co)) / 6 for f in bm.faces if len(f.verts) == 3)
    incoerenti = 0
    for e in bm.edges:
        if len(e.link_faces) == 2:
            f1, f2 = e.link_faces; l1 = [l for l in f1.loops if l.edge == e][0]; l2 = [l for l in f2.loops if l.edge == e][0]
            if l1.vert == l2.vert: incoerenti += 1
    # punti doppi (stessa posizione)
    chiavi = {}
    for v in bm.verts: chiavi.setdefault((round(v.co.x, 5), round(v.co.y, 5), round(v.co.z, 5)), 0); chiavi[(round(v.co.x, 5), round(v.co.y, 5), round(v.co.z, 5))] += 1
    doppi = sum(c - 1 for c in chiavi.values() if c > 1)
    bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = [min(p[k] for p in bb) for k in range(3)]; mx = [max(p[k] for p in bb) for k in range(3)]
    aree = sorted(f.calc_area() for f in bm.faces); lati = sorted(e.calc_length() for e in bm.edges)
    R['oggetti'].append({'nome': o.name, 'punti': len(bm.verts), 'triangoli': tri, 'facce': len(bm.faces), 'spigoli': len(bm.edges), 'materiali': [s.material.name if s.material else None for s in o.material_slots],
        'uv': [u.name for u in me.uv_layers], 'colori_vertice': [c.name for c in me.color_attributes], 'gruppi': len(o.vertex_groups), 'componenti': len(comp), 'componenti_grandi': comp[:12],
        'componenti_piccole_sotto_100_punti': sum(1 for c in comp if c['punti'] < 100),
        'spigoli_di_bordo': bordo, 'spigoli_non_manifold': nonman, 'spigoli_liberi': liberi, 'facce_degeneri': degeneri, 'spigoli_verso_incoerente': incoerenti, 'volume': round(vol, 5), 'punti_doppi': doppi,
        'ingombro_min': [round(x, 4) for x in mn], 'ingombro_max': [round(x, 4) for x in mx], 'dimensioni': [round(mx[k] - mn[k], 4) for k in range(3)],
        'lato_medio': round(sum(lati) / len(lati), 5), 'lato_mediano': round(lati[len(lati) // 2], 5), 'scala': list(o.scale), 'rotazione': list(o.rotation_euler)})
    bm.free()
json.dump(R, open(out, 'w'), indent=1)
print(json.dumps(R, indent=1)[:6000])
