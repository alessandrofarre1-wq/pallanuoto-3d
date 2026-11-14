# VISO DEL MODELLO v2: misure precise dal disegno e forme delle espressioni costruite sul modello COMPLETO (500.000 triangoli),
# poi trasferite sulla versione leggera del gioco (scheletro.py). Lavorare sul modello completo serve alla precisione: i tratti
# (sopracciglia, palpebre, labbra) hanno lì centinaia di punti; sulla versione leggera solo poche decine.
# Le maschere vengono dal colore dell'immagine in ogni punto (media dei suoi angoli): sopracciglia = marrone scuro sopra gli occhi;
# occhi = bianco dell'occhio, iride e pupilla. La linea delle labbra è il bordo del taglio fatto in prepara.py.
import bpy, bmesh, math, colorsys
from mathutils import Vector
from mathutils.kdtree import KDTree

def colori(o):
    me = o.data; img = [i for i in bpy.data.images if i.size[0] and 'colore_gioco' not in i.name and 'normal' not in i.name.lower() and 'metallic' not in i.name.lower() and 'rough' not in i.name.lower()][0]
    W, H = img.size; px = img.pixels[:]; uv = me.uv_layers.active.data
    som = [[0, 0, 0, 0] for _ in me.vertices]
    for li, l in enumerate(me.loops):
        u, v = uv[li].uv; i = (min(H - 1, max(0, int(v * H))) * W + min(W - 1, max(0, int(u * W)))) * 4
        t = som[l.vertex_index]; t[0] += px[i]; t[1] += px[i + 1]; t[2] += px[i + 2]; t[3] += 1
    return [(t[0] / t[3], t[1] / t[3], t[2] / t[3]) if t[3] else (0, 0, 0) for t in som]

def misura(o):
    """Maschere e punti di riferimento del viso, nel sistema del modello (x = sinistra del personaggio, y = indietro, z = su)."""
    me = o.data; C = colori(o); V = [v.co.copy() for v in me.vertices]
    davanti = [i for i, c in enumerate(V) if c.y < -0.035 and 1.48 < c.z < 1.71 and abs(c.x) < 0.095]
    occhio, ciglio = set(), set()
    for i in davanti:
        c = V[i]; h, s, v = colorsys.rgb_to_hsv(*C[i])
        if 1.625 < c.z < 1.663 and 0.015 < abs(c.x) < 0.068 and ((s < 0.25 and v > 0.55) or v < 0.25): occhio.add(i)
    # occhi: per ogni lato centro, larghezza e bordi alto/basso (per colonne di 2 mm)
    O = {}
    for lato in (1, -1):
        P = [V[i] for i in occhio if V[i].x * lato > 0]
        xs = sorted(p.x for p in P); n = len(xs)
        x0, x1 = xs[int(n * 0.01)], xs[int(n * 0.99)]
        col = {}
        for p in P:
            k = round(p.x * 500) / 500; a, b = col.get(k, (9, -9)); col[k] = (min(a, p.z), max(b, p.z))
        O[lato] = {'cx': (x0 + x1) / 2, 'mezza': (x1 - x0) / 2, 'cz': sum(p.z for p in P) / len(P),
                   'su': {k: b for k, (a, b) in col.items()}, 'giu': {k: a for k, (a, b) in col.items()}}
    def bordo(lato, x, quale):
        tab = O[lato][quale]; ks = sorted(tab); k = min(ks, key=lambda q: abs(q - x)); return tab[k]
    for i in davanti:
        c = V[i]; h, s, v = colorsys.rgb_to_hsv(*C[i]); lato = 1 if c.x > 0 else -1
        if 1.652 < c.z < 1.70 and 0.008 < abs(c.x) < 0.085 and v < 0.45 and c.z > bordo(lato, c.x, 'su') + 0.002 if abs(c.x - O[lato]['cx']) < O[lato]['mezza'] else (1.652 < c.z < 1.70 and 0.008 < abs(c.x) < 0.085 and v < 0.45):
            ciglio.add(i)
    return {'V': V, 'davanti': davanti, 'occhio': occhio, 'ciglio': ciglio, 'O': O, 'bordo': bordo}

