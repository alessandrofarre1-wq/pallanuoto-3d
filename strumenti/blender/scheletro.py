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
# DOPO la riduzione dei triangoli (in Blender ridurre i triangoli cancella le shape key). Punti di riferimento misurati sul modello
# alto 1,80 (x = sinistra del personaggio, y = indietro, z = su; centro del viso x = -0,004):
#   occhi a quota 1,654 (x = ±0,035), palpebra superiore 1,666, inferiore 1,642; sopracciglia 1,675-1,695 (da ±0,012 a ±0,075);
#   naso: punta a 1,59, sotto a 1,575; LINEA DELLE LABBRA a 1,556 (dal disegno), angoli a ±0,042; mento a circa 1,49.
# Le forme spostano solo il davanti del viso (niente cuffia, paraorecchie, laccetti), con cadute morbide; la mandibola gira attorno
# a un cardine vicino alle orecchie. Ampiezze di alcuni millimetri fino a 1,5 cm (bocca aperta): servono espressioni leggibili.
VISO = {'cx': -0.004, 'occhi': 1.654, 'occhioX': 0.035, 'palpSu': 1.666, 'palpGiu': 1.642, 'ciglia': 1.685, 'bocca': 1.556, 'angoloX': 0.042,
        'naso': 1.585, 'cardine': (0.0, 1.60)}
FORME = ('bocca_aperta', 'bocca_larga', 'sorriso', 'bocca_giu', 'labbra_strette', 'sopracciglia_giu', 'sopracciglia_su',
         'sopracciglia_su_interno', 'occhi_stretti', 'occhi_spalancati', 'naso_arricciato')
# INTERNO DELLA BOCCA: una cavità chiusa e due file di denti, dentro la testa dietro alle labbra, legati all'osso della testa.
# Nessun materiale in più: il dato per punto _bocca (1 = cavità, 2 = denti) dice al disegno del gioco che colore dare (corpo.js).
def interno_bocca(d):
    import bmesh
    me = d.data; cx, zb = VISO['cx'], VISO['bocca']
    if not me.attributes.get('_bocca'): me.attributes.new('_bocca', 'FLOAT', 'POINT')
    testa = d.vertex_groups['head'].index
    bm = bmesh.new(); bm.from_mesh(me)
    lb = bm.verts.layers.float['_bocca']; lz = bm.verts.layers.float_vector['_zona']; ls = bm.verts.layers.float['_scuro']; ln = bm.verts.layers.float['_numero']
    dl = bm.verts.layers.deform.verify()
    def segna(v, tipo):      # dati scritti sul punto stesso (Blender riordina i punti al salvataggio: niente indici)
        v[lb] = tipo; v[lz] = (0, 0, 0); v[ls] = 0; v[ln] = 0; v[dl].clear(); v[dl][testa] = 1.0
    # cavità: ellissoide schiacciato, dietro ai denti (davanti a 1,6 cm dalla superficie delle labbra)
    r = bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=8, radius=1.0)
    for v in r['verts']:
        v.co = Vector((cx + v.co.x * 0.040, -0.058 + v.co.y * 0.014, zb - 0.008 + v.co.z * 0.022)); segna(v, 1.0)
    # denti: archi sottili che seguono la curva della bocca (2 = sopra, 3 = sotto: questi seguono la mandibola)
    def arco(z0, z1, tipo, ritira):
        N = 10; riga = []
        for k in range(N + 1):
            t = -1 + 2 * k / N; x = cx + t * 0.033; y = -0.0875 + 0.014 * t * t + ritira
            a0 = bm.verts.new((x, y, z0)); a1 = bm.verts.new((x, y, z1)); segna(a0, tipo); segna(a1, tipo); riga.append((a0, a1))
        for k in range(N):
            (a0, a1), (b0, b1) = riga[k], riga[k + 1]; bm.faces.new((a0, b0, b1, a1))
    arco(zb - 0.0065, zb + 0.003, 2.0, 0.0)
    arco(zb - 0.013, zb - 0.0045, 3.0, 0.0015)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 3])
    bm.to_mesh(me); bm.free(); me.update()
    B = me.attributes['_bocca'].data
    return {'cavita': [i for i in range(len(me.vertices)) if 0.5 < B[i].value < 1.5],
            'denti_giu': [i for i in range(len(me.vertices)) if B[i].value > 2.5]}
