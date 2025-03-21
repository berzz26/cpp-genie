"use client"

import * as React from "react"
import { Bot, Send, Plus, Loader2 } from "lucide-react"
import { useChat } from "ai/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function MedicalChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error);
    }
  })

  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-secondary/20 to-primary/20 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="border-b border-secondary/20">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg font-semibold text-primary">Medical Assistant</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            I'm here to help answer your medical questions. Remember, always consult with a qualified healthcare
            provider for medical advice.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea ref={scrollAreaRef} className="h-[60vh] p-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="space-y-2 text-center">
                  <Bot className="mx-auto h-12 w-12 text-primary opacity-50" />
                  <p className="text-lg font-medium text-primary">How can I help you today?</p>
                  <p className="text-sm text-muted-foreground">
                    Ask me about symptoms, general health information, or medical terminology.
                  </p>
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn("mb-4 flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t border-secondary/20 p-4">
          <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
            <Button size="icon" variant="outline" className="shrink-0" type="button">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add attachment</span>
            </Button>
            <Input
              placeholder="Type your medical question..."
              value={input}
              onChange={handleInputChange}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || input.trim().length === 0}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}