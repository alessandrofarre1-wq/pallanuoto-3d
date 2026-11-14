# (modello v2 del 13/11/2026: stesse ossa; versione del gioco con espressioni del viso)
# SCHELETRO DEFINITIVO del pallanuotista cartoon, compatibile con i movimenti calcolati dal gioco.
# Uso: python -I scheletro.py <player_base.blend> <cartella uscita>
# - Stesse ossa e stessi nomi degli atleti attuali del gioco (src/grafica/modelli/atleta.js): pelvis, spine_01-03, neck_01, head,
#   clavicle/upperarm/lowerarm/hand, thigh/calf/foot/ball, più "presa_r" e "presa_l" (punto di aggancio della palla nel palmo).
# - I pesi si calcolano con un'ossatura "anatomica" (ossa lungo gli arti: servono ai pesi automatici di Blender); poi la mesh viene
#   legata a un'ossatura "di gioco" con le stesse giunture ma ossa tutte dritte verso l'alto: così nel .glb ogni osso ha rotazione
#   di riposo nulla, come si aspetta il codice del gioco che orienta le ossa una per una.
import bpy, bmesh, sys, os, json, math
from mathutils import Vector
src, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.open_mainfile(filepath=src)
o = bpy.data.objects['Pallanuotista']; me = o.data
V = [v.co.copy() for v in me.vertices]; H = max(v.z for v in V); mxx = max(v.x for v in V)
def centro(f):
    p = [v for v in V if f(v)]; return Vector((sum(v.x for v in p) / len(p), sum(v.y for v in p) / len(p), sum(v.z for v in p) / len(p)))
def gamba(s, q): return centro(lambda v: v.x * s > 0.01 and abs(v.z - q * H) < 0.012 * H)
def braccio(s, ax): return centro(lambda v: abs(v.x * s - ax) < 0.012 and v.z > 0.68 * H)
def busto(q, lx=0.22): return centro(lambda v: abs(v.z - q * H) < 0.01 * H and abs(v.x) < lx)
G = {}      # giunture (testa di ogni osso), in metri: x = sinistra del personaggio, y = dietro, z = su
b0 = busto(0.525); G['pelvis'] = Vector((0, b0.y, 0.525 * H)); G['spine_01'] = Vector((0, busto(0.58).y, 0.58 * H)); G['spine_02'] = Vector((0, busto(0.645).y, 0.645 * H)); G['spine_03'] = Vector((0, busto(0.715, 0.18).y + 0.01, 0.715 * H))
c = centro(lambda v: abs(v.z - 0.805 * H) < 0.008 * H and abs(v.x) < 0.09); G['neck_01'] = Vector((0, c.y + 0.01, 0.795 * H)); G['head'] = Vector((0, c.y, 0.845 * H)); G['_cima'] = Vector((0, c.y, H))
for n, s in (('l', 1), ('r', -1)):
    a = gamba(s, 0.47); G['thigh_' + n] = Vector((a.x, a.y, 0.505 * H)); G['calf_' + n] = gamba(s, 0.272); cv = gamba(s, 0.055); G['foot_' + n] = cv
    punta = centro(lambda v: v.x * s > 0.01 and v.z < 0.03 * H and v.y < cv.y - 0.09); G['ball_' + n] = Vector((punta.x, cv.y - 0.11, 0.025 * H)); G['_dita_piede_' + n] = Vector((punta.x, min(v.y for v in V if v.x * s > 0.01 and v.z < 0.05 * H), 0.015 * H))
    sp = braccio(s, 0.215); G['upperarm_' + n] = Vector((s * 0.205, sp.y - 0.01, sp.z + 0.015)); G['clavicle_' + n] = Vector((s * 0.035, G['spine_03'].y - 0.03, G['upperarm_' + n].z - 0.01))
    G['lowerarm_' + n] = braccio(s, 0.505); G['hand_' + n] = braccio(s, 0.715); G['_dita_' + n] = Vector((s * mxx * 0.99, G['hand_' + n].y, G['hand_' + n].z)); pm = braccio(s, 0.775); G['presa_' + n] = Vector((pm.x, pm.y - 0.035, pm.z - 0.005))
