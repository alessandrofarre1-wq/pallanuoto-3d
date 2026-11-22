"""Deriva il GLB runtime conservando il corpo/rig di v0.72 byte per byte nei dati.
Esecuzione: blender -b -t 2 --python strumenti/blender/runtime-mani.py
Mani umane MakeHuman CC0 con LOD, atlante unico e 30 falangi reali.
Nessun asset viene pubblicato se supera i contratti 9042tri/9023vert.
"""
import bpy,sys,json,struct,math,hashlib,importlib.util,subprocess,os,argparse,tempfile
from pathlib import Path
import numpy as np
from mathutils import Vector,Matrix
from mathutils.kdtree import KDTree
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'modelli-sorgente/pallanuotista/v073';OUT.mkdir(parents=True,exist_ok=True)
SOURCE=OUT/'pallanuotista-v072.glb'
DEST=ROOT/'src/grafica/modelli/pallanuotista.glb'
FACTOR=1.932221737/1.800742665
parser=argparse.ArgumentParser()
parser.add_argument('--target-triangles',type=int,default=8400)
parser.add_argument('--hand-triangles',type=int,default=650)
parser.add_argument('--output',type=Path,default=DEST)
parser.add_argument('--report',type=Path,default=OUT/'runtime-mani.json')
parser.add_argument('--atlas',type=Path,default=OUT/'atlante-corpo-mani.png')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]if'--'in sys.argv else[])
DEST=args.output;HAND_TRIANGLES=args.hand_triangles;TARGET_TRIANGLES=args.target_triangles
TMP=Path(tempfile.mkdtemp(prefix='waterpolo-runtime-mani-'))
raw=SOURCE.read_bytes();jslen=struct.unpack_from('<I',raw,12)[0];G=json.loads(raw[20:20+jslen]);B=bytearray(raw[28+jslen:])
DT={5126:'<f4',5123:'<u2',5125:'<u4',5121:'u1'};WIDTH={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def acc(i):
 a=G['accessors'][i];dt=np.dtype(DT[a['componentType']]);c=WIDTH[a['type']]
 if 'bufferView'in a:
  v=G['bufferViews'][a['bufferView']];out=np.ndarray((a['count'],c),dtype=dt,buffer=B,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',dt.itemsize*c),dt.itemsize)).copy()
 else:out=np.zeros((a['count'],c),dtype=dt)
 if 'sparse'in a:
  sp=a['sparse'];ii=sp['indices'];iv=G['bufferViews'][ii['bufferView']];ind=np.frombuffer(B,dtype=DT[ii['componentType']],count=sp['count'],offset=iv.get('byteOffset',0)+ii.get('byteOffset',0));vv=sp['values'];bv=G['bufferViews'][vv['bufferView']];vals=np.frombuffer(B,dtype=dt,count=sp['count']*c,offset=bv.get('byteOffset',0)+vv.get('byteOffset',0)).reshape(-1,c);out[ind]=vals
 return out
def put(a,typ,ctype=5126):
 a=np.asarray(a,dtype=DT[ctype]);B.extend(b'\0'*(-len(B)%4));off=len(B);bb=a.tobytes();B.extend(bb);vi=len(G['bufferViews']);G['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(bb)})
 d={'bufferView':vi,'componentType':ctype,'count':len(a),'type':typ}
 if typ!='MAT4':d.update(min=a.min(0).astype(float).tolist(),max=a.max(0).astype(float).tolist())
 G['accessors'].append(d);return len(G['accessors'])-1
P=G['meshes'][0]['primitives'][0]
A={n:acc(i).astype(float) for n,i in P['attributes'].items()}
M=[{n:acc(i).astype(float) for n,i in t.items()} for t in P['targets']]
faces=acc(P['indices']).astype(int).reshape(-1,3).tolist()
nsource=len(A['POSITION']);oldnodes=json.loads(json.dumps(G['nodes']));skin=G['skins'][0];names=[G['nodes'][j]['name'] for j in skin['joints']]
parents={c:i for i,n in enumerate(G['nodes']) for c in n.get('children',[])}
def world(i):
 n=G['nodes'][i];q=Matrix.Identity(4)
 if 'matrix'in n:q=Matrix(np.array(n['matrix']).reshape(4,4,order='F').tolist())
 else:
  from mathutils import Quaternion
  q=Matrix.LocRotScale(Vector(n.get('translation',[0,0,0])),Quaternion((n.get('rotation',[0,0,0,1])[3],*n.get('rotation',[0,0,0,1])[:3])),Vector(n.get('scale',[1,1,1])))
 return world(parents[i])@q if i in parents else q
nodebyname={n['name']:i for i,n in enumerate(G['nodes']) if 'name'in n}
W=[world(i) for i in range(len(G['nodes']))]
# Vettori originali, morph e maschere rimangono indicizzati senza reimport Blender.
V={n:a.tolist() for n,a in A.items()};MV=[{n:a.tolist() for n,a in m.items()} for m in M]
def weights(i):return {int(j):float(w) for j,w in zip(V['JOINTS_0'][i],V['WEIGHTS_0'][i]) if w>1e-8}
def blendweights(a,b,t):
 d={}
 for src,f in ((weights(a),1-t),(weights(b),t)):
  for j,w in src.items():d[j]=d.get(j,0)+w*f
 return encodeweights(d)
def encodeweights(d):
 ww=sorted(d.items(),key=lambda q:q[1],reverse=True)[:4];total=sum(w for j,w in ww);ww=[(j,w/total)for j,w in ww]
 return [j for j,w in ww]+[0]*(4-len(ww)),[w for j,w in ww]+[0]*(4-len(ww))
def add_intersection(a,b,t):
 j=len(V['POSITION'])
 for n in V:
  if n in ['JOINTS_0','WEIGHTS_0']:continue
  V[n].append(((1-t)*np.array(V[n][a])+t*np.array(V[n][b])).tolist())
 ji,ww=blendweights(a,b,t);V['JOINTS_0'].append(ji);V['WEIGHTS_0'].append(ww)
 for m in MV:
  for n in m:m[n].append(((1-t)*np.array(m[n][a])+t*np.array(m[n][b])).tolist())
 return j
CUT=.755/FACTOR
hand_cut=.770/FACTOR
def clip_faces(fs,side,cut,lower=True):
 result=[];edges={}
 for f in fs:
  out=[]
  for k,b in enumerate(f):
   a=f[k-1];da=side*V['POSITION'][a][0]-cut;db=side*V['POSITION'][b][0]-cut;ia=da<=1e-8 if lower else da>=-1e-8;ib=db<=1e-8 if lower else db>=-1e-8
   if ia!=ib:
    edge=tuple(sorted((a,b)))
    if edge not in edges:edges[edge]=add_intersection(a,b,da/(da-db))
    out.append(edges[edge])
   if ib:out.append(b)
  if len(out)>=3:result.extend([[out[0],out[k],out[k+1]]for k in range(1,len(out)-1)])
 return result
faces=clip_faces(clip_faces(faces,1,CUT),-1,CUT)
bodyfaces=faces.copy()
# Sample authored atlas only; no COLOR_0 material multiplication in runtime.
image=G['images'][G['textures'][G['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']]['source']]
view=G['bufferViews'][image['bufferView']];imgpath=OUT/'colore-originale.png';blob=bytes(B[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]);tmp=TMP/'colore-originale.bin';tmp.write_bytes(blob)
im=bpy.data.images.load(str(tmp),check_existing=False);iw,ih=im.size;pixels=np.flipud(np.asarray(im.pixels[:]).reshape(ih,iw,4)).copy() # glTF UV origin is image top-left
uv=A['TEXCOORD_0'];xy=np.clip((uv*np.array([iw-1,ih-1])).astype(int),0,[iw-1,ih-1]);colors=pixels[xy[:,1],xy[:,0],:3].copy()
# Immagine letta in sRGB nel file; scrittura con colorspace sRGB conserva gli stessi pixel.
donors={};donorcolor={}
for side in [1,-1]:
 ids=np.flatnonzero((A['POSITION'][:,0]*side>.57)&(A['POSITION'][:,0]*side<.72));tree=KDTree(len(ids))
 for i in ids:tree.insert(Vector(A['POSITION'][i]),int(i))
 tree.balance();donors[side]=tree

def sample_color(p,side):
 # Smussa le variazioni dipinte sull'avambraccio prima di estenderle alle dita.
 q=Vector(p);q.x=side*min(abs(q.x),.69)
 hits=donors[side].find_n(q,24);d=np.array([1/(.015+h[2])**2 for h in hits]);c=np.array([colors[h[1]]for h in hits]);return (c*d[:,None]).sum(0)/d.sum()
# Reserve right half of atlas for hand islands. Original body texture occupies left half unchanged.
ATLAS_W=iw*2;ATLAS_H=ih
atlas=np.ones((ATLAS_H,ATLAS_W,4),dtype=np.float32);atlas[:,:iw]=pixels
for side in [1,-1]:
 ids=np.flatnonzero((A['POSITION'][:,0]*side>.65)&(A['POSITION'][:,0]*side<.70));base=np.median(colors[ids],axis=0);x0=iw if side>0 else iw+iw//2;atlas[:,x0:x0+iw//2,:3]=base
# Existing body UV locations mapped to original-image half without resampling pixels.
for q in V['TEXCOORD_0']:q[0]*=.5
spec=importlib.util.spec_from_file_location('mh_hand',str(ROOT/'strumenti/blender/mano-makehuman.py'));mh=importlib.util.module_from_spec(spec);spec.loader.exec_module(mh)
new_bone_contract={};hands_stats={};new_joint_matrices=[];all_hand_faces=[]
def new_bone(name,parent_index,head,tail):
 y=(Vector(tail)-Vector(head)).normalized();z=Vector((0,0,1));z=(z-y*z.dot(y)).normalized();x=y.cross(z).normalized();z=x.cross(y).normalized();wm=Matrix(((x.x,y.x,z.x,head[0]),(x.y,y.y,z.y,head[1]),(x.z,y.z,z.z,head[2]),(0,0,0,1)))
 pm=W[parent_index];lm=pm.inverted()@wm;quat=lm.to_quaternion();idx=len(G['nodes']);G['nodes'].append({'name':name,'translation':list(lm.translation),'rotation':[quat.x,quat.y,quat.z,quat.w]});G['nodes'][parent_index].setdefault('children',[]).append(idx);W.append(wm);parents[idx]=parent_index;nodebyname[name]=idx;skin['joints'].append(idx);names.append(name);new_joint_matrices.append(np.array(wm.inverted()).reshape(4,4).T.reshape(16).tolist());new_bone_contract[name]={'head':list(head),'tail':list(tail),'parent':G['nodes'][parent_index]['name'],'curlLocalAxis':[1,0,0],'restQuaternion':[quat.x,quat.y,quat.z,quat.w]};return idx

def raster_triangle(uvs,cs):
 ps=np.asarray(uvs)*np.array([ATLAS_W-1,ATLAS_H-1]);lo=np.floor(ps.min(0)).astype(int);hi=np.ceil(ps.max(0)).astype(int);lo=np.maximum(lo,0);hi=np.minimum(hi,[ATLAS_W-1,ATLAS_H-1]);
 if np.any(hi<lo):return
 xx,yy=np.meshgrid(np.arange(lo[0],hi[0]+1),np.arange(lo[1],hi[1]+1));den=(ps[1,1]-ps[2,1])*(ps[0,0]-ps[2,0])+(ps[2,0]-ps[1,0])*(ps[0,1]-ps[2,1])
 if abs(den)<1e-10:return
 a=((ps[1,1]-ps[2,1])*(xx-ps[2,0])+(ps[2,0]-ps[1,0])*(yy-ps[2,1]))/den;b=((ps[2,1]-ps[0,1])*(xx-ps[2,0])+(ps[0,0]-ps[2,0])*(yy-ps[2,1]))/den;c=1-a-b;mask=(a>=-.005)&(b>=-.005)&(c>=-.005);out=a[...,None]*cs[0]+b[...,None]*cs[1]+c[...,None]*cs[2];tile=atlas[lo[1]:hi[1]+1,lo[0]:hi[0]+1,:3];tile[mask]=out[mask]

for side,label,short in [(1,'left','l'),(-1,'right','r')]:
 parent=nodebyname['hand_'+short];hp=W[parent].translation;wrist_bl=Vector((hp.x,-hp.z,hp.y))*FACTOR
 hv,hf,layout,hw=mh.make_hand(wrist_bl,side) # authored mesh, one subdivision
 hv=[p/FACTOR for p in hv]
 layout={name:([p/FACTOR for p in ps],rs)for name,(ps,rs)in layout.items()}
 # Add anatomical bones; GLB y-up, +Z forward.
 for finger,(points,radii) in layout.items():
  par=parent
  for k in range(3):
   head=(points[k].x,points[k].z,-points[k].y);tail=(points[k+1].x,points[k+1].z,-points[k+1].y);par=new_bone(label+'Hand'+finger+str(k+1),par,head,tail)
 # Blender only processes the isolated hand; original body is never imported.
 me=bpy.data.meshes.new('MH_runtime_'+short);me.from_pydata([tuple(p)for p in hv],[],hf);me.update();ob=bpy.data.objects.new('MH_runtime_'+short,me);bpy.context.collection.objects.link(ob)
 vg={n:ob.vertex_groups.new(name=n)for n in sorted({n for ww in hw for n in ww})}
 for i,ww in enumerate(hw):
  for n,w in ww.items():vg[n].add([i],w,'REPLACE')
 for p in me.polygons:p.use_smooth=True
 # Authored normal field transferred to decimated mesh for smooth fingertips.
 high_tree=KDTree(len(me.vertices));high_normals=[]
 for v in me.vertices:high_tree.insert(v.co,v.index);high_normals.append(v.normal.copy())
 high_tree.balance();bpy.context.view_layer.objects.active=ob;bpy.ops.object.select_all(action='DESELECT');ob.select_set(True)
 dec=ob.modifiers.new('LOD_runtime','DECIMATE');dec.ratio=HAND_TRIANGLES/(sum(len(f)-2 for f in hf));dec.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=dec.name)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(65),island_margin=.025);bpy.ops.object.mode_set(mode='OBJECT')
 me=ob.data;me.calc_loop_triangles();gn={g.index:g.name for g in ob.vertex_groups};hfaces=[];cache={};start=len(V['POSITION'])
 for tri in me.loop_triangles:
  inds=[];tuv=[];tc=[]
  for li,vi in zip(tri.loops,tri.vertices):
   vert=me.vertices[vi];uv0=me.uv_layers.active.data[li].uv;uu=.5+(0 if side>0 else .25)+uv0.x*.25;vv=.25+(1-uv0.y)*.75
   key=(int(vi),round(uu,7),round(vv,7));co=Vector((vert.co.x,vert.co.z,-vert.co.y))
   if key not in cache:
    ni=len(V['POSITION']);cache[key]=ni;_,near,_=high_tree.find(vert.co);nn=high_normals[near];normal=[nn.x,nn.z,-nn.y]
    wdict={}
    for entry in vert.groups:
     bn=gn[entry.group];bn=bn.replace(label+'ForeArm','lowerarm_'+short).replace(label+'Hand', 'hand_'+short) if bn in [label+'ForeArm',label+'Hand'] else bn
     ji=names.index(bn);wdict[ji]=wdict.get(ji,0)+entry.weight
    ji,wt=encodeweights(wdict)
    vals={'POSITION':list(co),'NORMAL':normal,'TEXCOORD_0':[uu,vv],'JOINTS_0':ji,'WEIGHTS_0':wt,'_SCURO':[0.],'_NUMERO':[0.],'_BOCCA':[0.],'_ZONA':[0.,0.,0.]}
    for n in V:V[n].append(vals[n])
    for m in MV:
     for n in m:m[n].append([0.]*len(m[n][0]))
   inds.append(cache[key]);tuv.append([uu,vv]);tc.append(sample_color(co,side))
  hfaces.append(inds);raster_triangle(tuv,np.asarray(tc))
 hfaces=clip_faces(hfaces,side,hand_cut,lower=False);all_hand_faces+=hfaces;faces+=hfaces
 hands_stats[short]={'sourceTriangles':sum(len(f)-2 for f in hf),'LODtriangles':len(hfaces),'newVertices':len(V['POSITION'])-start}
 bpy.data.objects.remove(ob,do_unlink=True)
 if me.users==0:bpy.data.meshes.remove(me)
# Join authored arm cuff to anatomical hand cuff using a single surface.
from collections import Counter
edge_counts=Counter(tuple(sorted((f[k],f[(k+1)%3])))for f in faces for k in range(3))
ring_members={}
def ring(side,x):
 # UV seams create multiple indices at a single geometric cuff point. They
 # must share BOTH position and skin weights before joining the two cuffs.
 ids={v for edge,count in edge_counts.items()if count==1 for v in edge
      if abs(side*V['POSITION'][v][0]-x)<1e-6}
 if not ids:raise RuntimeError(('empty wrist ring',side,x))
 center=np.mean([V['POSITION'][v]for v in ids],axis=0) # preserve original taper center
 groups={}
 for vi in ids:
  key=tuple(round(c,6)for c in V['POSITION'][vi])
  groups.setdefault(key,[]).append(vi)
 unique=[];max_position_delta=0.;max_weight_delta=0.
 for vertices in groups.values():
  vertices.sort();representative=vertices[0]
  position=np.mean([V['POSITION'][vi]for vi in vertices],axis=0)
  skin_weights={}
  for vi in vertices:
   max_position_delta=max(max_position_delta,float(np.linalg.norm(np.array(V['POSITION'][vi])-position)))
   for ji,ww in weights(vi).items():skin_weights[ji]=skin_weights.get(ji,0.)+ww/len(vertices)
  joints,ws=encodeweights(skin_weights);canonical={ji:ww for ji,ww in zip(joints,ws)if ww>1e-8}
  for vi in vertices:
   old=weights(vi)
   max_weight_delta=max(max_weight_delta,max(abs(old.get(ji,0)-canonical.get(ji,0))for ji in old.keys()|canonical.keys()))
   V['POSITION'][vi]=position.tolist()
   V['JOINTS_0'][vi]=joints.copy();V['WEIGHTS_0'][vi]=ws.copy()
  unique.append(representative);ring_members[representative]=vertices
 unique.sort(key=lambda vi:math.atan2(V['POSITION'][vi][1]-center[1],V['POSITION'][vi][2]-center[2]))
 # Recover the actual closed contour through the UV splits. An angle sort
 # alone hides small concavities in the original generated body cuff.
 representative={vi:canonical for canonical in unique for vi in ring_members[canonical]}
 adjacency={vi:set()for vi in unique}
 for (va,vb),count in edge_counts.items():
  if count!=1 or va not in representative or vb not in representative:continue
  ca,cb=representative[va],representative[vb]
  if ca!=cb:adjacency[ca].add(cb);adjacency[cb].add(ca)
 if any(len(neighbors)!=2 for neighbors in adjacency.values()):
  raise RuntimeError(('wrist contour is not one-manifold',side,x,{vi:len(ns)for vi,ns in adjacency.items()}))
 ordered=[unique[0]];previous=None;current=unique[0]
 while True:
  following=next(vi for vi in adjacency[current]if vi!=previous)
  if following==ordered[0]:break
  if following in ordered:raise RuntimeError('wrist contour contains a secondary loop')
  ordered.append(following);previous,current=current,following
 if len(ordered)!=len(unique):raise RuntimeError('wrist contour is disconnected')
 area=sum(V['POSITION'][a][2]*V['POSITION'][b][1]-V['POSITION'][a][1]*V['POSITION'][b][2]
          for a,b in zip(ordered,ordered[1:]+ordered[:1]))
 if area<0:ordered.reverse()
 unique=ordered
 return unique,center,{'rawUVVertices':len(ids),'geometricVertices':len(unique),
                       'duplicatesUnified':len(ids)-len(unique),
                       'maxPositionCorrectionM':max_position_delta,
                       'maxWeightCorrection':max_weight_delta}
bridge_faces=[];wrist_seams={};legacy_bridge_budget=0;cuff_rings=[]
for side in [1,-1]:
 a,ac,astats=ring(side,CUT);b,bc,bstats=ring(side,hand_cut)
 legacy_bridge_budget+=astats['rawUVVertices']+bstats['rawUVVertices']
 if len(a)<6 or len(b)<6:raise RuntimeError(('wrist boundary',side,len(a),len(b)))
 # Gradual taper over last 8.4 cm of source forearm; keeps original joint positions.
 for vi in {v for f in bodyfaces for v in f}:
  p=np.array(V['POSITION'][vi]);x=side*p[0]
  if not(.615<x<=CUT+1e-7):continue
  angle=math.atan2(p[1]-bc[1],p[2]-bc[2]);cont=sorted([(math.atan2(V['POSITION'][j][1]-bc[1],V['POSITION'][j][2]-bc[2]),np.array(V['POSITION'][j]))for j in b],key=lambda q:q[0]);cont=[(cont[-1][0]-math.tau,cont[-1][1])]+cont+[(cont[0][0]+math.tau,cont[0][1])]
  for (aa,pa),(ab,pb) in zip(cont,cont[1:]):
   if aa<=angle<=ab:target=pa+(pb-pa)*(angle-aa)/(ab-aa);break
  t=(x-.615)/(CUT-.615);t=t*t*(3-2*t);p[1:]+=(target[1:]-p[1:])*t;V['POSITION'][vi]=p.tolist()
 # The original body cuff is slightly concave. Projecting it radially
 # onto the hand cuff can reverse a few consecutive angles and fold the
 # body edge back over itself. Keep the true contour order and apply the
 # smallest monotone angular correction (PAVA), only to this cut ring.
 def theta(vi):
  point=V['POSITION'][vi]
  return math.atan2(point[1]-bc[1],point[2]-bc[2])
 gaps=[(theta(a[(i+1)%len(a)])-theta(a[i]))%math.tau for i in range(len(a))]
 start=(int(np.argmax([gap if gap<math.pi else-1 for gap in gaps]))+1)%len(a)
 a=a[start:]+a[:start]
 actual=np.unwrap([theta(vi)for vi in a]);minimum_gap=.001
 shifted=actual-np.arange(len(a))*minimum_gap;blocks=[]
 for i,value in enumerate(shifted):
  blocks.append([i,i,float(value),1])
  while len(blocks)>1 and blocks[-2][2]>blocks[-1][2]:
   right=blocks.pop();left=blocks.pop();count=left[3]+right[3]
   blocks.append([left[0],right[1],(left[2]*left[3]+right[2]*right[3])/count,count])
 monotone=np.zeros(len(a))
 for lo,hi,value,count in blocks:monotone[lo:hi+1]=value
 monotone+=np.arange(len(a))*minimum_gap
 if monotone[-1]-monotone[0]>=math.tau-minimum_gap:raise RuntimeError('circular wrist contour correction exceeds one turn')
 max_ring_move=0.
 for vi,angle0 in zip(a,monotone):
  angle=(float(angle0)+math.pi)%math.tau-math.pi
  for (aa,pa),(ab,pb) in zip(cont,cont[1:]):
   if aa<=angle<=ab:target=pa+(pb-pa)*(angle-aa)/(ab-aa);break
  point=np.asarray(V['POSITION'][vi]);new_point=np.array([point[0],target[1],target[2]])
  max_ring_move=max(max_ring_move,float(np.linalg.norm(new_point-point)))
  for duplicate in ring_members[vi]:V['POSITION'][duplicate]=new_point.tolist()
 astats['maximumLocalRingCorrectionM']=max_ring_move
 astats['minimumCorrectedAngleGapRad']=float(np.min(np.diff(monotone)))
 # Merge the two actual ANGLE sequences. Advancing by index fraction can
 # connect unrelated angles when UV duplicates or unequal sampling exist,
 # producing overlapping triangles and black slivers when the wrist bends.
 def angle(vi):
  point=V['POSITION'][vi]
  return math.atan2(point[1]-bc[1],point[2]-bc[2])%math.tau
 a=sorted(a,key=angle);b=sorted(b,key=angle)
 ia=ib=0;current_a=a[-1];current_b=b[-1];start=len(bridge_faces)
 min_orientation=1.;min_area=float('inf')
 while ia<len(a)or ib<len(b):
  next_a=angle(a[ia])if ia<len(a)else float('inf')
  next_b=angle(b[ib])if ib<len(b)else float('inf')
  if next_a<=next_b:
   triangle=[current_a,a[ia],current_b];current_a=a[ia];ia+=1
  else:
   triangle=[current_a,b[ib],current_b];current_b=b[ib];ib+=1
  pp=np.asarray([V['POSITION'][vi]for vi in triangle])
  normal=np.cross(pp[1]-pp[0],pp[2]-pp[0]);area=float(np.linalg.norm(normal))
  if area<1e-12:raise RuntimeError(('degenerate angle-zipper triangle',side,triangle))
  radial=pp.mean(0)-bc;radial[0]=0
  orientation=float(np.dot(normal,radial))
  if orientation<0:triangle.reverse();orientation=-orientation
  min_orientation=min(min_orientation,orientation);min_area=min(min_area,area)
  bridge_faces.append(triangle)
 wrist_seams['l'if side>0 else'r']={'bodyRing':astats,'handRing':bstats,
     'bridgeTriangles':len(bridge_faces)-start,'minimumArea2M2':min_area,
     'minimumOutwardDot':min_orientation,'method':'geometric UV deduplication, identical skin, angular sweep'}
 cuff_rings.extend([(side,CUT,a.copy()),(side,hand_cut,b.copy())])
faces+=bridge_faces
# Keep all authored morph vertices and hinge regions. Simplifier changes index list only.
handfaces=all_hand_faces+bridge_faces
body_target=TARGET_TRIANGLES-len(all_hand_faces)-legacy_bridge_budget # retain the previous body LOD budget
locks=np.zeros(len(V['POSITION']),dtype=np.uint8);pos=np.asarray(V['POSITION'])
for m in MV:
 if 'POSITION'in m:locks[np.linalg.norm(np.asarray(m['POSITION']),axis=1)>1e-7]=1
for name in ['lowerarm_l','lowerarm_r','hand_l','hand_r','calf_l','calf_r','foot_l','foot_r','neck_01']:
 p=np.asarray(W[nodebyname[name]].translation);locks[np.linalg.norm(pos-p,axis=1)<.055]=1
locks[np.abs(np.abs(pos[:,0])-CUT)<.003]=1
locks[pos[:,1]<.002]=1
simp_in=TMP/'simplifier-input.json';simp_out=TMP/'simplifier-output.json'
simp_in.write_text(json.dumps({'positions':pos.reshape(-1).tolist(),'normals':np.asarray(V['NORMAL']).reshape(-1).tolist(),'indices':np.asarray(bodyfaces).reshape(-1).tolist(),'locks':locks.tolist(),'target':body_target}))
node_modules=ROOT/'node_modules/meshoptimizer/meshopt_simplifier.js'
if not node_modules.exists():node_modules=Path('/workspace/pallanuoto-v072/node_modules/meshoptimizer/meshopt_simplifier.js')
nodecode="""import fs from 'node:fs';const m=await import(process.argv[1]);const S=m.MeshoptSimplifier;await S.ready;const x=JSON.parse(fs.readFileSync(process.argv[2]));const [i,e]=S.simplifyWithAttributes(new Uint32Array(x.indices),new Float32Array(x.positions),3,new Float32Array(x.normals),3,[.01,.01,.01],new Uint8Array(x.locks),x.target*3,.025,[]);fs.writeFileSync(process.argv[3],JSON.stringify({indices:Array.from(i),error:e}));"""
subprocess.run(['node','--input-type=module','-e',nodecode,str(node_modules),str(simp_in),str(simp_out)],check=True)
simplified=json.loads(simp_out.read_text());faces=np.asarray(simplified['indices']).reshape(-1,3).tolist()+handfaces
# Make cut edges geometrically conforming. Some original UV islands have a
# long boundary segment crossing another ring point; without splitting it,
# angular stitching leaves a T-junction that can open when skinning bends.
# This runs AFTER simplification so every triangle outside the wrist stays
# identical to the previous body LOD.
cuff_edge_splits=[]
for side,plane,ring_vertices in cuff_rings:
 refined=[];splits=0
 for face in faces:
  replacement=None
  for k in range(3):
   va,vb=face[k],face[(k+1)%3];opposite=face[(k+2)%3]
   pa,pb=np.asarray(V['POSITION'][va]),np.asarray(V['POSITION'][vb])
   if max(abs(side*pa[0]-plane),abs(side*pb[0]-plane))>1e-6:continue
   direction=pb-pa;length2=float(direction.dot(direction))
   if length2<1e-16:continue
   middle=[]
   for canonical in ring_vertices:
    point=np.asarray(V['POSITION'][canonical]);t=float((point-pa).dot(direction)/length2)
    if not(1e-6<t<1-1e-6):continue
    if np.linalg.norm(point-(pa+t*direction))<1e-7:middle.append((t,canonical))
   if not middle:continue
   middle.sort();chain=[va]
   for t,canonical in middle:
    vi=add_intersection(va,vb,t)
    V['POSITION'][vi]=V['POSITION'][canonical].copy()
    V['JOINTS_0'][vi]=V['JOINTS_0'][canonical].copy()
    V['WEIGHTS_0'][vi]=V['WEIGHTS_0'][canonical].copy()
    chain.append(vi)
   chain.append(vb)
   replacement=[[a,b,opposite]for a,b in zip(chain,chain[1:])]
   splits+=len(middle);break
  refined.extend(replacement if replacement else[face])
 faces=refined
 cuff_edge_splits.append({'side':side,'planeX':plane,'trianglesAdded':splits})

# Bake the taper and cuff into the SAME atlas. Only the arm transition gets new
# UVs; torso/face/cap still sample their original pixel data in the left half.
forearm_faces=[]
for fi,f in enumerate(faces):
 co=np.asarray([V['POSITION'][i]for i in f]);side=1 if co[:,0].mean()>0 else-1
 if np.min(co[:,0]*side)>.605 and np.max(co[:,0]*side)<hand_cut+.00001:
  forearm_faces.append(fi)
used_elsewhere={i for fi,f in enumerate(faces)if fi not in set(forearm_faces)for i in f}
cache={}
for fi in forearm_faces:
 face=faces[fi];side=1 if np.mean([V['POSITION'][i][0]for i in face])>0 else-1
 center=np.mean([V['POSITION'][i]for i in face],axis=0)
 par=nodebyname['hand_'+('l'if side>0 else'r')];hp=np.asarray(W[par].translation)
 angles=[math.atan2(V['POSITION'][i][1]-hp[1],V['POSITION'][i][2]-hp[2])for i in face]
 if max(angles)-min(angles)>math.pi:angles=[a+math.tau if a<0 else a for a in angles]
 newface=[];uvs=[];cols=[]
 for vi,angle in zip(face,angles):
  co=np.asarray(V['POSITION'][vi]);t=np.clip((abs(co[0])-.605)/(hand_cut-.605),0,1)
  uvnew=[.5+(0 if side>0 else.25)+.25*t,.25*(angle+math.pi)/(math.tau)]
  uvnew[1]=np.clip(uvnew[1],0,.25)
  key=(vi,round(uvnew[0],7),round(uvnew[1],7))
  if key not in cache:
   ni=len(V['POSITION'])
   for name in V:V[name].append(V[name][vi].copy())
   for m in MV:
    for name in m:m[name].append(m[name][vi].copy())
   V['TEXCOORD_0'][ni]=uvnew;cache[key]=ni
  newface.append(cache[key]);uvs.append(uvnew)
  olduv=np.asarray(V['TEXCOORD_0'][vi])*np.array([2,1]);ox=int(np.clip(olduv[0]*(iw-1),0,iw-1));oy=int(np.clip(olduv[1]*(ih-1),0,ih-1));oldcol=pixels[oy,ox,:3]
  fade=np.clip((abs(co[0])-.610)/.045,0,1);fade=fade*fade*(3-2*fade)
  cols.append(oldcol*(1-fade)+sample_color(co,side)*fade)
 faces[fi]=newface;raster_triangle(uvs,np.asarray(cols))
# Smooth only the altered arm surface across UV seams; preserve the authored
# face/torso NORMAL fields and the detailed high-hand normal field.
normal_acc={}
for face in faces:
 co=np.asarray([V['POSITION'][i]for i in face]);nn=np.cross(co[1]-co[0],co[2]-co[0])
 for vi in face:
  key=tuple(round(q,6)for q in V['POSITION'][vi]);normal_acc[key]=normal_acc.get(key,np.zeros(3))+nn
for vi,p0 in enumerate(V['POSITION']):
 x=abs(p0[0])
 if not(.615<x<hand_cut+.008):continue
 key=tuple(round(q,6)for q in p0);nn=normal_acc.get(key,np.zeros(3));length=np.linalg.norm(nn)
 if length<1e-10:continue
 nn/=length;old=np.asarray(V['NORMAL'][vi]);w=np.clip((x-.615)/.025,0,1)
 if x>hand_cut:w*=np.clip(1-(x-hand_cut)/.008,0,1)
 nn=old*(1-w)+nn*w;nn/=max(1e-10,np.linalg.norm(nn));V['NORMAL'][vi]=nn.tolist()
# UV splits can put two distinct indices at the same cuff point. Their
# zero-area zipper triangles carry no surface and must not reach the GPU.
zero_area_removed=0;valid_faces=[]
for face in faces:
 pp=np.asarray([V['POSITION'][i]for i in face])
 if np.linalg.norm(np.cross(pp[1]-pp[0],pp[2]-pp[0]))<1e-12:
  zero_area_removed+=1
 else:valid_faces.append(face)
faces=valid_faces
used=sorted({i for f in faces for i in f});mapping={old:new for new,old in enumerate(used)}
F=np.asarray([[mapping[i]for i in f]for f in faces],dtype=np.uint16)
AV={n:np.asarray(v)[used]for n,v in V.items()};MM=[{n:np.asarray(v)[used]for n,v in m.items()}for m in MV]
assert len(F)<=9042,('tri budget',len(F));assert len(used)<=9023,('vertex budget',len(used));assert len(G['meshes'])==1
# Extend inverse bind matrices, retaining original 24 matrices exactly.
ibm=acc(skin['inverseBindMatrices']);skin['inverseBindMatrices']=put(np.vstack([ibm,np.asarray(new_joint_matrices)]),'MAT4')
# New palm markers on the surface, old 24 rest heads and nodes remain unchanged.
markers={}
for side,short in [(1,'l'),(-1,'r')]:
 hp=np.asarray(W[nodebyname['hand_'+short]].translation);target=hp+np.array([side*.060,0,0]);verts=AV['POSITION'];near=verts[(verts[:,0]*side>hp[0]*side+.03)&(verts[:,0]*side<hp[0]*side+.08)&(np.abs(verts[:,1]-target[1])<.018)]
 assert len(near)>4;hits=[]
 for tri in F:
  pp=verts[tri];aa,bb,cc=pp[:,:2];q=target[:2];den=(bb[1]-cc[1])*(aa[0]-cc[0])+(cc[0]-bb[0])*(aa[1]-cc[1])
  if abs(den)<1e-12:continue
  u=((bb[1]-cc[1])*(q[0]-cc[0])+(cc[0]-bb[0])*(q[1]-cc[1]))/den;v=((cc[1]-aa[1])*(q[0]-cc[0])+(aa[0]-cc[0])*(q[1]-cc[1]))/den;w=1-u-v
  if min(u,v,w)>=-1e-7:hits.append(u*pp[0,2]+v*pp[1,2]+w*pp[2,2])
 assert len(hits)>=2,('palm ray has no skin volume',short,target.tolist(),hits)
 surface=float(max(hits));point=np.array([target[0],target[1],surface+.003]);par=nodebyname['hand_'+short];relative=point-np.asarray(W[par].translation);node={'name':'palmo_'+short,'translation':relative.tolist()};G['nodes'][par]['children'].append(len(G['nodes']));G['nodes'].append(node);markers[short]={'node':node['name'],'world':point.tolist(),'surfaceZ':surface,'distanceFromSurface':.003,'normal':[0,0,1]}
P['attributes']={n:put(a,'SCALAR'if a.shape[1]==1 else'VEC'+str(a.shape[1]),5121 if n=='JOINTS_0' else 5126)for n,a in AV.items()}
P['indices']=put(F.reshape(-1,1),'SCALAR',5123);P['targets']=[{n:put(a,'VEC3')for n,a in m.items()}for m in MM]
# Atlas is embedded once; one primitive and one material remain.
tex=bpy.data.images.new('Atlante_corpo_mani_runtime',width=ATLAS_W,height=ATLAS_H,alpha=False);tex.pixels.foreach_set(np.flipud(atlas).reshape(-1));tex.filepath_raw=str(args.atlas);tex.file_format='PNG';tex.save();imagebytes=args.atlas.read_bytes();B.extend(b'\0'*(-len(B)%4));vi=len(G['bufferViews']);G['bufferViews'].append({'buffer':0,'byteOffset':len(B),'byteLength':len(imagebytes)});B.extend(imagebytes);G['images']=[{'name':'Atlante_corpo_mani_runtime','mimeType':'image/png','bufferView':vi}];G['textures']=[{'source':0,'sampler':G['textures'][0].get('sampler',0)}];G['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']=0
# Verify original rest fields (children list only grows) and facial morph deltas.
for i,n in enumerate(oldnodes):
 for k in ['translation','rotation','scale','matrix']:assert G['nodes'][i].get(k)==n.get(k),(i,k)
for m0,m1 in zip(M,MM):
 for n in m0:
  for j,old in enumerate(used):
   if old<nsource:assert np.array_equal(m1[n][j],m0[n][old])
G['buffers'][0]['byteLength']=len(B);B.extend(b'\0'*(-len(B)%4));j=json.dumps(G,separators=(',',':')).encode();j+=b' '*(-len(j)%4);final=struct.pack('<III',0x46546c67,2,28+len(j)+len(B))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(B),0x004e4942)+B
DEST.write_bytes(final)
report={'sourceSha256':hashlib.sha256(raw).hexdigest(),'sha256':hashlib.sha256(final).hexdigest(),'triangles':len(F),'vertices':len(used),'primitives':1,'materials':1,'skinJoints':len(skin['joints']),'original24RestFieldsExact':True,'facialMorphsPreserved':len(M),'shaderMasksPreserved':['_ZONA','_SCURO','_BOCCA','_NUMERO'],'forearmBakedFaces':len(forearm_faces),'bodyTriangles':len(simplified['indices'])//3,'bodySimplificationError':simplified['error'],'handTriangles':hands_stats,'bridgeTrianglesBeforeDegenerateFilter':len(bridge_faces),'zeroAreaTrianglesRemoved':zero_area_removed,'wristSeams':wrist_seams,'conformingCuffEdgeSplits':cuff_edge_splits,'bounds':[AV['POSITION'].min(0).tolist(),AV['POSITION'].max(0).tolist()],'markers':markers,'newBones':new_bone_contract,'atlas':[ATLAS_W,ATLAS_H]}
args.report.write_text(json.dumps(report,indent=2));print('RUNTIME_ASSET_DONE',json.dumps({n:report[n]for n in ['triangles','vertices','skinJoints','sha256','bounds','markers']}))
