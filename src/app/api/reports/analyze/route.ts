import { supabase } from "@/lib/supabase"; 
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.AICREDITS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is missing in environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { photo, lat, lon } = body;

    if (
      typeof photo !== "string" ||
      !photo.startsWith("data:image/")
    ) {
      return NextResponse.json(
        { error: "A valid image is required." },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.aicredits.in/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: `
You are RoutorrX Vision AI, a friendly and practical pedestrian safety assistant.

Analyze only what is visually observable in the uploaded image.

Return ONLY valid JSON. No Markdown, no code fences, no text outside JSON.

Use this exact structure:

{
  "condition": "A brief 3-5 word description of the overall scene.",
  "observations": [
    {
      "title": "String",
      "description": "String",
      "severity": "high | moderate | low | uncertain"
    }
  ]
}

STRICT RULES:
1. Include up to three observations.
2. Severity must be exactly: high, moderate, low, or uncertain.
3. Never invent hazards, measurements or locations.
4. Never claim a route is completely safe.
5. observations must be an array of objects with "title", "description", and "severity".
`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this photograph for visible pedestrian road hazards."
              },
              {
                type: "image_url",
                image_url: {
                  url: photo,
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API Analysis Error:", {
        status: response.status,
        error: data.error?.message || "Unknown provider error",
      });

      return NextResponse.json(
        {
          error:
            data.error?.message ||
            "Photo analysis is currently unavailable.",
        },
        { status: response.status }
      );
    }

    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText || typeof resultText !== "string") {
      return NextResponse.json(
        { error: "The AI returned an empty analysis." },
        { status: 502 }
      );
    }

    let analysis;
    try {
      // This strips away any markdown code blocks the AI might have added
      const cleanText = resultText.replace(/```(?:json)?/gi, "").trim();
      analysis = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse AI JSON:", resultText);
      return NextResponse.json({ error: "AI format invalid." }, { status: 502 });
    }

    // --- SAVE TO SUPABASE ---
    try {
      const { error: dbError } = await supabase
        .from('road_hazards')
        .insert([
          {
            condition: analysis.condition || 'Unknown condition',
            observations: analysis.observations || [],
            latitude: lat || 0,
            longitude: lon || 0,
            status: 'unverified'
          }
        ]);

      if (dbError) {
        console.error("Failed to save to Supabase:", dbError);
      } else {
        console.log("Hazard successfully saved to database!");
      }
    } catch (err) {
      console.error("Supabase error:", err);
    }
    // -------------------------

    return NextResponse.json({
      observation: analysis,
      provider: "AICredits",
      model: data.model || "gpt-4o-mini",
    });

  } catch (error) {
    console.error("RoutorrX Photo Analysis Error:", error);

    return NextResponse.json(
      { error: "Unable to analyze the photograph. Please try again." },
      { status: 500 }
    );
  }
}