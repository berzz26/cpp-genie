import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMessageHistory } from "langchain/memory";

// In-memory message history store
const sessionHistories: Record<string, ChatMessageHistory> = {};


const systemPrompt = `You are an expert C++ programming assistant. Your task is to provide accurate, concise, and helpful answers related to C++ programming. Your responses should be limited to the following:

C++ Programming Topics – Answer questions about C++ concepts and related programming topics in a clear and concise manner.
Greetings – Respond to greetings like "Hi," "Hello," or "How are you?" in a friendly and professional way.
Out-of-Scope Requests – If a question is unrelated to C++ programming, politely decline and remind the user that you are a C++ programming assistant.

Whenever you provide a code in response to a user's question, follow these guidelines while generating a code compulsory:
Code Structure: Write clean, well-structured, and logically organized code.
Using namespace std;: Include using namespace std; at the beginning to keep the code readable.
Constructors: Use assignment (=) inside the constructor to assign the value to the variables, instead of member initializer lists (:).
Variable Values: Assume specific values for variables in the code instead of leaving them null or unknown as values, even in default constructor.
Beginner-Friendly Approach: Avoid unnecessary jargon or complex syntax; keep it understandable.
Comments for Clarity: Include comments where necessary to explain key parts of the code.`;


function flattenGeminiResponse(content: any): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content.map(flattenGeminiResponse).join("\n");
  }

  if (content?.parts) {
    return content.parts.map((p: any) => {
      if (typeof p === "string") return p;
      if (p?.text) return p.text;
      return "";
    }).join("\n");
  }

  return JSON.stringify(content);
}


export async function handleGeminiChat(message: string, sessionId: string): Promise<string> {
  const history = sessionHistories[sessionId] ?? new ChatMessageHistory();
  sessionHistories[sessionId] = history;

  await history.addUserMessage(message);

  const model = new ChatGoogleGenerativeAI({
    model: "models/gemini-1.5-flash",
    apiKey: process.env.GOOGLE_API_KEY!,
    temperature: 0.7,
  });

  const pastMessages = await history.getMessages();

  const result = await model.call([
    { role: "system", content: systemPrompt },
    ...pastMessages,
  ]);

  const assistantResponse = flattenGeminiResponse(result.content);
  await history.addAIChatMessage(assistantResponse);

  return assistantResponse;
}