GERARCHIA = [('pelvis', None, 'spine_01'), ('spine_01', 'pelvis', 'spine_02'), ('spine_02', 'spine_01', 'spine_03'), ('spine_03', 'spine_02', 'neck_01'), ('neck_01', 'spine_03', 'head'), ('head', 'neck_01', '_cima')]
for n in ('l', 'r'):
    GERARCHIA += [('clavicle_' + n, 'spine_03', 'upperarm_' + n), ('upperarm_' + n, 'clavicle_' + n, 'lowerarm_' + n), ('lowerarm_' + n, 'upperarm_' + n, 'hand_' + n), ('hand_' + n, 'lowerarm_' + n, '_dita_' + n), ('presa_' + n, 'hand_' + n, None),
                  ('thigh_' + n, 'pelvis', 'calf_' + n), ('calf_' + n, 'thigh_' + n, 'foot_' + n), ('foot_' + n, 'calf_' + n, 'ball_' + n), ('ball_' + n, 'foot_' + n, '_dita_piede_' + n)]
def ossatura(nome, anatomica):
    arm = bpy.data.armatures.new(nome); A = bpy.data.objects.new(nome, arm); bpy.context.scene.collection.objects.link(A)
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = A; A.select_set(True); bpy.ops.object.mode_set(mode='EDIT')
    for osso, padre, verso in GERARCHIA:
        e = arm.edit_bones.new(osso); e.head = G[osso]
        e.tail = G[verso] if anatomica and verso else G[osso] + Vector((0, 0, 0.05)); e.roll = 0
        if padre: e.parent = arm.edit_bones[padre]; e.use_connect = False
        if osso.startswith('presa_'): e.use_deform = False
    bpy.ops.object.mode_set(mode='OBJECT'); return A
# 1) pesi automatici con l'ossatura anatomica
An = ossatura('Anatomica', True)
bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); An.select_set(True); bpy.context.view_layer.objects.active = An
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
senza = sum(1 for v in me.vertices if not v.groups)
# 2) rifinitura dei pesi: testa rigida (cuffia, paraorecchie, riccioli e viso seguono solo la testa), al massimo 4 ossa per punto, somma 1
gi = {g.name: g.index for g in o.vertex_groups}
az = me.attributes.get('_zona'); asc = me.attributes.get('_scuro')
zN = G['neck_01'].z; zH = G['head'].z
for v in me.vertices:
    z = v.co.z; cuffia = az.data[v.index].vector[0] > 0.5 or az.data[v.index].vector[2] > 0.5 and z > zH or asc.data[v.index].value > 0.5
    t = 1.0 if (cuffia and z > zN) or z > zH + 0.035 else 0.0
    if z > zH - 0.01 and abs(v.co.x) < 0.16 and t < 1: t = max(t, min(1, (z - (zH - 0.01)) / 0.045))
    if t > 0:
        for g in o.vertex_groups:
            try: w = g.weight(v.index)
            except RuntimeError: continue
            if g.name != 'head': g.add([v.index], w * (1 - t), 'REPLACE')
        try: wh = o.vertex_groups['head'].weight(v.index)
        except RuntimeError: wh = 0
        o.vertex_groups['head'].add([v.index], wh * (1 - t) + t, 'REPLACE')
bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
bpy.ops.object.vertex_group_smooth(group_select_mode='ALL', factor=0.5, repeat=2, expand=0.0)
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4); bpy.ops.object.vertex_group_normalize_all(lock_active=False)
bpy.ops.object.mode_set(mode='OBJECT')
# 3) ossatura di gioco (ossa dritte verso l'alto): la mesh passa a questa, i pesi restano perché i nomi sono gli stessi
Gi = ossatura('Scheletro', False)
o.parent = Gi; o.matrix_parent_inverse.identity()
for m in o.modifiers:
    if m.type == 'ARMATURE': m.object = Gi
