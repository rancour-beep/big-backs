import * as THREE from "three";
export const ROAD_WIDTH = 18,
  TAU = Math.PI * 2,
  SAMPLE_COUNT = 360;
export function routePoint(t) {
  const a = t * TAU,
    r =
      170 + 32 * Math.sin(a * 2) + 22 * Math.sin(a * 3) + 12 * Math.sin(a * 5);
  return new THREE.Vector3(
    Math.sin(a) * r,
    5 * Math.sin(a * 1.5) ** 2 + 3 * Math.sin(a * 3) ** 2,
    Math.cos(a) * r,
  );
}
export function routeFrame(t) {
  const p = routePoint(t),
    tangent = routePoint(t + 0.0001)
      .sub(routePoint(t - 0.0001))
      .normalize(),
    normal = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
  return { p, tangent, normal, angle: Math.atan2(tangent.x, tangent.z) };
}
export const ROUTE = Array.from({ length: SAMPLE_COUNT + 1 }, (_, i) =>
  routePoint(i / SAMPLE_COUNT),
);
export const ROUTE_LENGTH = ROUTE.slice(1).reduce(
  (s, p, i) => s + p.distanceTo(ROUTE[i]),
  0,
);
// Shared projection keeps physics, opponents, timing and the minimap on one road.
export function projectRoute(pos) {
  let best = Infinity,
    result;
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const a = ROUTE[i],
      b = ROUTE[i + 1],
      dx = b.x - a.x,
      dz = b.z - a.z,
      u = Math.max(
        0,
        Math.min(
          1,
          ((pos.x - a.x) * dx + (pos.z - a.z) * dz) / (dx * dx + dz * dz),
        ),
      ),
      x = a.x + u * dx,
      z = a.z + u * dz,
      dist = (pos.x - x) ** 2 + (pos.z - z) ** 2;
    if (dist < best) {
      best = dist;
      const length = Math.hypot(dx, dz);
      result = {
        t: (i + u) / SAMPLE_COUNT,
        x,
        z,
        y: a.y + u * (b.y - a.y),
        nx: dz / length,
        nz: -dx / length,
        angle: Math.atan2(dx, dz),
      };
    }
  }
  result.offset =
    (pos.x - result.x) * result.nx + (pos.z - result.z) * result.nz;
  result.distance = Math.sqrt(best);
  return result;
}
