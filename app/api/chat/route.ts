import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { handleOpenAIChat } from "@/lib/handleOpenAIChat";

export const config = {
  runtime: "edge",
};

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

    const cookieHeader = req.headers.get("cookie") || "";
    const sessionCookie = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("sessionId="));
    let sessionId = sessionCookie?.split("=")[1];

    // Generate session ID if not found
    if (!sessionId) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      sessionId = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
    }

    let fullResponse = "";

    const streamResponse = handleOpenAIChat(
      lastMessage.content,
      sessionId,
      async (chunk) => {
        fullResponse += chunk;
        await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
      }
    );

    streamResponse.finally(async () => {
      writer.close();

      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "unknown";

      const { error: insertError } = await supabase.from("prompts").insert([
        {
          session_id: sessionId,
          prompt: lastMessage.content,
          response: fullResponse,
          ip_address: ip,
          timestamp: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
      }
    });

    // Set sessionId cookie in Edge-compatible way
    const response = new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Set-Cookie": `sessionId=${sessionId}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax; Secure`,
      },
    });

    return response;
  } catch (error) {
    await writer.close();
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to get response from assistant" },
      { status: 500 }
    );
  }
}