bpy.data.objects.remove(An)
os.makedirs(out, exist_ok=True)
info = {'ossa': [x[0] for x in GERARCHIA], 'punti_senza_pesi_automatici': senza, 'giunture_m': {k: [round(x, 3) for x in v] for k, v in G.items() if not k.startswith('_')}, 'presa': 'presa_r / presa_l: figlie di hand_r / hand_l, al centro del palmo; la palla (raggio 0,11 m) va centrata 0,11 m sotto il palmo (asse -Z di Blender, -Y del .glb con la mano in posa di riposo a palmo in giù)'}
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'player_rig.blend'), compress=True)
# 4) versioni a dettaglio decrescente, con scheletro
def ridotte(lato):
    for i in bpy.data.images:
        if i.size[0] > lato: i.scale(lato, lato)
def esporta(nome, rapporto, lato):
    d = o.copy(); d.data = o.data.copy(); d.name = nome; bpy.context.scene.collection.objects.link(d)
    while d.data.color_attributes: d.data.color_attributes.remove(d.data.color_attributes[0])
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = d; d.select_set(True)
    if rapporto < 1:
        m = d.modifiers.new('riduci', 'DECIMATE'); m.ratio = rapporto
        bpy.ops.object.modifier_move_to_index(modifier=m.name, index=0); bpy.ops.object.modifier_apply(modifier=m.name)
        bpy.ops.object.mode_set(mode='WEIGHT_PAINT'); bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4); bpy.ops.object.vertex_group_normalize_all(lock_active=False); bpy.ops.object.mode_set(mode='OBJECT')
    ridotte(lato); Gi.select_set(True)
    f = os.path.join(out, nome + '.glb')
    bpy.ops.export_scene.gltf(filepath=f, export_format='GLB', use_selection=True, export_image_format='JPEG', export_jpeg_quality=88, export_yup=True, export_vertex_color='NONE', export_attributes=True, export_tangents=False,
                              export_skins=True, export_animations=False, export_def_bones=False, export_influence_nb=4, export_rest_position_armature=True)
    info[nome] = {'triangoli': len(d.data.polygons), 'kB': round(os.path.getsize(f) / 1024), 'immagini': lato}
    bpy.data.objects.remove(d)

# IMMAGINE RIDIPINTA PER LA VERSIONE DEL GIOCO (modello v2). L'immagine del generatore è divisa in centinaia di pezzetti: ridotti i
# triangoli, ogni triangolo grande ne attraversa diversi e il viso si rovina (sopracciglia a gradini, macchie). Qui la versione
# ridotta riceve coordinate nuove (pezzi grandi e puliti; la testa con 5 volte lo spazio a parità di superficie, perché è ciò che si
# vede) e il colore viene "cotto" dal modello completo con Cycles. Solo il colore: rilievo, metallo e ruvidezza non servono in partita.
def cuoci(d, lato, zc):
    import bmesh
    me = d.data
    uvn = me.uv_layers.new(name='gioco'); me.uv_layers.active = uvn
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.004, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bm = bmesh.from_edit_mesh(me); uv = bm.loops.layers.uv['gioco']; bm.faces.ensure_lookup_table()
    # isole: facce unite da lati con le stesse coordinate
    par = list(range(len(bm.faces)))
    def f(x):
        while par[x] != x: par[x] = par[par[x]]; x = par[x]
        return x
    for e in bm.edges:
        if len(e.link_faces) != 2: continue
        a, b = e.link_faces
        la = [l for l in a.loops if l.edge == e][0]; lb = [l for l in b.loops if l.edge == e][0]
        if (la[uv].uv - lb.link_loop_next[uv].uv).length < 1e-6 and (la.link_loop_next[uv].uv - lb[uv].uv).length < 1e-6: par[f(a.index)] = f(b.index)
    isole = {}
    for fa in bm.faces: isole.setdefault(f(fa.index), []).append(fa)
    for facce in isole.values():
        if sum(1 for fa in facce if fa.calc_center_median().z > zc) * 2 < len(facce): continue
        pts = [l[uv].uv.copy() for fa in facce for l in fa.loops]; c = sum(pts, Vector((0, 0))) / len(pts)
        for fa in facce:
            for l in fa.loops: l[uv].uv = c + (l[uv].uv - c) * 2.3      # area x 5,3
    bmesh.update_edit_mesh(me)
    bpy.ops.uv.select_all(action='SELECT'); bpy.ops.uv.pack_islands(rotate=True, margin=0.004)
    bpy.ops.object.mode_set(mode='OBJECT')
    img = bpy.data.images.new('colore_gioco', lato, lato, alpha=False)
    mat = bpy.data.materials.new('pallanuotista_gioco'); mat.use_nodes = True; nt = mat.node_tree; p = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img; nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Metallic'].default_value = 0.0; p.inputs['Roughness'].default_value = 0.62
    nt.nodes.active = t
    vecchio = d.data.materials[0]; d.data.materials.clear(); d.data.materials.append(mat)
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 4
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); d.select_set(True); bpy.context.view_layer.objects.active = d
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_selected_to_active=True, cage_extrusion=0.01, max_ray_distance=0.03, margin=6, uv_layer='gioco')
    img.pack()
    for l in list(me.uv_layers):
        if l.name != 'gioco': me.uv_layers.remove(l)
    bpy.ops.object.select_all(action='DESELECT'); d.select_set(True); bpy.context.view_layer.objects.active = d

