
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const question =
      body.question ||
      body.prompt ||
      "Explain this walking route step by step.";

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return NextResponse.json(
        { error: "A valid question is required." },
        { status: 400 }
      );
    }

    // Extract the actual route sent by RouteAssistant
    const route = body.route;

    if (!route || typeof route !== "object") {
      return NextResponse.json(
        { error: "Please select a walking route first." },
        { status: 400 }
      );
    }

    const routeData = {
      distance: route.distance,
      duration: route.duration,
      steps: Array.isArray(route.steps)
        ? route.steps
            .filter((step: unknown) => typeof step === "string")
            .slice(0, 30)
        : [],
    };

    const openai = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      timeout: 30000,
      maxRetries: 1,
    });

    const completion = await openai.chat.completions.create({
      model: "openrouter/free",
      messages: [
        {
          role: "system",
          content: `
You are routorrX AI, a friendly, intelligent pedestrian navigation and safety companion.
PERSONALITY:
• Speak naturally, like a helpful Gen Z friend.
• Use light slang such as "Got you", "Heads up", "Yo", and "No worries".
• Be friendly, confident, and practical.
• Avoid robotic or overly formal responses.
• Use emojis sparingly and only when appropriate.
• Never force slang into every sentence.
RESPONSE STRUCTURE:
1. Acknowledge the user's request naturally.
2. Give the most useful answer immediately.
3. Explain relevant route conditions, distances, weather, or risks.
4. Recommend one clear next action.
5. Keep most responses between 20 and 60 words.
NAVIGATION:
• Prioritize pedestrian safety, accessibility, and comfort.
• Compare route options using available verified data.
• Mention distance, estimated walking time, and relevant conditions when available.
• Clearly distinguish verified information from estimates.
• Never invent live locations, road conditions, shop availability, or safety scores.
• Never guarantee that a route is safe.
SAFETY:
• Switch to calm, clear, serious language during emergencies.
• Avoid slang, jokes, and unnecessary emojis in dangerous situations.
• Offer emergency calling, trusted-contact sharing, and SOS actions when supported.
• Never claim an emergency alert was sent unless the system confirms it.
• Respect user privacy and location permissions.
STYLE:
• Short sentences.
• Simple English.
• Useful, actionable information.
• Minimal filler.
• Friendly but never childish.
Your goal is to make walking feel easier, more informed, and more comfortable through practical, trustworthy assistance.
`,
        },
        {
          role: "user",
          content: `
USER QUESTION:
${question.trim()}

SELECTED WALKING ROUTE:
${JSON.stringify(routeData, null, 2)}

Explain this exact route using the supplied information.
          `,
        },
      ],
    });

    const answer = completion.choices[0]?.message?.content;

    if (!answer || typeof answer !== "string") {
      return NextResponse.json(
        { error: "The AI provider returned an empty response." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      answer,
      provider: "OpenRouter",
      model: completion.model,
    });

  } catch (error: unknown) {
    console.error("RoutorrX Assistant Error:", error);

    const status =
      error instanceof OpenAI.APIError && error.status
        ? error.status
        : 500;

    return NextResponse.json(
      {
        error:
          status === 429
            ? "AI request limit reached. Please try again later."
            : status === 402
              ? "AI provider requires credits or has a balance issue."
              : status === 503
                ? "AI models are temporarily unavailable."
                : "Unable to generate a response. Please try again.",
      },
      { status: status >= 400 && status <= 599 ? status : 500 }
    );
  }
}
