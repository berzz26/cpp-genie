import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabaseClient";
import { handleOpenAIChat } from "@/lib/handleOpenAIChat";
import crypto from "crypto";
import { encoding_for_model } from "tiktoken";

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

    // Token encoder for GPT-4o or GPT-3.5 (adjust if needed)
    const encoderModel = encoding_for_model("gpt-4"); // or "gpt-3.5-turbo"
    const inputTokens = encoderModel.encode(lastMessage.content).length;

    // Buffer to collect full streamed response
    let fullResponse = "";
    let outputTokens = 0;

    // Start streaming response
    const streamResponse = handleOpenAIChat(
      lastMessage.content,
      sessionId,
      async (chunk) => {
        fullResponse += chunk;
        outputTokens += encoderModel.encode(chunk).length;
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
          input_tokens: inputTokens,
          output_tokens: outputTokens,
        },
      ]);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
      }

      encoderModel.free(); // Clean up encoder instance
    });

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