def _componente_maggiore(me, insieme):
    """Tra i punti della maschera tiene, per lato, solo il gruppo collegato più grande (toglie ombre e ciglia sparse)."""
    vic = {i: [] for i in insieme}
    for e in me.edges:
        a, b = e.vertices
        if a in vic and b in vic: vic[a].append(b); vic[b].append(a)
    visti, gruppi = set(), []
    for i in insieme:
        if i in visti: continue
        g, coda = [], [i]; visti.add(i)
        while coda:
            j = coda.pop(); g.append(j)
            for k in vic[j]:
                if k not in visti: visti.add(k); coda.append(k)
        gruppi.append(g)
    tieni = set()
    for lato in (1, -1):
        gl = [g for g in gruppi if me.vertices[g[0]].co.x * lato > 0]
        if gl: tieni |= set(max(gl, key=len))
    return tieni

def riferimenti(o):
    """Tutto ciò che serve alle forme: sopracciglia (gruppo pulito), ovale di ogni occhio, bordi e angoli del taglio della bocca."""
    me = o.data; M = misura(o); V = M['V']
    M['ciglio'] = _componente_maggiore(me, M['ciglio'])
    for lato, d in M['O'].items():
        d['a'] = d['mezza']; d['cz'] = (max(d['su'].values()) + min(d['giu'].values())) / 2; d['b'] = (max(d['su'].values()) - min(d['giu'].values())) / 2
    # i due occhi sono disegnati uguali: stessa altezza e stessa apertura (la più piccola: quella misurata senza ciglia)
    cz = sum(d['cz'] for d in M['O'].values()) / 2; b = min(d['b'] for d in M['O'].values()); a = sum(d['a'] for d in M['O'].values()) / 2
    for d in M['O'].values(): d['cz'], d['b'], d['a'] = cz, b, a
    S = {}
    for lato in (1, -1):
        P = [V[i] for i in M['ciglio'] if V[i].x * lato > 0]
        xs = sorted(abs(p.x) for p in P)
        S[lato] = {'interno': xs[int(len(xs) * 0.02)], 'esterno': xs[int(len(xs) * 0.98)]}
    M['S'] = S
    # bocca: bordo del taglio, labbro sopra / sotto secondo le facce vicine, angoli = estremità del taglio
    bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
    bordo = [v for v in bm.verts if v.is_boundary and abs(v.co.x) < 0.06 and v.co.y < -0.05 and 1.54 < v.co.z < 1.575]
    sopra, sotto = set(), set()
    for v in bordo:
        zf = sum(f.calc_center_median().z for f in v.link_faces) / max(1, len(v.link_faces))
        (sotto if zf < v.co.z else sopra).add(v.index)
    xs = [v.co.copy() for v in bordo]
    sx = min(xs, key=lambda c: c.x); dx = max(xs, key=lambda c: c.x)
    linea = sorted((v.co.x, v.co.z) for v in bordo)
    bm.free()
    M['bocca'] = {'sopra': sopra, 'sotto': sotto, 'angoli': (sx.copy(), dx.copy()), 'linea': linea,
                  'cx': (sx.x + dx.x) / 2, 'mezza': (dx.x - sx.x) / 2, 'z': sum(z for x, z in linea) / len(linea)}
    return M

FORME = ('bocca_aperta', 'bocca_larga', 'sorriso', 'bocca_giu', 'labbra_strette', 'sopracciglia_giu', 'sopracciglia_su',
         'sopracciglia_su_interno', 'occhi_stretti', 'occhi_spalancati', 'naso_arricciato')
CARDINE = (0.02, 1.605)      # asse della mandibola (y, z): dietro e sopra la bocca, vicino alle orecchie

def ruota_mandibola(c, ang):
    y, z = c.y - CARDINE[0], c.z - CARDINE[1]; co, si = math.cos(ang), math.sin(ang)
    return Vector((0, (y * co - z * si) - y, (y * si + z * co) - z))

