export function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Distance in meters
}

// Finds the distance to the end of the current step's geometry
export function getDistanceToNextTurn(
  userLat: number, 
  userLon: number, 
  routeCoords: number[][], 
  currentStepIndex: number,
  totalSteps: number
) {
  // Calculate roughly where the current step ends on the map
  const stepRatio = (currentStepIndex + 1) / totalSteps;
  const targetIndex = Math.floor(routeCoords.length * stepRatio);
  const targetCoord = routeCoords[targetIndex];

  if (!targetCoord) return 9999;

  // Return distance in meters
  return getDistanceFromLatLonInM(userLat, userLon, targetCoord[1], targetCoord[0]);
}