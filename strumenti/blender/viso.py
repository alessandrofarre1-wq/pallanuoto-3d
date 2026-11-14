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

TAGLIO = 0.86      # quanto del labbro è tagliato (deve coincidere con prepara.py)

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
    # il taglio si ferma prima degli angoli (prepara.py: 86% della mezza larghezza, così gli angoli restano pelle chiusa):
    # gli angoli veri della bocca disegnata stanno più in fuori, sulla stessa quota
    cx_ = (sx.x + dx.x) / 2; mezza = (dx.x - sx.x) / 2 / TAGLIO
    sx = Vector((cx_ - mezza, sx.y + 0.004, sx.z)); dx = Vector((cx_ + mezza, dx.y + 0.004, dx.z))
    M['bocca'] = {'sopra': sopra, 'sotto': sotto, 'angoli': (sx, dx), 'linea': linea,
                  'cx': cx_, 'mezza': mezza, 'z': sum(z for x, z in linea) / len(linea)}
    return M

FORME = ('bocca_aperta', 'labbro_su', 'bocca_larga', 'sorriso_d', 'sorriso_s', 'bocca_giu', 'labbra_strette', 'mento_su',
         'sopracciglia_giu', 'sopracciglia_aggrottate', 'sopracciglia_su', 'sopracciglia_su_interno',
         'occhi_stretti', 'occhi_spalancati', 'occhio_chiuso_d', 'occhio_chiuso_s', 'guance_su', 'naso_arricciato')
