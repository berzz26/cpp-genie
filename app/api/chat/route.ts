import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { handleOpenAIChat } from "@/lib/handleOpenAIChat";
import { checkRateLimit } from "@/lib/rateLimiter";
import { isValidOrigin } from "@/lib/security";

export const runtime = "edge";

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  try {
    // Origin check
    const origin = req.headers.get("origin");
    if (!isValidOrigin(origin)) {
      return NextResponse.json(
        { error: "Forbidden: Invalid origin" },
        { status: 403 }
      );
    }

    // API Key check
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.CHAT_API_SECRET) {
      return NextResponse.json(
        { error: "Forbidden: Invalid API key" },
        { status: 403 }
      );
    }

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

    if (!sessionId) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      sessionId = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
    }

    if (!checkRateLimit(sessionId)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
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

      console.log("prompt:", lastMessage.content);
      console.log("Data:", fullResponse);
    });

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
