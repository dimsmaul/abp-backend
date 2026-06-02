/**
 * Geofence membership checks.
 */

const EARTH_RADIUS_M = 6_371_000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Haversine distance check.
 */
export function isPointInRadius(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
): boolean {
  const dLat = toRad(centerLat - lat)
  const dLng = toRad(centerLng - lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(centerLat)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = EARTH_RADIUS_M * c
  return distance <= radiusMeters
}

/**
 * Ray-casting point-in-polygon test.
 * Polygon is GeoJSON-style: [[lng, lat], ...].
 */
export function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: number[][],
): boolean {
  if (!Array.isArray(polygon) || polygon.length < 3) return false

  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i] // [lng, lat]
    const [xj, yj] = polygon[j]
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi
    if (intersect) inside = !inside
  }
  return inside
}