def espressioni(d, interno):
    import math
    me = d.data; az = me.attributes.get('_zona'); ab = me.attributes.get('_bocca')
    base = [v.co.copy() for v in me.vertices]
    cx, oz, ox, bz, ax = VISO['cx'], VISO['occhi'], VISO['occhioX'], VISO['bocca'], VISO['angoloX']
    cy, cz = VISO['cardine']
    giuDenti = set(interno['denti_giu']); cav = set(interno['cavita'])
    # da che parte della bocca sta ogni punto: vicino al taglio i bordi delle due labbra hanno la stessa quota, quindi decide la
    # media delle facce attorno (sotto la linea = labbro inferiore, che segue la mandibola)
    import bmesh
    bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
    labbroGiu = {}
    for v in bm.verts:
        if abs(v.co.z - bz) < 0.004 and abs(v.co.x - cx) < ax + 0.004 and v.co.y < -0.05 and v.link_faces:
            labbroGiu[v.index] = sum(f.calc_center_median().z for f in v.link_faces) / len(v.link_faces) < bz
    bm.free()
    viso = [i for i, c in enumerate(base) if c.y < -0.025 and 1.47 < c.z < 1.72 and abs(c.x - cx) < 0.095
            and az.data[i].vector[0] < 0.5 and az.data[i].vector[2] < 0.5 and (ab is None or ab.data[i].value < 0.5)]
    def g(c, x, z, sx, sz): return math.exp(-((c.x - x) ** 2) / (2 * sx * sx) - ((c.z - z) ** 2) / (2 * sz * sz))
    def liscio(a, b, t): t = max(0.0, min(1.0, (t - a) / (b - a))); return t * t * (3 - 2 * t)
    def ruota(c, ang):      # mandibola: rotazione attorno all'asse x passante per il cardine (y, z)
        y, z = c.y - cy, c.z - cz; co, si = math.cos(ang), math.sin(ang)
        return Vector((0, (y * co - z * si) - y, (y * si + z * co) - z))
    def forma(c, dente=False, i=-1):
        f = {}; dx = c.x - cx; ad = abs(dx); s = 1 if dx >= 0 else -1
        # --- bocca ---
        sotto = (1.0 if labbroGiu[i] else 0.0) if i in labbroGiu else 1.0 - liscio(bz - 0.006, bz - 0.0005, c.z)      # labbro inferiore e mento
        lat = 1.0 - liscio(0.045, 0.085, ad)                                # la mandibola si muove meno verso le guance
        alto = liscio(1.455, 1.50, c.z)                                     # e niente collo
        mand = 1.0 if dente else sotto * lat * alto
        # vicino alla bocca le labbra restano attaccate agli angoli: apertura a ovale, non a fessura dritta
        vicino = math.exp(-((c.z - bz) / 0.011) ** 2) if not dente else 0.0
        angoli = max(0.0, 1 - (ad / (ax + 0.003)) ** 2) ** 1.3      # apertura a ovale
        mand *= 1 - vicino * (1 - angoli)
        f['bocca_aperta'] = (ruota(c, 0.19 * mand) + Vector((0, -0.003 * mand, -0.006 * mand))
                             + Vector((0, -0.001 * (1 - sotto) * angoli, 0.0035 * angoli * math.exp(-((c.z - bz - 0.002) / 0.006) ** 2) * (1 - sotto))))      # il labbro di sopra sale appena, di più al centro
        ang = g(c, cx + s * ax, bz, 0.013, 0.010)                           # zona dell'angolo della bocca
        lab = g(c, cx, bz, 0.032, 0.008)                                    # labbra
        f['bocca_larga'] = Vector((s * 0.010 * ang, 0.004 * ang, 0)) + Vector((0, 0, 0.0025 * lab * (1 if c.z > bz else -1)))
        guancia = g(c, cx + s * 0.050, bz + 0.026, 0.020, 0.016)
        f['sorriso'] = Vector((s * 0.006 * ang, 0.004 * ang, 0.010 * ang + 0.007 * guancia)) + Vector((0, -0.0025 * guancia, 0))
        f['bocca_giu'] = Vector((0, 0.0015 * ang, -0.010 * ang)) + Vector((0, -0.003 * g(c, cx, bz - 0.03, 0.02, 0.012), 0.004 * g(c, cx, bz - 0.03, 0.02, 0.012)))
        f['labbra_strette'] = Vector((-s * 0.004 * ang, -0.003 * lab, (bz - c.z) * 0.6 * lab))
        # --- sopracciglia (solo sopra la palpebra superiore) ---
        sopra = liscio(VISO['palpSu'] - 0.002, VISO['palpSu'] + 0.008, c.z) * (1 - liscio(1.698, 1.710, c.z))
        cigl = g(c, cx + s * 0.044, VISO['ciglia'], 0.030, 0.013) * sopra
        inte = g(c, cx + s * 0.014, VISO['ciglia'] - 0.002, 0.014, 0.012) * sopra
        f['sopracciglia_giu'] = Vector((-s * 0.006 * inte, -0.003 * cigl, -0.009 * cigl - 0.006 * inte))
        f['sopracciglia_su'] = Vector((0, 0.001 * cigl, 0.010 * cigl + 0.002 * g(c, cx, VISO['ciglia'] + 0.02, 0.05, 0.015)))
        f['sopracciglia_su_interno'] = Vector((s * 0.002 * inte, 0, 0.011 * inte))
        # --- occhi ---
        su = g(c, cx + s * ox, VISO['palpSu'], 0.017, 0.004); giu = g(c, cx + s * ox, VISO['palpGiu'], 0.017, 0.004)
        zig = g(c, cx + s * (ox + 0.006), VISO['palpGiu'] - 0.014, 0.02, 0.008)
        f['occhi_stretti'] = Vector((0, 0, -0.0045 * su + 0.005 * giu + 0.003 * zig))
        f['occhi_spalancati'] = Vector((0, 0, 0.0035 * su - 0.0025 * giu))
        # --- naso arricciato (rabbia): ali del naso su, pelle tra le sopracciglia giù ---
        ali = g(c, cx + s * 0.016, VISO['naso'] - 0.005, 0.010, 0.010); rad = g(c, cx, VISO['naso'] + 0.03, 0.012, 0.012)
        f['naso_arricciato'] = Vector((0, -0.0015 * ali, 0.006 * ali + 0.0025 * rad))
        return f
    d.shape_key_add(name='Basis', from_mix=False)
    chiavi = {n: d.shape_key_add(name=n, from_mix=False) for n in FORME}
    for k in chiavi.values(): k.value = 0.0      # nel .glb il peso iniziale di ogni espressione dev'essere 0 (viso neutro)
    toccati = {n: 0 for n in FORME}
    for i in viso + sorted(giuDenti | cav):
        f = forma(base[i], dente=(i in giuDenti or i in cav), i=i)
        if i in giuDenti or i in cav: f = {'bocca_aperta': f['bocca_aperta']} if (i in giuDenti or base[i].z < bz - 0.006) else {}      # denti di sotto e metà bassa della cavità seguono la mandibola
        for n, dv in f.items():
            if dv.length > 2e-5: chiavi[n].data[i].co = base[i] + dv; toccati[n] += 1
    return toccati

