"""Anatomical CC0 MakeHuman hand for the separate Plask model.

Uses the authored hm08 quad mesh, actual finger landmarks and painted weights.
No primitive union, voxel remesh or synthetic palm is used. Source licensing and
SHA256 are in ../sorgente/makehuman/PROVENIENZA.json. Original MakeHuman assets
are CC0; no AGPL program code is copied. This provider is original glue code.

Output coordinates: Blender X extends laterally, +Z is thumb side, -Y palm.
API make_hand(wrist, side) -> vertices(Vector), polygon indices, layout, weights.
"""
import json
import math
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[2] / 'modelli-sorgente' / 'pallanuotista' / 'v073' / 'makehuman'
SCALE = .1105  # hm08 unit -> meters; wrist to middle tip about 19.48 cm
FINGER_NAMES = {1: 'Thumb', 2: 'Index', 3: 'Middle', 4: 'Ring', 5: 'Pinky'}


def _dot(a, b):
    return sum(x*y for x, y in zip(a, b))


def _sub(a, b):
    return tuple(x-y for x, y in zip(a, b))


def _add(a, b):
    return tuple(x+y for x, y in zip(a, b))


def _mul(a, s):
    return tuple(x*s for x in a)


def _unit(a):
    n = math.sqrt(_dot(a, a))
    return _mul(a, 1/n)


def _cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])


def _load():
    verts, faces, group = [], [], ''
    for line in (SOURCE/'base.obj').read_text().splitlines():
        if line.startswith('v '):
            verts.append(tuple(float(v) for v in line.split()[1:4]))
        elif line.startswith('g '):
            group = line[2:].strip()
        elif line.startswith('f ') and group == 'body':
            faces.append(tuple(int(v.split('/')[0])-1 for v in line.split()[1:]))
    rig = json.loads((SOURCE/'default.mhskel').read_text())
    raw_weights = json.loads((SOURCE/'default_weights.mhw').read_text())['weights']
    return verts, faces, rig, raw_weights


def _make_hand_data(wrist, side):
    """Pure-Python variant also usable by independent inspection tools."""
    if side not in (-1, 1):
        raise ValueError('side must be -1 or +1')
    verts, faces, rig, raw_weights = _load()
    def joint(name):
        ids = rig['joints'][name]
        return tuple(sum(verts[i][k] for i in ids)/len(ids) for k in range(3))
    origin = joint('wrist.L____head')
    forward = _unit(_sub(joint('finger3-1.L____head'), origin))
    thumb_axis = _sub(joint('finger2-1.L____head'), joint('finger5-1.L____head'))
    thumb_axis = _unit(_sub(thumb_axis, _mul(forward, _dot(thumb_axis, forward))))
    palm_axis = _unit(_cross(forward, thumb_axis))
    def local(point):
        q = _sub(point, origin)
        return (_dot(q, forward)*SCALE, _dot(q, thumb_axis)*SCALE, _dot(q, palm_axis)*SCALE)
    def world(point):
        u, t, d = local(point)
        return (wrist[0] + side*u, wrist[1] - d, wrist[2] + t)
    prefix = 'left' if side > 0 else 'right'
    source_weights = [{} for _ in verts]
    def mapped(name):
        if not name.endswith('.L'):
            return None
        if name.startswith('finger'):
            finger, bone = name.removesuffix('.L').removeprefix('finger').split('-')
            return prefix+'Hand'+FINGER_NAMES[int(finger)]+bone
        if name.startswith('metacarpal') or name == 'wrist.L':
            return prefix+'Hand'
        if name.startswith('lowerarm'):
            return prefix+'ForeArm'
        return None
    for name, entries in raw_weights.items():
        target = mapped(name)
        if target:
            for vi, weight in entries:
                source_weights[vi][target] = source_weights[vi].get(target, 0.)+weight
    def normalized(weights):
        weights = {n:w for n,w in weights.items() if w > 1e-8}
        total = sum(weights.values())
        return {n:w/total for n,w in weights.items()} if total else {prefix+'Hand':1.}
    source_weights = [normalized(w) for w in source_weights]
    points = [world(v) for v in verts]
    # Keep a 28 mm proximal cuff so the caller can clip at X=.770 and bridge.
    # Only right half (MakeHuman anatomical left) of the authored body mesh.
    # Limiting original X excludes legs and torso, never any palm/finger face.
    cut = -.028
    us = [local(v)[0] for v in verts]
    out_faces, edge_cache = [], {}
    def intersection(a, b):
        edge = tuple(sorted((a,b)))
        if edge in edge_cache:
            return edge_cache[edge]
        t = (cut-us[a])/(us[b]-us[a])
        idx = len(points)
        points.append(_add(_mul(points[a],1-t),_mul(points[b],t)))
        names = source_weights[a].keys() | source_weights[b].keys()
        source_weights.append(normalized({n:source_weights[a].get(n,0)*(1-t)+source_weights[b].get(n,0)*t for n in names}))
        us.append(cut)
        edge_cache[edge] = idx
        return idx
    for face in faces:
        if min(verts[i][0] for i in face) < 3.0 or max(us[i] for i in face) < cut:
            continue
        poly = []
        for j,b in enumerate(face):
            a = face[j-1]
            ia,ib = us[a]>=cut,us[b]>=cut
            if ia != ib:
                poly.append(intersection(a,b))
            if ib:
                poly.append(b)
        if len(poly)>=3:
            out_faces.append(tuple(poly) if side>0 else tuple(reversed(poly)))
    used = sorted(set(i for f in out_faces for i in f))
    compact = {old:new for new,old in enumerate(used)}
    output_vertices = [points[i] for i in used]
    output_faces = [tuple(compact[i] for i in f) for f in out_faces]
    output_weights = [source_weights[i] for i in used]
    layout = {}
    for index, name in FINGER_NAMES.items():
        bones = [rig['bones'][f'finger{index}-{k}.L'] for k in (1,2,3)]
        joints = [joint(bones[0]['head'])]+[joint(b['tail']) for b in bones]
        # Radius is only advisory for caller diagnostics. Surface/weights stay authored.
        radii = [.012,.011,.009,.007] if name=='Thumb' else [.010,.009,.008,.006]
        layout[name] = ([world(p) for p in joints],radii)
    return output_vertices, output_faces, layout, output_weights