# _d / _s = lato destro / sinistro del personaggio (destro = x negativa). Le forme sono pensate per sommarsi: ogni espressione
# del concept di Ale coinvolge tutto il viso (sopracciglia, occhi, guance, naso, bocca, mento), con ampiezze da cartone animato.
CARDINE = (0.02, 1.605)      # asse della mandibola (y, z): dietro e sopra la bocca, vicino alle orecchie
APERTURA = 0.38              # rotazione della mandibola a forma piena (radianti): bocca spalancata dell'urlo

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
    nasoBase = 1.578
    viso = [i for i in M['davanti'] if az.data[i].vector[0] < 0.5 and az.data[i].vector[2] < 0.5]
    # mandibola, fuori dal davanti del viso: pelle più arretrata, cuffia e laccetti sotto la bocca seguono la mandibola con lo
    # stesso peso della pelle accanto (altrimenti si aprono strappi lungo la mascella e sotto il mento)
    visoSet = set(viso)
    mascella = [i for i, c in enumerate(V) if i not in visoSet and 1.44 < c.z < 1.565 and c.y < 0.03 and abs(c.x - B['cx']) < 0.11]
    out = {n: {} for n in FORME}
    def add(n, i, v):
        if v.length > 1e-6: out[n][i] = out[n].get(i, Vector()) + v
    for i in viso:
        c = V[i]; lato = 1 if c.x > 0 else -1; E = O[lato]; Sl = S[lato]
        lt = '_s' if lato > 0 else '_d'      # x positiva = sinistra del personaggio
        # ================= SOPRACCIGLIA =================
        if i in M['ciglio']: wb = 1.0
        else:
            _, _, d = kc.find(c); wb = gauss(d, 0.009)
        topOcchio = E['cz'] + E['b']
        if abs(c.x - E['cx']) < E['a'] * 1.3: wb *= liscio(topOcchio + 0.0005, topOcchio + 0.006, c.z)
        wb *= 1 - liscio(1.700, 1.712, c.z)
        t = max(0.0, min(1.0, (abs(c.x) - Sl['interno']) / (Sl['esterno'] - Sl['interno'])))      # 0 = lato del naso, 1 = esterno
        if wb > 1e-3:
            add('sopracciglia_giu', i, Vector((0, -0.002, -0.0065)) * wb)                                  # tutto il sopracciglio giù, dritto
            add('sopracciglia_aggrottate', i, Vector((-lato * 0.006 * (1 - t), -0.003 * (1 - t), -0.010 * (1 - t) ** 1.3 + 0.002 * t)) * wb)   # interno giù e verso il naso, esterno appena su
            add('sopracciglia_su', i, Vector((0, 0.001, 0.008 + 0.003 * math.sin(math.pi * t))) * wb)
            add('sopracciglia_su_interno', i, Vector((lato * 0.0015 * (1 - t), 0, 0.009 * (1 - t) ** 1.5 - 0.0015 * t)) * wb)
        # pelle tra le sopracciglia: si raccoglie con l'aggrottare
        glab = gauss((c - Vector((0.0, c.y, 1.662))).length, 0.010)
        if glab > 1e-3: add('sopracciglia_aggrottate', i, Vector((0, -0.0025, -0.004)) * glab)
        # ================= OCCHI =================
        dxo = (c.x - E['cx']) / (E['a'] * 1.35)
        if abs(dxo) < 1:
            ampio = math.sqrt(1 - dxo * dxo)
            zt, zb = E['cz'] + E['b'] * ampio, E['cz'] - E['b'] * ampio
            if c.z >= E['cz']: su = min(1.0, (c.z - E['cz']) / max(1e-4, zt - E['cz'])) if c.z <= zt else gauss(c.z - zt, 0.006)
            else: su = 0.0
            if c.z < E['cz']: giu = min(1.0, (E['cz'] - c.z) / max(1e-4, E['cz'] - zb)) if c.z >= zb else gauss(zb - c.z, 0.008)
            else: giu = 0.0
            su *= ampio; giu *= ampio
            if su > 1e-3 or giu > 1e-3:
                add('occhi_stretti', i, Vector((0, 0, -0.0075 * su + 0.0055 * giu)))
                add('occhi_spalancati', i, Vector((0, 0, 0.0040 * su - 0.0025 * giu)))
                # occhio chiuso (occhiolino): la palpebra di sopra scende fino a un terzo dell'altezza, quella di sotto sale un po'
                chiusa = E['cz'] - E['b'] * 0.35 * ampio
                if c.z >= chiusa:
                    dz = (chiusa - c.z) if c.z <= zt else (chiusa - zt) * gauss(c.z - zt, 0.007)
                    add('occhio_chiuso' + lt, i, Vector((0, -0.001 * su, dz * 0.97)))
                else:
                    add('occhio_chiuso' + lt, i, Vector((0, 0, (chiusa - c.z) * 0.6 * giu)))
                add('guance_su', i, Vector((0, 0, 0.0035 * giu)))                                          # le guance spingono su la palpebra di sotto
        # ================= GUANCE =================
        g = gauss((c - Vector((E['cx'] + lato * 0.006, c.y, 1.605))).length, 0.020) * (1 if c.y < -0.04 else 0.5)
        if g > 1e-3: add('guance_su', i, Vector((lato * 0.001, -0.003, 0.0075)) * g)
        # ================= NASO =================
        ali = gauss((c - Vector((B['cx'] + lato * 0.022, c.y, 1.586))).length, 0.010)
        dorso = gauss((c - Vector((0.0, c.y, 1.625))).length, 0.010)
        if ali > 1e-3 or dorso > 1e-3: add('naso_arricciato', i, Vector((lato * 0.001 * ali, -0.0015 * ali, 0.0060 * ali + 0.0025 * dorso)))
        # ================= BOCCA =================
        dxb = c.x - B['cx']; adx = abs(dxb); sb = 1 if dxb >= 0 else -1; lb = '_s' if sb > 0 else '_d'
        ang = angoli[1] if sb > 0 else angoli[0]
        da = (c - ang).length
        zl = zlinea(c.x) if adx < B['mezza'] else ang.z
        sottoLinea = (i in B['sotto']) or (i not in B['sopra'] and c.z < zl)
        u = min(1.0, adx / B['mezza']); arco = max(0.0, 1 - u * u)
        vicinoLinea = gauss(c.z - zl, 0.012)
        # mandibola (urlo, euforia): labbro di sotto ad arco, mento e mascella che ruotano, guance che si allungano piano
        if sottoLinea and c.z > 1.45:
            wj = (1 - liscio(0.04, 0.11, adx)) * liscio(1.45, 1.495, c.z)
            wj *= (1 - vicinoLinea * (1 - arco)) if adx < B['mezza'] + 0.012 else (1 - vicinoLinea)
            if wj > 1e-3: add('bocca_aperta', i, ruota_mandibola(c, APERTURA * wj) + Vector((0, -0.002 * wj, -0.004 * wj)))
            # mento su (determinazione, broncio): il mento sale e il labbro di sotto si gonfia verso l'alto
            m = gauss((c - Vector((B['cx'], c.y, zl - 0.040))).length, 0.016) * (1 if c.y < -0.06 else 0)
            lab_sotto = arco * gauss(c.z - zl, 0.008)
            add('mento_su', i, Vector((0, -0.002 * m - 0.0015 * lab_sotto, 0.0045 * m + 0.0025 * lab_sotto)))
        elif adx < B['mezza'] + 0.008 and c.z < nasoBase:
            # labbro di sopra: sale (mostra i denti), di più al centro, niente sotto il naso
            wu = (arco ** 1.2) * (1 - liscio(zl + 0.002, nasoBase - 0.002, c.z))      # vicino agli angoli il labbro resta attaccato
            if wu > 1e-3:
                add('labbro_su', i, Vector((0, -0.002 * wu, 0.0085 * wu)))
                add('bocca_aperta', i, Vector((0, -0.0008 * wu, 0.0025 * wu)))
        # angoli della bocca
        wa = gauss(da, 0.013)
        curva = u * u * vicinoLinea
        if wa > 1e-3 or curva > 1e-3:
            sor = Vector((sb * 0.0065 * wa, 0.004 * wa, 0.011 * wa + 0.006 * curva))
            add('sorriso' + lb, i, sor)
            add('bocca_giu', i, Vector((sb * 0.001 * wa, 0.0015 * wa, -0.0095 * wa - 0.005 * curva)))
            add('bocca_larga', i, Vector((sb * 0.010 * wa, 0.004 * wa, 0)))
        # guancia del sorriso (ogni lato con il suo angolo della bocca)
        gs = gauss((c - Vector((ang.x + sb * 0.012, c.y, ang.z + 0.026))).length, 0.017) * (1 if c.y < -0.04 else 0.5)
        if gs > 1e-3: add('sorriso' + lb, i, Vector((sb * 0.0015, -0.003, 0.0055)) * gs)
        if gs > 1e-3 and abs(c.x - E['cx']) < E['a'] * 1.2 and c.z < E['cz']:
            add('sorriso' + lb, i, Vector((0, 0, 0.002)) * gauss(E['cz'] - E['b'] - c.z, 0.006))      # occhio un po' stretto da sotto
        lab = (1 - liscio(B['mezza'] * 0.7, B['mezza'] + 0.004, adx)) * gauss(c.z - zl, 0.010)
        if lab > 1e-3: add('labbra_strette', i, Vector((-sb * 0.003 * wa, -0.002 * lab, (zl - c.z) * 0.55 * lab)))
    for i in mascella:
        c = V[i]
        wj = liscio(1.45, 1.495, c.z) * (1 - liscio(0.04, 0.11, abs(c.x - B['cx']))) * (1 - liscio(B['z'] - 0.012, B['z'], c.z))
        if wj > 1e-3: add('bocca_aperta', i, ruota_mandibola(c, APERTURA * wj) + Vector((0, -0.002 * wj, -0.004 * wj)))
    o.shape_key_add(name='Basis', from_mix=False)
    for n in FORME:
        k = o.shape_key_add(name=n, from_mix=False); k.value = 0.0
        for i, dv in out[n].items(): k.data[i].co = V[i] + dv
    return {n: len(out[n]) for n in FORME}