# versione PER IL GIOCO: testa e corpo ridotti SEPARATAMENTE (il viso, la cuffia e i paraorecchie sono ciò che si vede in partita
# e hanno bisogno di più triangoli; il corpo è quasi tutto sott'acqua). Una sola immagine (il colore, 1024): rilievo, metallo e
# ruvidezza non servono a distanza di gioco e pesano sul telefono.
def esporta_gioco(nome, triViso, triTesta, triCorpo, lato):
    import bmesh
    d = o.copy(); d.data = o.data.copy(); d.name = nome; bpy.context.scene.collection.objects.link(d)
    while d.data.color_attributes: d.data.color_attributes.remove(d.data.color_attributes[0])
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = d; d.select_set(True)
    zc = G['neck_01'].z
    def parte(c):      # 0 = davanti del viso (bocca, occhi, sopracciglia: più denso), 1 = resto della testa, 2 = corpo
        if c.z <= zc: return 2
        return 0 if (c.y < -0.03 and 1.48 < c.z < 1.715 and abs(c.x - VISO['cx']) < 0.085) else 1
    for quale, voluti in ((0, triViso), (1, triTesta), (2, triCorpo)):
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
        n = 0
        for pl in d.data.polygons:
            pl.select = parte(pl.center) == quale; n += pl.select
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.decimate(ratio=min(1, voluti / max(1, n)), use_vertex_group=False); bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.mode_set(mode='WEIGHT_PAINT'); bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4); bpy.ops.object.vertex_group_normalize_all(lock_active=False); bpy.ops.object.mode_set(mode='OBJECT')
    cuoci(d, lato, zc)
    interno = interno_bocca(d)
    forme = espressioni(d, interno)
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
esporta_gioco('pallanuotista', 3400, 2800, 4300, 1024)      # v2: più triangoli alla testa (espressioni), meno al corpo (quasi tutto sott'acqua)
cap = [v.co for v in me.vertices if me.attributes['_zona'].data[v.index].vector[0] > 0.5 and v.co.z > 1.5]
cc = Vector((sum(c.x for c in cap) / len(cap), sum(c.y for c in cap) / len(cap), sum(c.z for c in cap) / len(cap)))
info['cuffia_centro_glb'] = [round(cc.x, 3), round(cc.z, 3), round(-cc.y, 3)]      # .glb: x = sinistra, y = su, z = avanti
json.dump(info, open(os.path.join(out, 'scheletro.json'), 'w'), indent=1); print(json.dumps({k: v for k, v in info.items() if k.startswith('p')}))