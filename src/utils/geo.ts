import { GeoPoint } from '../types';

/**
 * Calculates distance between two coordinates in meters using the Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates initial bearing between two coordinates in degrees (0-360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
}

/**
 * Formats pace in seconds per km to standard min'sec" string e.g. "6'45\""
 */
export function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm || !isFinite(secondsPerKm) || secondsPerKm > 3600 || secondsPerKm <= 0) {
    return "--'--\"";
  }
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}'${secs.toString().padStart(2, '0')}"`;
}

/**
 * Formats duration in seconds to "HH:MM:SS" or "MM:SS"
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats distance in meters to KM with 2 decimal places e.g. "4.25 km"
 */
export function formatDistanceKm(meters: number): string {
  return (meters / 1000).toFixed(2);
}

/**
 * Formats navigation distance (e.g. 250m or 3.4km)
 */
export function formatNavDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Calculate estimated calories burned for brisk walking
 * MET for brisk walk (4.5 to 5.0 METs)
 * Calories = MET * Weight(kg) * Duration(hours)
 */
export function calculateWalkCalories(
  weightKg: number,
  durationSeconds: number,
  distanceMeters: number
): number {
  if (durationSeconds <= 0 || distanceMeters <= 0) return 0;
  const speedKmh = (distanceMeters / 1000) / (durationSeconds / 3600);
  
  // Dynamic MET scaling based on actual briskwalk speed
  let met = 3.5; // slow walk
  if (speedKmh >= 4.0 && speedKmh < 5.0) met = 4.3; // standard brisk walk
  else if (speedKmh >= 5.0 && speedKmh < 6.0) met = 4.8; // power walk
  else if (speedKmh >= 6.0 && speedKmh < 7.5) met = 5.5; // very fast brisk walk
  else if (speedKmh >= 7.5) met = 7.0; // jog

  const hours = durationSeconds / 3600;
  return Math.round(met * weightKg * hours);
}

/**
 * Estimate steps taken from distance (avg step length ~0.75m for brisk walking)
 */
export function estimateSteps(distanceMeters: number): number {
  const avgStepLengthMeters = 0.76;
  return Math.round(distanceMeters / avgStepLengthMeters);
}

/**
 * Export track points to GPX XML format
 */
export function generateGPX(points: GeoPoint[], sessionName: string): string {
  const trkpts = points
    .map(
      (p) =>
        `    <trkpt lat="${p.latitude}" lon="${p.longitude}">
      <time>${new Date(p.timestamp).toISOString()}</time>
      ${p.altitude ? `<ele>${p.altitude}</ele>` : ''}
    </trkpt>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="APEX OS" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${sessionName}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}
