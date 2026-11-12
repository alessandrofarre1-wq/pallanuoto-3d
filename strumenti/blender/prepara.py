# Prepara il personaggio per il gioco SENZA cambiarne il disegno. Uso: python -I prepara.py <model.glb originale> <cartella uscita>
#  1) salda le cuciture (un solo guscio continuo: ombreggiatura e pesi dello scheletro più puliti); le coordinate delle immagini restano
#  2) altezza 1,80 m, piedi a quota zero, centrato; trasformazioni applicate
#  3) "zone" scritte sui punti (colore per vertice): calottina, costume, parti bianche (paraorecchie, laccetti, numero), capelli/sopracciglia, pelle
#  4) salva il file .blend e le versioni .glb a dettaglio decrescente, con immagini ridotte
import bpy, bmesh, sys, os, json, colorsys
from mathutils import Vector, Matrix
src, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
o = [x for x in bpy.data.objects if x.type == 'MESH'][0]; o.name = 'Pallanuotista'; o.data.name = 'Pallanuotista_LOD0'
bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
me = o.data
# 1) saldatura
bm = bmesh.new(); bm.from_mesh(me); prima = len(bm.verts); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5); bm.to_mesh(me); bm.free(); me.update()
# 2) scala e posizione
zs = [v.co.z for v in me.vertices]; H0 = max(zs) - min(zs); k = 1.80 / H0
piedi = [v.co for v in me.vertices if v.co.z < min(zs) + 0.03 * H0]; cx = sum(p.x for p in piedi) / len(piedi); cy = (min(v.co.y for v in me.vertices) + max(v.co.y for v in me.vertices)) / 2
me.transform(Matrix.Scale(k, 4) @ Matrix.Translation((-cx, -cy, -min(zs)))); me.update()
for p in me.polygons: p.use_smooth = True
H = 1.80
# 3) zone: colore dell'immagine nel punto + quota
img = [i for i in bpy.data.images if i.size[0] and 'normal' not in i.name and 'metallic' not in i.name][0]
W, Hh = img.size; px = img.pixels[:]
uv = me.uv_layers.active.data
zona = me.color_attributes.new(name='zona', type='BYTE_COLOR', domain='CORNER')
conta = {'calottina': 0, 'costume': 0, 'bianco': 0, 'scuro': 0, 'pelle': 0}
for li, l in enumerate(me.loops):
    u, v = uv[li].uv; x = min(W - 1, max(0, int(u * W))); y = min(Hh - 1, max(0, int(v * Hh))); i = (y * W + x) * 4
    r, g, b = px[i], px[i + 1], px[i + 2]; h, s, val = colorsys.rgb_to_hsv(r, g, b); co = me.vertices[l.vertex_index].co; z = co.z
    if 0.52 < h < 0.75 and s > 0.35 and val > 0.2: c = (1, 0, 0, 1) if z > 0.75 * H else (0, 1, 0, 1); conta['calottina' if z > 0.75 * H else 'costume'] += 1
    elif val > 0.8 and s < 0.18 and (z > 0.72 * H or 0.4 * H < z < 0.56 * H) and not (z > 0.8 * H and abs(co.x) < 0.075 and co.y < -0.02): c = (0, 0, 1, 1); conta['bianco'] += 1      # (non i denti e il bianco degli occhi: stanno sul davanti del viso)
    elif val < 0.22 and z > 0.8 * H: c = (0, 0, 0, 1); conta['scuro'] += 1
    else: c = (1, 1, 1, 1); conta['pelle'] += 1
    zona.data[li].color = c
# le stesse zone come dato per punto, esportabile nel .glb senza toccare i colori (un "colore per vertice" nel .glb moltiplica
# il colore del materiale e scurirebbe il modello): _zona = (calottina, costume, bianco), _scuro = capelli e sopracciglia
somma = [[0, 0, 0, 0, 0] for _ in me.vertices]
for li, l in enumerate(me.loops):
    c = zona.data[li].color; t = somma[l.vertex_index]; t[4] += 1
    if c[0] > 0.5 and c[1] > 0.5: continue
    if c[0] > 0.5: t[0] += 1
    elif c[1] > 0.5: t[1] += 1
    elif c[2] > 0.5: t[2] += 1
    else: t[3] += 1
az = me.attributes.new('_zona', 'FLOAT_VECTOR', 'POINT'); asc = me.attributes.new('_scuro', 'FLOAT', 'POINT')
for i, t in enumerate(somma): az.data[i].vector = (t[0] / t[4], t[1] / t[4], t[2] / t[4]); asc.data[i].value = t[3] / t[4]
info = {'punti_prima': prima, 'punti_dopo_saldatura': len(me.vertices), 'triangoli': len(me.polygons), 'scala_applicata': k, 'altezza_m': H, 'zone_angoli': conta}
# immagini ridotte (le originali 4096 restano nel file di partenza)
os.makedirs(out, exist_ok=True)
def ridotte(lato):
    for i in bpy.data.images:
        if i.size[0] > lato: i.scale(lato, lato)
ridotte(2048)
for i in bpy.data.images:
    if i.size[0]: i.pack()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'player_base.blend'), compress=True)
# 4) versioni a dettaglio decrescente
def esporta(nome, rapporto, lato):
    bpy.ops.object.select_all(action='DESELECT')
    d = o.copy(); d.data = o.data.copy(); d.name = nome; d.data.name = nome; bpy.context.scene.collection.objects.link(d)
    while d.data.color_attributes: d.data.color_attributes.remove(d.data.color_attributes[0])      # nel .glb niente colori per vertice
    if rapporto < 1:
        m = d.modifiers.new('riduci', 'DECIMATE'); m.ratio = rapporto; m.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = d; bpy.ops.object.modifier_apply(modifier=m.name)
    ridotte(lato)
    d.select_set(True); bpy.context.view_layer.objects.active = d
    f = os.path.join(out, nome + '.glb')
    bpy.ops.export_scene.gltf(filepath=f, export_format='GLB', use_selection=True, export_image_format='JPEG', export_jpeg_quality=88, export_apply=True, export_yup=True, export_vertex_color='NONE', export_attributes=True, export_tangents=False)
    info[nome] = {'triangoli': len(d.data.polygons), 'punti': len(d.data.vertices), 'immagini': lato, 'kB': round(os.path.getsize(f) / 1024)}
    bpy.data.objects.remove(d)
esporta('player_base_LOD0', 1.0, 2048)
esporta('player_base_LOD1', 0.30, 1024)
esporta('player_base_LOD2', 0.12, 1024)
esporta('player_base_LOD3', 0.05, 512)
json.dump(info, open(os.path.join(out, 'prepara.json'), 'w'), indent=1); print(json.dumps(info))
