import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabaseClient";
import { handleGeminiChat } from "@/lib/handleGeminiChat";
import { rateLimiter } from "@/lib/rateLimiter";
import crypto from "crypto";

export async function POST(req: Request) {
  // Get or create session ID
  const cookieStore = cookies();
  let sessionId = cookieStore.get("sessionId")?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set("sessionId", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });
  }

  // Check rate limit
  if (rateLimiter.isRateLimited(sessionId)) {
    const timeToReset = rateLimiter.getTimeToReset(sessionId);
    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: `Please wait ${Math.ceil(
          timeToReset / 1000
        )} seconds before sending another message.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Reset": String(timeToReset),
        },
      }
    );
  }

  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || !lastMessage.content) {
      throw new Error("Invalid request: No valid message found.");
    }

    const assistantResponse = await handleGeminiChat(
      lastMessage.content,
      sessionId
    );

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
