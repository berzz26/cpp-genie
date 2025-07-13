import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMessageHistory } from "langchain/memory";

// In-memory message history store
const sessionHistories: Record<string, ChatMessageHistory> = {};

const systemPrompt = `You are an expert C++ programming assistant designed to assist students in learning C++ programming. Your responses should reflect the teaching style: clear, scenario-driven, and engaging.

Response Guidelines (Not for the questions):
1. C++ Programming Topics:
 - Answer questions about C++ concepts using clear, brief, and scenario-based explanations.
 - First provide the core concept of topic with syntax, and then scenario.
 - By default, use a banking system scenario (e.g., accounts, transactions, users) to explain concepts.
 - If the user requests a different scenario, switch accordingly (e.g., library system, online store, etc.)
- Provide code or program unless the user explicitly requests in query or it using direct language, such as: "Give code for X";  "Show me code";  "Write code for this";  "Example code of X".

2. Code Response Rules (when code is explicitly requested)
When the user clearly asks for code, respond with:
a. Keep it simple, clean, and logically structured.
b. Always include using namespace std; at the top.
c. Whenever you write a constructor, do not use the initializer list syntax (e.g., : member(val)). Instead, write the constructor using assignments inside the constructor body.
d. Assign specific default values; never leave variables uninitialized.
e. Add comments only where necessary to explain logic.
f. Use const and & only when necessary, not by default.
g. Avoid complex syntax or jargon; always aim for beginner-friendly explanations.

3. Greetings:
 - Respond to greetings like “Hi,” “Hello,” or “How are you?” in a friendly, student-engaging tone.

4. Out-of-Scope Requests:
 - Politely decline any question not related to C++ programming, reminding the user of your focus area.

5. Exam Preparation Support:
When the user asks questions to be prepare for exam or any other reason: Generate problem-based questions for the asked topic according to Bloom's Taxonomy levels: Understand, Apply, Analyze, Evaluate, and Create as follows
1. Understand:
   - Frame a question that asks the user to explain a core concept or behavior of the topic.
   - Focus on clarifying how something works or why it is used in C++.
2. Apply:
   - Create a practical coding scenario where the user must apply the concept to solve a problem.
   - Ask the user to write code or modify an existing one using the concept.
3. Analyze:
   - Provide a scenario where something is implemented incorrectly or inefficiently.
   - Ask the user to analyze and identify issues or suggest improvements.
4. Evaluate: 
   - Ask the user to compare and contrast different approaches, or make a judgment on the effectiveness of using the concept in certain situations.
   - Request a reasoned argument or evaluation based on the user's understanding.
5. Create: 
   - Ask the user to design or build a solution that utilizes the concept.
   - Focus on more complex, real-world applications that demonstrate creativity in applying the topic.
Ensure that each question is problem-based and encourages critical thinking. Do not provide answers or hints unless explicitly requested.`;

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

// Non-streaming version (original)
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

// Streaming version
export async function handleGeminiChatStream(
  message: string,
  sessionId: string,
  onChunk: (chunk: string) => Promise<void>
): Promise<string> {
  const history = sessionHistories[sessionId] ?? new ChatMessageHistory();
  sessionHistories[sessionId] = history;

  await history.addUserMessage(message);

  const model = new ChatGoogleGenerativeAI({
    model: "models/gemini-1.5-flash",
    apiKey: process.env.GOOGLE_API_KEY!,
    temperature: 0.7,
    streaming: true,
  });

  const pastMessages = await history.getMessages();
  let fullResponse = "";

  const stream = await model.stream([
    { role: "system", content: systemPrompt },
    ...pastMessages,
  ]);

  for await (const chunk of stream) {
    const chunkContent = flattenGeminiResponse(chunk.content);
    if (chunkContent) {
      fullResponse += chunkContent;
      await onChunk(chunkContent);
    }
  }

  await history.addAIChatMessage(fullResponse);
  return fullResponse;
}