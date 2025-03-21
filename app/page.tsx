"use client";

import * as React from "react";
import { Bot, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Analytics } from "@vercel/analytics/react"

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Simplified markdown styles with better code block colors
const markdownStyles = `
  
`;

export default function MedicalChat() {
  const [messages, setMessages] = React.useState<Message[]>([
    // Initialize with a welcome message
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Hello there! How can I help you with your C++ programming today?",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Add markdown styles to document
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = markdownStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };
  
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
  
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
  
      if (!response.ok) throw new Error("Server error");
  
      const data = await response.json();
      
      // Handle the response format which contains 'output' property
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.output || "Sorry, I couldn't process your request.",
      };
  
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message to the chat
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, there was an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simple code block formatting, keeping the original structure but with cleaner implementation
  const formatCodeBlocks = (content: string) => {
    // Replace triple backtick code blocks with HTML
    const formattedContent = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      return `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    });
    
    // Handle markdown formatting
    return formattedContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/<li>(.*?)<\/li>/g, (match) => {
        return '<ul>' + match + '</ul>';
      })
      .replace(/<ul><\/ul>/g, '')
      .replace(/\n\n/g, '<br/><br/>');
  };

  return (
    <div className="flex flex-col h-screen w-full">
  {/* Header */}
  <div className="flex justify-between items-center p-4 border-b border-secondary/20 bg-secondary/10">
    {/* Left side with bot avatar and text */}
    <div className="flex items-center">
      <Avatar className="h-8 w-8 mr-2">
        <AvatarImage src="/placeholder.svg" />
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="h-5 w-4" />
        </AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-lg font-semibold text-primary">C/C++ Assistant</h1>
        <p className="text-sm text-muted-foreground">
          I&apos;m here to help answer your C/C++ related questions.
        </p>
      </div>
    </div>
    
    {/* Right side with CHARUSAT image */}
    <div className="flex items-center">
      <img 
        src="https://www.charusat.ac.in/_next/static/media/CHARUSAT_NEW.6cad095d.png" 
        alt="CHARUSAT" 
        className="h-12 object-contain"
      />
    </div>
  </div>


      {/* Messages Area - Takes up all available space */}
      <div className="flex-1 overflow-y-auto p-4 bg-background">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("mb-4 flex", message.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {message.role === "assistant" ? (
                  <div 
                    className="markdown-body"
                    dangerouslySetInnerHTML={{ 
                      __html: formatCodeBlocks(message.content)
                    }}
                  />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mb-4 flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-secondary text-secondary-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-secondary/20 bg-background">
        <form onSubmit={sendMessage} className="flex w-full items-center space-x-2 max-w-3xl mx-auto">
          <Input
            placeholder="Type your C/C++ related question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || input.trim().length === 0}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}