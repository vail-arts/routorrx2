import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contacts, location } = body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: "No contacts provided" }, { status: 400 });
    }

    const mapLink = location ? `https://www.google.com/maps?q=${location.lat},${location.lon}` : 'Location unavailable';
    const message = `EMERGENCY: I need help. My live location is: ${mapLink}`;

    // 1. LOG THE SOS IN SUPABASE (So you have a record)
    const { error: dbError } = await supabase
      .from('sos_alerts')
      .insert([{ contacts: contacts, location: location, message: message }]);

    if (dbError) {
      console.error("Failed to log SOS:", dbError);
      // We don't return here, because we still want to try sending the SMS
    }

    // 2. SEND THE SMS (Using a mock for now)
    // TODO: Replace this with Twilio or Supabase Edge Function
    console.log(`📡 MOCK SMS SENT TO: ${contacts.join(', ')}`);
    console.log(`💬 MESSAGE: ${message}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      requestId: body.requestId,
      contacts: contacts.map((phone: string) => ({ phone, status: 'delivered' })),
      location: location ? 'included' : 'not_included'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}