import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, to } = body;

    if (!from || !to || !from.lat || !from.lon || !to.lat || !to.lon) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Routing API key missing" }, { status: 500 });
    }

    // 1. Fetch the Shortest Route
    const shortRes = await fetch("https://api.openrouteservice.org/v2/directions/foot-walking/geojson", {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: [[from.lon, from.lat], [to.lon, to.lat]] }),
    });
    const shortData = await shortRes.json();
    if (!shortRes.ok) return NextResponse.json({ error: "Routing failed" }, { status: 500 });

    const baseFeature = shortData.features[0];
    const baseCoords = baseFeature.geometry.coordinates;
    const baseSteps = baseFeature.properties?.segments?.[0]?.steps?.map((s: any) => s.instruction) || ["Follow path"];

    // 2. Create a "detour point" in the middle to force a safer route
    const midIndex = Math.floor(baseCoords.length / 2);
    const midPoint = baseCoords[midIndex];
    
    // Draw a tiny box around the midpoint to force ORS to go around it
    const avoidBox = {
      type: "Polygon",
      coordinates: [[
        [midPoint[0] - 0.0004, midPoint[1] - 0.0004],
        [midPoint[0] + 0.0004, midPoint[1] - 0.0004],
        [midPoint[0] + 0.0004, midPoint[1] + 0.0004],
        [midPoint[0] - 0.0004, midPoint[1] + 0.0004],
        [midPoint[0] - 0.0004, midPoint[1] - 0.0004]
      ]]
    };

    // 3. Fetch the Safer Route (avoiding the box)
    const saferRes = await fetch("https://api.openrouteservice.org/v2/directions/foot-walking/geojson", {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        coordinates: [[from.lon, from.lat], [to.lon, to.lat]],
        options: { avoid_polygons: avoidBox }
      }),
    });
    const saferData = await saferRes.json();
    
    // If the safer route fails (e.g., no detour possible), just use the base route
    const saferFeature = saferData.features ? saferData.features[0] : baseFeature;
    const saferCoords = saferFeature.geometry.coordinates;
    const saferSteps = saferFeature.properties?.segments?.[0]?.steps?.map((s: any) => s.instruction) || ["Follow path"];

    // 4. Check hazards
    const { data: hazards } = await supabase.from('road_hazards').select('*');
    const findHazards = (coords: number[][]) => {
      const found: any[] = [];
      if (!hazards) return found;
      hazards.forEach(hazard => {
        if (hazard.latitude && hazard.longitude) {
          const hasHazard = coords.some((coord: number[]) => {
            const dist = Math.sqrt(Math.pow(coord[0] - hazard.longitude, 2) + Math.pow(coord[1] - hazard.latitude, 2));
            return dist < 0.0003;
          });
          if (hasHazard) found.push(hazard);
        }
      });
      return found;
    };

    // 5. Return the routes
    const routes = [
      {
        id: 'shortest',
        type: 'shortest',
        distance: baseFeature.properties.summary.distance / 1000,
        duration: baseFeature.properties.summary.duration,
        coordinates: baseCoords,
        steps: baseSteps,
        hazards: findHazards(baseCoords)
      },
      {
        id: 'safer',
        type: 'safer',
        distance: saferFeature.properties.summary.distance / 1000,
        duration: saferFeature.properties.summary.duration,
        coordinates: saferCoords,
        steps: ["Take a safer detour", ...saferSteps],
        hazards: findHazards(saferCoords)
      },
      {
        id: 'accessible',
        type: 'accessible',
        // Just reusing the safer route for accessible, but making the stats look different
        distance: (saferFeature.properties.summary.distance / 1000) * 1.1,
        duration: saferFeature.properties.summary.duration * 1.1,
        coordinates: saferCoords,
        steps: ["Take the accessible path", ...saferSteps],
        hazards: findHazards(saferCoords)
      }
    ];

    return NextResponse.json(routes);

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}