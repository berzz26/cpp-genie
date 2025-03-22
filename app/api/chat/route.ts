import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || !lastMessage.content) {
      throw new Error("Invalid request: No valid message found.");
    }

    // Check if sessionId exists in cookies
    let sessionId = cookies().get("sessionId")?.value;

    // If not, generate a new sessionId and set it in cookies
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      cookies().set("sessionId", sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1-day expiration
      });
    }
    const prod_url = "https://aum12606.app.n8n.cloud/webhook/7509a482-a83c-4159-a2f3-4adc1bd77cb5"
    const local_url = "http://localhost:5678/webhook/7509a482-a83c-4159-a2f3-4adc1bd77cb5"

    console.log("Session ID:", sessionId);
    console.log("Sending message to n8n:", lastMessage.content);

    const response = await fetch(local_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: lastMessage.content,
        sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received from n8n:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json({ error: "Failed to get response from assistant" }, { status: 500 });
  }
}
