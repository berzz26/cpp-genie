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

  const origin = req.headers.get('origin');
  if (!isValidOrigin(origin)) {
    writer.close();
    return NextResponse.json({ error: "Forbidden: Invalid origin" }, { status: 403 });
  }

  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || !lastMessage.content) {
    writer.close();
    return NextResponse.json({ error: "Invalid request: No valid message found." }, { status: 400 });
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const sessionCookie = cookieHeader.split(";").find((c) => c.trim().startsWith("sessionId="));
  let sessionId = sessionCookie?.split("=")[1];

  if (!sessionId) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    sessionId = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  if (!checkRateLimit(sessionId)) {
    writer.close();
    return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  let fullResponse = "";

  // Start sending the response immediately
  const response = new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Set-Cookie": `sessionId=${sessionId}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax; Secure`,
    },
  });

  // ⚡ Start async work but don't await it
  (async () => {
    try {
      await handleOpenAIChat(
        lastMessage.content,
        sessionId,
        async (chunk) => {
          fullResponse += chunk;
          await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
        }
      );
    } catch (error) {
      console.error("Error during OpenAI streaming:", error);
    } finally {
      await writer.close();

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
    }
  })();

  return response;
}
