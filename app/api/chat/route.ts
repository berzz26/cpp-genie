import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabaseClient";
import { log } from "console";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || !lastMessage.content) {
      throw new Error("Invalid request: No valid message found.");
    }

    // Session ID handling
    let sessionId = cookies().get("sessionId")?.value;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      cookies().set("sessionId", sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      });
    }

    const n8nUrl = process.env.PROD_N8N_URL!;
    console.log("Session ID:", sessionId);
    console.log("Sending message to n8n:", lastMessage.content);

    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: lastMessage.content,
        sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }else{
      
    }

    const data = await response.json();
    const assistantResponse = data.output || "No response";
    console.log("Raw response from n8n:", data);


    // Save to Supabase
    const { error: insertError } = await supabase.from("prompts").insert([
      {
        session_id: sessionId,
        prompt: lastMessage.content,
        response: assistantResponse,
        timestamp: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error("Supabase insert error:", insertError);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to get response from assistant" },
      { status: 500 }
    );
  }
}
