import * as THREE from "three";

const EPS = 1e-6;

function dedupe(points) {
  if (points.length <= 1) return points.slice();

  const out = [points[0].clone()];

  for (let i = 1; i < points.length; i++) {
    if (out[out.length - 1].distanceToSquared(points[i]) > EPS * EPS) {
      out.push(points[i].clone());
    }
  }

  if (
    out.length > 2 &&
    out[0].distanceToSquared(out[out.length - 1]) <= EPS * EPS
  ) {
    out.pop();
  }
  return out;
}

function orderFromSegments(points) {
  const n = points.length;
  if (n % 2 !== 0) return points;

  const key = (v) => `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;

  const neighbors = new Map();

  function addEdge(a, b) {
    const ka = key(a),
      kb = key(b);
    if (!neighbors.has(ka)) neighbors.set(ka, new Set());
    if (!neighbors.has(kb)) neighbors.set(kb, new Set());
    neighbors.get(ka).add(kb);
    neighbors.get(kb).add(ka);
  }

  for (let i = 0; i < n; i += 2) addEdge(points[i], points[i + 1]);

  let startKey = null;
  for (const [k, set] of neighbors.entries()) {
    if (set.size === 1) {
      startKey = k;
      break;
    }
  }
  if (!startKey) startKey = neighbors.keys().next().value;

  const dict = new Map();
  points.forEach((p) => dict.set(key(p), p));

  const ordered = [];
  let prevKey = null;
  let currKey = startKey;
  while (currKey) {
    const currPt = dict.get(currKey);
    ordered.push(currPt.clone());
    const neigh = neighbors.get(currKey);
    let nextKey = null;
    for (const nk of neigh)
      if (nk !== prevKey) {
        nextKey = nk;
        break;
      }
    prevKey = currKey;
    currKey = nextKey;

    if (currKey === startKey) break;
  }
  return ordered;
}

export function extractPolylineFromLineObject(lineObj) {
  const geom = lineObj.geometry;
  const pos = geom.getAttribute("position");
  if (!pos) throw new Error("Line object has no position attribute");

  // Pull raw points
  let pts = [];
  const index = geom.getIndex();
  if (index) {
    for (let i = 0; i < index.count; i++) {
      const ii = index.getX(i);
      pts.push(new THREE.Vector3().fromBufferAttribute(pos, ii));
    }
  } else {
    for (let i = 0; i < pos.count; i++) {
      pts.push(new THREE.Vector3().fromBufferAttribute(pos, i));
    }
  }

  if (geom.drawMode === THREE.Line || lineObj.type === "LineSegments") {
    pts = orderFromSegments(pts);
  }

  pts = pts.map((v) => lineObj.localToWorld(v));
  pts = dedupe(pts);
  return pts;
}

export function smoothPolyline(
  points3,
  { samples = 400, closed = false, tension = 0.5 } = {}
) {
  if (points3.length < 3) return points3.slice();
  const cr = new THREE.CatmullRomCurve3(
    points3,
    closed,
    "centripetal",
    tension
  );
  const out = [];
  for (let i = 0; i <= samples; i++) out.push(cr.getPoint(i / samples));
  return out;
}

export function polyline3Dto2D(
  points3,
  plane = "XZ",
  { flipX = false, flipY = false } = {}
) {
  const map = {
    XZ: (p) => new THREE.Vector2(p.x, p.z),
    XY: (p) => new THREE.Vector2(p.x, p.y),
    YZ: (p) => new THREE.Vector2(p.y, p.z),
  };
  if (!map[plane]) throw new Error("plane must be 'XZ' | 'XY' | 'YZ'");
  const pts2 = points3.map((p) => map[plane](p));
  // Close if needed
  if (pts2.length > 2) {
    const a = pts2[0],
      b = pts2[pts2.length - 1];
    if (a.distanceToSquared(b) > 1e-12) pts2.push(a.clone());
  }
  // Mirror if requested
  if (flipX || flipY) {
    for (const v of pts2) {
      if (flipX) v.x = -v.x;
      if (flipY) v.y = -v.y;
    }
  }
  return pts2;
}

export function shapeFromPoints2D(points2) {
  const shape = new THREE.Shape();
  shape.moveTo(points2[0].x, points2[0].y);
  for (let i = 1; i < points2.length; i++)
    shape.lineTo(points2[i].x, points2[i].y);
  return shape;
}

export function curveFromPolyline3D(
  points3,
  { closed = false, tension = 0.5, resample = 400 } = {}
) {
  // Resample/smooth for better frames
  const pts = smoothPolyline(points3, { samples: resample, closed, tension });
  return new THREE.CatmullRomCurve3(pts, closed, "centripetal", tension);
}

/** Main sweep with anti-chop & orientation controls */
export function sweepProfileAlongPath({
  profileLineObj,
  pathLineObj,
  profilePlane = "XZ",
  // flips help fix "upside-down" (YZ is commonly mirrored)
  flipProfileX = false,
  flipProfileY = false,
  pathClosed = false,
  tension = 0.5,
  steps = 600, // higher = smoother
  resample = 800, // path resample for stable Frenet frames
  material = new THREE.MeshStandardMaterial({
    color: 0xe7e7e7,
    metalness: 0,
    roughness: 0.5,
  }),
}) {
  const profile3D = extractPolylineFromLineObject(profileLineObj);
  console.log(detectPlaneKindFromBBox(profile3D));
  const profile2D = polyline3Dto2D(profile3D, profilePlane, {
    flipX: flipProfileX,
    flipY: flipProfileY,
  });
  const shape = shapeFromPoints2D(profile2D);

  const path3D = extractPolylineFromLineObject(pathLineObj);
  const curve = curveFromPolyline3D(path3D, {
    closed: pathClosed,
    tension,
    resample,
  });

  const geom = new THREE.ExtrudeGeometry(shape, {
    steps,
    bevelEnabled: false,
    extrudePath: curve,
  });
  geom.computeVertexNormals();

  const mesh = new THREE.Mesh(geom, material);
  mesh.name = "sweep";
  return mesh;
}

export function detectPlaneKindFromBBox(points3) {
  const min = new THREE.Vector3(+Infinity, +Infinity, +Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (const p of points3) {
    min.min(p);
    max.max(p);
  }
  const size = new THREE.Vector3().subVectors(max, min);
  // The smallest axis is the normal. Tie-breaker prefers Z as normal for stability.
  if (size.z <= size.x && size.z <= size.y) return "XY"; // normal ~ Z
  if (size.x <= size.y && size.x <= size.z) return "YZ"; // normal ~ X
  return "XZ"; // normal ~ Y
}
