import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabaseClient";
import { handleGeminiChat } from "@/lib/handleGeminiChat";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || !lastMessage.content) {
      throw new Error("Invalid request: No valid message found.");
    }

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

    const assistantResponse = await handleGeminiChat(lastMessage.content, sessionId);

    // Save to Supabase
    const { error: insertError } = await supabase.from("prompts").insert([
      {
        session_id: sessionId,
        prompt: lastMessage.content,
        response: assistantResponse,
        timestamp: new Date().toISOString(),
      },
    ]);
    if (insertError) console.error("Supabase insert error:", insertError);

    return NextResponse.json({ output: assistantResponse });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to get response from assistant" },
      { status: 500 }
    );
  }
}
