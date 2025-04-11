import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabaseClient";
import { handleOpenAIChat } from "@/lib/handleOpenAIChat";
import crypto from "crypto";

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

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

    // Start streaming response
    const streamResponse = handleOpenAIChat(
      lastMessage.content,
      sessionId,
      async (chunk) => {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
      }
    );

    streamResponse.finally(() => {
      writer.close();
    });

    // Get client IP address
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    // Save to Supabase
    const { error: insertError } = await supabase.from("prompts").insert([
      {
        session_id: sessionId,
        prompt: lastMessage.content,
        response: null, // Response is streamed, so no full response to save
        ip_address: ip, // make sure your DB has this column (type: INET or TEXT)
        timestamp: new Date().toISOString(),
      },
    ]);
    if (insertError) console.error("Supabase insert error:", insertError);

    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    await writer.close();
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to get response from assistant" },
      { status: 500 }
    );
  }
}
