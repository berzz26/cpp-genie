import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
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
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: No valid session" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const origin = req.headers.get("origin");
    if (!isValidOrigin(origin)) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Invalid origin" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use user's ID as session ID
    const sessionId = session.user.id;

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || !lastMessage.content) {
      throw new Error("Invalid request: No valid message found.");
    }

    // Check rate limit
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
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
        );
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

    // Update response headers
    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

    return response;
  } catch (error) {
    await writer.close();
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