# ESPRESSIONI DEL VISO (modello v2): forme alternative della stessa mesh (shape key in Blender, morph target nel .glb), costruite
# DOPO la riduzione dei triangoli (in Blender ridurre i triangoli cancella le shape key). Ogni forma sposta solo i punti del davanti
# del viso (niente cuffia, paraorecchie, laccetti) con una caduta morbida attorno a un punto di riferimento misurato sul modello:
# occhi a quota 1,654 m (x = ±0,035 dal centro del viso), sopracciglia 1,684, bocca 1,582 (angoli a ±0,034). Spostamenti di pochi
# millimetri: espressioni sobrie, come chiede il concept (niente sorrisi larghi, niente denti, la bocca non si apre: non ha interno).
VISO = {'cx': -0.004, 'occhi': 1.654, 'occhioX': 0.035, 'ciglia': 1.684, 'bocca': 1.582, 'angoloX': 0.034}
def espressioni(d):
    import math
    me = d.data; az = me.attributes.get('_zona')
    base = [v.co.copy() for v in me.vertices]
    viso = [i for i, c in enumerate(base) if c.y < -0.03 and 1.52 < c.z < 1.712 and abs(c.x - VISO['cx']) < 0.1 and az.data[i].vector[0] < 0.5 and az.data[i].vector[2] < 0.5]
    def g(c, x, z, sx, sz): return math.exp(-((c.x - x) ** 2) / (2 * sx * sx) - ((c.z - z) ** 2) / (2 * sz * sz))
    cx, oz, ox, bz, mz, ax = VISO['cx'], VISO['occhi'], VISO['occhioX'], VISO['ciglia'], VISO['bocca'], VISO['angoloX']
    def forma(c):
        f = {}
        sopra = 1.0 if c.z > oz + 0.012 else max(0.0, (c.z - oz) / 0.012)      # solo sopra la palpebra superiore
        for lato in (1, -1):
            xs = cx + lato * ox; dx = (c.x - cx) * lato      # dx > 0 verso l'esterno
            w = g(c, xs, bz, 0.028, 0.012) * sopra
            wi = g(c, cx + lato * 0.016, bz - 0.002, 0.014, 0.011) * sopra      # parte interna del sopracciglio
            f.setdefault('sopracciglia_giu', Vector()).__iadd__(Vector((-lato * 0.0025 * wi, 0.0015 * w, -0.0045 * w - 0.002 * wi)))
            f.setdefault('sopracciglia_su_interno', Vector()).__iadd__(Vector((0, 0, 0.005 * wi)))
            sup = g(c, xs, oz + 0.010, 0.016, 0.004); inf = g(c, xs, oz - 0.012, 0.016, 0.004)      # palpebre
            f.setdefault('occhi_stretti', Vector()).__iadd__(Vector((0, 0, -0.0022 * sup + 0.0026 * inf)))
            a = g(c, cx + lato * ax, mz, 0.012, 0.009); gu = g(c, cx + lato * (ax + 0.012), mz + 0.02, 0.016, 0.014)      # angolo della bocca e guancia
            f.setdefault('sorriso', Vector()).__iadd__(Vector((lato * 0.0025 * a, 0.0015 * a, 0.0045 * a + 0.0025 * gu)))
            f.setdefault('bocca_giu', Vector()).__iadd__(Vector((0, 0.0008 * a, -0.0045 * a)))
        lab = g(c, cx, mz, 0.03, 0.007)
        f['labbra_strette'] = Vector((0, 0.0015 * lab, (mz - c.z) * 0.35 * lab))
        return f
    d.shape_key_add(name='Basis', from_mix=False)
    nomi = ('sopracciglia_giu', 'sopracciglia_su_interno', 'occhi_stretti', 'sorriso', 'bocca_giu', 'labbra_strette')
    chiavi = {n: d.shape_key_add(name=n, from_mix=False) for n in nomi}
    for k in chiavi.values(): k.value = 0.0      # nel .glb il peso iniziale di ogni espressione dev'essere 0 (viso neutro)
    toccati = {n: 0 for n in nomi}
    for i in viso:
        f = forma(base[i])
        for n in nomi:
            dv = f.get(n)
            if dv is not None and dv.length > 2e-5: chiavi[n].data[i].co = base[i] + dv; toccati[n] += 1
    return {n: toccati[n] for n in nomi}

