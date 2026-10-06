import type { LatLng } from "./types";

const EARTH_RADIUS_MILES = 3958.8;
const METERS_PER_MILE = 1609.344;

export function milesToMeters(miles: number): number {
    return miles * METERS_PER_MILE;
}

export function haversineMiles(a: LatLng, b: LatLng): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}
