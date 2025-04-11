import { ChatOpenAI } from "@langchain/openai";
import { log } from "console";
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

export async function handleOpenAIChat(
  message: string, 
  sessionId: string,
  onProgress?: (chunk: string) => void
): Promise<string> {
    const history = sessionHistories[sessionId] ?? new ChatMessageHistory();
    sessionHistories[sessionId] = history;

    await history.addUserMessage(message);

    const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        openAIApiKey: process.env.OPENAI_API_KEY!,
        temperature: 0.7,
        streaming: true,
    });

    const pastMessages = await history.getMessages();

    let fullResponse = '';

    const result = await model.call([
        { role: "system", content: systemPrompt },
        ...pastMessages,
    ], {
        callbacks: [
            {
                handleLLMNewToken(token: string) {
                    fullResponse += token;
                    onProgress?.(token);
                },
            },
        ],
    });

    await history.addAIChatMessage(fullResponse);
    return fullResponse;
}