def forme(o, M):
    """Shape key sul modello completo. Ogni forma è un campo di spostamenti costruito sui riferimenti misurati."""
    me = o.data; V = M['V']; B = M['bocca']; O = M['O']; S = M['S']
    az = me.attributes.get('_zona')
    def liscio(a, b, t): t = max(0.0, min(1.0, (t - a) / (b - a))); return t * t * (3 - 2 * t)
    def gauss(d, s): return math.exp(-(d / s) ** 2)
    kc = KDTree(len(M['ciglio'])); [kc.insert(V[i], i) for i in M['ciglio']]; kc.balance()
    angoli = B['angoli']
    def zlinea(x):
        L = B['linea']; k = min(range(len(L)), key=lambda j: abs(L[j][0] - x)); return L[k][1]
    viso = [i for i in M['davanti'] if az.data[i].vector[0] < 0.5 and az.data[i].vector[2] < 0.5]
    out = {n: {} for n in FORME}
    for i in viso:
        c = V[i]; lato = 1 if c.x > 0 else -1; E = O[lato]; Sl = S[lato]
        # ---------------- sopracciglia ----------------
        if i in M['ciglio']: wb = 1.0
        else:
            _, _, d = kc.find(c); wb = gauss(d, 0.007)
        dentroOcchio = abs(c.x - E['cx']) < E['a'] * 1.25
        topOcchio = E['cz'] + E['b']
        if dentroOcchio: wb *= liscio(topOcchio + 0.001, topOcchio + 0.006, c.z)      # la palpebra e l'occhio non seguono il sopracciglio
        wb *= 1 - liscio(1.700, 1.712, c.z)                                           # niente movimento sotto il bordo della cuffia
        t = max(0.0, min(1.0, (abs(c.x) - Sl['interno']) / (Sl['esterno'] - Sl['interno'])))      # 0 = lato del naso, 1 = esterno
        if wb > 1e-3:
            out['sopracciglia_giu'][i] = Vector((-lato * 0.0035 * (1 - t), -0.0015, -(0.0025 + 0.0045 * (1 - t)))) * wb
            out['sopracciglia_su'][i] = Vector((0, 0.0008, 0.0045 + 0.0025 * math.sin(math.pi * t))) * wb
            out['sopracciglia_su_interno'][i] = Vector((lato * 0.001 * (1 - t), 0, 0.0065 * (1 - t) ** 1.5)) * wb
        # ---------------- palpebre ----------------
        dxo = (c.x - E['cx']) / (E['a'] * 1.3)
        if abs(dxo) < 1:
            ampio = math.sqrt(1 - dxo * dxo)                      # più movimento al centro dell'occhio, niente agli angoli
            zt, zb = E['cz'] + E['b'] * ampio, E['cz'] - E['b'] * ampio
            if c.z >= E['cz']: su = min(1.0, (c.z - E['cz']) / max(1e-4, zt - E['cz'])) if c.z <= zt else gauss(c.z - zt, 0.005)
            else: su = 0.0
            if c.z < E['cz']: giu = min(1.0, (E['cz'] - c.z) / max(1e-4, E['cz'] - zb)) if c.z >= zb else gauss(zb - c.z, 0.006)
            else: giu = 0.0
            su *= ampio; giu *= ampio
            if su > 1e-3 or giu > 1e-3:
                out['occhi_stretti'][i] = Vector((0, 0, -0.0055 * su + 0.0045 * giu))
                out['occhi_spalancati'][i] = Vector((0, 0, 0.0028 * su - 0.0020 * giu))
                out['sorriso'][i] = Vector((0, 0, 0.0018 * giu))                          # le guance spingono su la palpebra inferiore
        # ---------------- bocca ----------------
        dxb = c.x - B['cx']; adx = abs(dxb); sb = 1 if dxb >= 0 else -1
        ang = angoli[1] if sb > 0 else angoli[0]
        da = (c - ang).length                                                  # distanza dall'angolo della bocca di questo lato
        zl = zlinea(c.x) if adx < B['mezza'] else ang.z
        sottoLinea = (i in B['sotto']) or (i not in B['sopra'] and c.z < zl)
        # forma della bocca lungo la sua larghezza: 1 al centro, 0 agli angoli (le labbra restano unite agli angoli)
        u = min(1.0, adx / B['mezza']); arco = max(0.0, 1 - u * u)
        vicinoLinea = gauss(c.z - zl, 0.012)
        # mandibola: tutto ciò che sta sotto le labbra ruota attorno al cardine; vicino alla bocca il labbro inferiore scende ad
        # arco (più al centro, niente agli angoli); verso le guance il movimento si spegne piano (niente pieghe)
        if sottoLinea and c.z > 1.455:
            wj = (1 - liscio(0.035, 0.10, adx)) * liscio(1.455, 1.495, c.z)
            wj *= 1 - vicinoLinea * (1 - arco) if adx < B['mezza'] + 0.012 else 1 - vicinoLinea
            if wj > 1e-3: out['bocca_aperta'][i] = ruota_mandibola(c, 0.20 * wj) + Vector((0, -0.002 * wj, -0.003 * wj))
        elif adx < B['mezza'] + 0.005:
            wu = arco * (1 - liscio(zl + 0.001, zl + 0.012, c.z))
            if wu > 1e-3: out['bocca_aperta'][i] = Vector((0, -0.0008 * wu, 0.0030 * wu))      # il labbro di sopra sale appena, ad arco
        wa = gauss(da, 0.012)                                                  # zona dell'angolo della bocca
        guancia = gauss((c - Vector((ang.x + sb * 0.010, ang.y + 0.004, ang.z + 0.022))).length, 0.015)
        curva = u * u * vicinoLinea                                            # tutta la linea delle labbra si incurva verso gli angoli
        if wa > 1e-3 or guancia > 1e-3 or curva > 1e-3:
            out['sorriso'][i] = out['sorriso'].get(i, Vector()) + Vector((sb * 0.004 * wa, 0.003 * wa, 0.0075 * wa + 0.0045 * curva)) + Vector((sb * 0.0012, -0.0025, 0.0040)) * guancia
            out['bocca_giu'][i] = Vector((0, 0.001 * wa, -0.0065 * wa - 0.004 * curva))
            sopra = 1.0 if (i in B['sopra'] or c.z > zl) else -1.0
            out['bocca_larga'][i] = Vector((sb * 0.0065 * wa, 0.003 * wa, 0)) + Vector((0, 0, 0.0016 * sopra * gauss(adx, B['mezza'] * 0.8) * gauss(c.z - zl, 0.006)))
        lab = (1 - liscio(B['mezza'] * 0.7, B['mezza'] + 0.004, adx)) * gauss(c.z - zl, 0.009)
        if lab > 1e-3:
            out['labbra_strette'][i] = Vector((-sb * 0.002 * wa, -0.0015 * lab, (zl - c.z) * 0.45 * lab))
        mento = gauss((c - Vector((B['cx'], c.y, zl - 0.035))).length, 0.012) * (1 if c.y < -0.06 else 0)
        if mento > 1e-3: out['bocca_giu'][i] = out['bocca_giu'].get(i, Vector()) + Vector((0, -0.0015 * mento, 0.0025 * mento))
        # ---------------- naso arricciato ----------------
        ali = gauss((c - Vector((sb * 0.022 + B['cx'], c.y, 1.585))).length, 0.008)
        glab = gauss((c - Vector((0.0, c.y, 1.655))).length, 0.009)
        if ali > 1e-3 or glab > 1e-3: out['naso_arricciato'][i] = Vector((0, -0.0008 * ali, 0.0035 * ali - 0.0015 * glab))
    # shape key sull'oggetto
    o.shape_key_add(name='Basis', from_mix=False)
    for n in FORME:
        k = o.shape_key_add(name=n, from_mix=False); k.value = 0.0
        for i, dv in out[n].items(): k.data[i].co = V[i] + dv
    return {n: len(out[n]) for n in FORME}
