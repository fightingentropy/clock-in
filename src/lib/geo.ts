const EARTH_RADIUS_M = 6371000;

export const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const distanceInMeters = (
  originLat: number,
  originLng: number,
  targetLat: number,
  targetLng: number,
) => {
  const dLat = toRadians(targetLat - originLat);
  const dLng = toRadians(targetLng - originLng);
  const lat1 = toRadians(originLat);
  const lat2 = toRadians(targetLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
};
