import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const { data, error } = await supabase
      .from('road_hazards')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format the data so your frontend CommunityFeed understands it
    const items = data.map(item => ({
      id: item.id,
      type: "Road Hazard",
      note: item.condition || "Reported hazard",
      point: { name: "Reported Location", lat: item.latitude, lon: item.longitude },
      created: item.created_at,
      status: "published", 
    }));

    return NextResponse.json({
      items: items,
      nextCursor: null
    });

  } catch (err) {
    console.error("GET Reports Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Keep your existing POST function here if you have one!
export async function POST(request: Request) {
  // If you already have a POST function in this file, don't delete it!
  // Just paste the GET function above it.
}