# versione PER IL GIOCO: testa e corpo ridotti SEPARATAMENTE (il viso, la cuffia e i paraorecchie sono ciò che si vede in partita
# e hanno bisogno di più triangoli; il corpo è quasi tutto sott'acqua). Una sola immagine (il colore, 1024): rilievo, metallo e
# ruvidezza non servono a distanza di gioco e pesano sul telefono.
def esporta_gioco(nome, triTesta, triCorpo, lato):
    import bmesh
    d = o.copy(); d.data = o.data.copy(); d.name = nome; bpy.context.scene.collection.objects.link(d)
    while d.data.color_attributes: d.data.color_attributes.remove(d.data.color_attributes[0])
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = d; d.select_set(True)
    zc = G['neck_01'].z
    for testa, voluti in ((True, triTesta), (False, triCorpo)):
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
        n = 0
        for pl in d.data.polygons:
            pl.select = (pl.center.z > zc) == testa; n += pl.select
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.decimate(ratio=min(1, voluti / max(1, n)), use_vertex_group=False); bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.mode_set(mode='WEIGHT_PAINT'); bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4); bpy.ops.object.vertex_group_normalize_all(lock_active=False); bpy.ops.object.mode_set(mode='OBJECT')
    cuoci(d, lato, zc)
    forme = espressioni(d)
    Gi.select_set(True)
    f = os.path.join(out, nome + '.glb')
    bpy.ops.export_scene.gltf(filepath=f, export_format='GLB', use_selection=True, export_image_format='JPEG', export_jpeg_quality=88, export_yup=True, export_vertex_color='NONE', export_attributes=True, export_tangents=False,
                              export_skins=True, export_animations=False, export_def_bones=False, export_influence_nb=4, export_rest_position_armature=True,
                              export_morph=True, export_morph_normal=False, export_try_sparse_sk=True)
    info['espressioni'] = forme
    testa = sum(1 for pl in d.data.polygons if pl.center.z > zc)
    info[nome] = {'triangoli': len(d.data.polygons), 'di_cui_testa': testa, 'kB': round(os.path.getsize(f) / 1024), 'immagini': lato}
    bpy.data.objects.remove(d)
esporta('player_rig_LOD0', 1.0, 2048); esporta('player_rig_LOD1', 0.30, 1024); esporta('player_rig_LOD2', 0.12, 1024); esporta('player_rig_LOD3', 0.05, 512)
esporta_gioco('pallanuotista', 6000, 4300, 1024)      # v2: più triangoli alla testa (espressioni), meno al corpo (quasi tutto sott'acqua)
cap = [v.co for v in me.vertices if me.attributes['_zona'].data[v.index].vector[0] > 0.5 and v.co.z > 1.5]
cc = Vector((sum(c.x for c in cap) / len(cap), sum(c.y for c in cap) / len(cap), sum(c.z for c in cap) / len(cap)))
info['cuffia_centro_glb'] = [round(cc.x, 3), round(cc.z, 3), round(-cc.y, 3)]      # .glb: x = sinistra, y = su, z = avanti
json.dump(info, open(os.path.join(out, 'scheletro.json'), 'w'), indent=1); print(json.dumps({k: v for k, v in info.items() if k.startswith('p')}))