def make_hand(wrist, side):
    """Return one Catmull-Clark level with Blender-interpolated skin weights.

    The modifier operates on a temporary hand object only. Quad edge loops,
    finger separation and the authored skinning are preserved; the body and
    its shading are never touched. Bone landmarks stay exactly unchanged.
    """
    import bpy
    from mathutils import Vector
    vertices, faces, layout, weights = _make_hand_data(tuple(wrist), side)
    mesh = bpy.data.meshes.new('MH_hand_subdivision_source')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new('MH_hand_subdivision_temporary', mesh)
    bpy.context.collection.objects.link(obj)
    meshes_to_remove = [mesh]
    try:
        names = sorted({name for ww in weights for name in ww})
        groups = {name: obj.vertex_groups.new(name=name) for name in names}
        for vi, ww in enumerate(weights):
            for name, weight in ww.items():
                if weight > 1e-8:
                    groups[name].add([vi], weight, 'REPLACE')
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        modifier = obj.modifiers.new('Anatomical_hand_one_subdivision', 'SUBSURF')
        modifier.subdivision_type = 'CATMULL_CLARK'
        modifier.levels = 1
        modifier.render_levels = 1
        modifier.quality = 3
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        if obj.data != mesh:
            meshes_to_remove.append(obj.data)
        result_vertices = [v.co.copy() for v in obj.data.vertices]
        result_faces = [tuple(p.vertices) for p in obj.data.polygons]
        group_names = {g.index: g.name for g in obj.vertex_groups}
        result_weights = []
        for vertex in obj.data.vertices:
            ww = {group_names[g.group]: g.weight for g in vertex.groups if g.weight > 1e-8}
            total = sum(ww.values())
            if total <= 1e-12:
                raise RuntimeError('Subdivision produced an unweighted hand vertex')
            result_weights.append({name: weight/total for name, weight in ww.items()})
        return (result_vertices, result_faces,
                {name:([Vector(p) for p in points],radii) for name,(points,radii) in layout.items()},
                result_weights)
    finally:
        bpy.data.objects.remove(obj, do_unlink=True)
        for temp_mesh in meshes_to_remove:
            if temp_mesh.users == 0:
                bpy.data.meshes.remove(temp_mesh)
