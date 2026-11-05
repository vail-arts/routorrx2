import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.AICREDITS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key missing" }, { status: 500 });
    }

    const body = await request.json();
    const { activity, duration, pinned, reminders } = body;

    const response = await fetch("https://api.aicredits.in/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `
You are RoutorrX AI, a friendly and practical walking coach.
The user will give you their activity preferences, pace, pinned activities, and reminders.
Your job is to give them a short, encouraging recommendation for their day based on their routine.

STRICT RULES:
1. Keep it under 100 words.
2. Be conversational and friendly (Gen Z tone is fine).
3. Suggest ONE specific plan for today (e.g., "Since you pinned 'Morning walk' and 'Jogging session', try doing 15 mins of brisk walking followed by a short jog").
4. Use at most one emoji.
5. Return ONLY plain text. No JSON.
`,
          },
          {
            role: "user",
            content: `My activity: ${activity}. Duration: ${duration} mins. Pinned: ${pinned.join(', ')}. Reminders: ${reminders || 'None'}. Give me a plan for today.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error("AI failed");

    return NextResponse.json({ plan: data.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}