"use client";

import * as React from "react";
import { Bot, Send, Loader2, User, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import Link from 'next/link';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/supabaseClient';
import { signInWithGoogle, signOut } from '@/lib/auth';
import { useSupabase } from './supabase-provider';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Enhanced markdown styles with better overflow handling
const markdownStyles = `
  .markdown-body {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .markdown-body pre {
    background-color: #f0f0f0;
    padding: 10px;
    border-radius: 5px;
    overflow-x: auto;
    border: 1px solid #e0e0e0;
    margin: 8px 0;
    max-width: 100%;
  }
  .markdown-body code {
    font-family: monospace;
    background-color: #e8e8e8;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    word-break: break-word;
  }
  .markdown-body pre code {
    background-color: transparent;
    padding: 0;
    border: none;
    display: block;
    width: 100%;
    white-space: pre-wrap;
  }
  .markdown-body strong { font-weight: bold; }
  .markdown-body em { font-style: italic; }
  .markdown-body ul { list-style-type: disc; margin-left: 25px; margin-top: 8px; margin-bottom: 8px; }
  .markdown-body li { margin-bottom: 4px; }
  .markdown-body p { margin-bottom: 8px; }
  .markdown-body img { max-width: 100%; height: auto; }
  .katex-display {
    overflow-x: auto;
    overflow-y: hidden;
    padding: 5px 0;
  }
  .katex {
    font-size: 1.1em;
  }
`;

export default function CppGenieChatSplit() {
  const { supabase, session } = useSupabase();
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Hello there! I am C++ Genie. How can I help you with your C++ programming today?",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [user, setUser] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

  // Add utility function to detect mobile
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  };

  const smoothScrollToBottom = (force: boolean = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: isMobile() || force ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };

  const adjustTextAreaHeight = () => {
    const textarea = textAreaRef.current;
    if (textarea) {
      if (!input.trim()) {
        textarea.style.height = '44px';  // Reset to initial height
        return;
      }
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max height of 200px
      textarea.style.height = `${newHeight}px`;
    }
  };

  const resetTextArea = () => {
    const textarea = textAreaRef.current;
    if (textarea) {
      textarea.style.height = '44px';
    }
  };

  React.useEffect(() => {
    adjustTextAreaHeight();
  }, [input]);

  React.useEffect(() => {
    // Initialize textarea height on mount
    const textarea = textAreaRef.current;
    if (textarea) {
      textarea.style.height = '44px';  // Initial height including padding
    }
  }, []);

  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = markdownStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Replace existing scroll effect
  React.useEffect(() => {
    const scrollTimeout = setTimeout(() => {
      if (isMobile()) {
        smoothScrollToBottom(true);
      } else {
        smoothScrollToBottom();
      }
    }, isMobile() ? 100 : 0);

    return () => clearTimeout(scrollTimeout);
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    resetTextArea();
    setIsLoading(true);

    const responseMessageId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: responseMessageId,
        role: "assistant",
        content: "",
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        // Remove the last two messages (user message and empty assistant message)
        setMessages(messages => messages.slice(0, -2));

        if (response.status === 429) {
          setMessages(messages => [...messages, {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Rate limit exceeded (15 questions/minute). Please try again after a minute.",
          }]);
        } else {
          const error = await response.json();
          throw new Error(error.message || `Server error: ${response.statusText}`);
        }
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === responseMessageId
                    ? { ...msg, content: msg.content + (data.chunk || '') }
                    : msg
                )
              );
              // Add smooth scroll for mobile during streaming
              if (isMobile()) {
                setTimeout(() => smoothScrollToBottom(true), 50);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `*Error: ${error instanceof Error ? error.message : "Could not process request."}*`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCodeBlocks = (content: string) => {
    // Process LaTeX expressions first
    content = content.replace(/\\\((.*?)\\\)/g, (match, latex) => {
      try {
        return katex.renderToString(latex, { throwOnError: false });
      } catch (e) {
        console.error('KaTeX error:', e);
        return match;
      }
    });

    content = content.replace(/\\\[(.*?)\\\]/g, (match, latex) => {
      try {
        return katex.renderToString(latex, {
          displayMode: true,
          throwOnError: false
        });
      } catch (e) {
        console.error('KaTeX error:', e);
        return match;
      }
    });

    const formattedContent = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      // Replace multiplication operators with HTML entities in code blocks
      const processedCode = code.replace(/\*/g, '&ast;');
      return `<pre><code class="language-${language || 'text'}">${processedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    });

    return formattedContent
      .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold my-2">$1</h3>')
      .replace(/^#### (.*?)$/gm, '<h4 class="text-base font-semibold my-2">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/<li>(.*?)<\/li>/g, (match) => {
        return '<ul>' + match + '</ul>';
      })
      .replace(/<ul><\/ul>/g, '')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  const SidebarContent = () => {
    return (
      <div className="flex flex-col w-full">
        {/* Top Content */}
        <div className="overflow-y-auto">
          {/* Genie Logo */}
          <div className="flex justify-center items-center">
            <img
              src="/genie_logo.gif"
              alt="Genie Logo"
              className="h-20 w-auto object-contain"
            />
          </div>

          {/* Text Content */}
          <div className="text-base lg:text-base text-muted-foreground space-y-1 text-center px-2 mb-6">
            <p>
              Just Wish and Learn C++ 24x7 <br />
              It's your class in a bot!
            </p>
          </div>

          {/* Features */}
          <div className="text-left px-2">
            <p className="text-base lg:text-base font-semibold mb-2">Features:</p>
            <ul className="list-disc text-sm lg:text-sm text-muted-foreground space-y-2 pl-5">
              <li>
                <strong>Lecture & syllabus Aligned: </strong> Genie focuses on simple, lecture and syllabus-aligned responses tailored specifically for CEUC102 – Programming with C++ and classroom learning experience.

              </li>
              <li>
                <strong>Practice Questions:</strong> Helps practicing problem-based questions across Bloom’s Taxonomy levels – Understand, Apply, Analyze, Evaluate, and Create. Great for practice, self-assessment, and concept clarity.

              </li>
              <li>
                <strong>Why Genie?</strong>: Genie focuses on simple, lecture and syllabus-aligned responses tailored specifically for CEUC102 – Programming with C++ and classroom learning experience.
              </li>
              <li>
                <strong>Student-Centric:</strong> Made for students, not general users.
              </li>
              <li>
                <strong>C++ Only:</strong> Focused only on C++ – No confusion/distraction!
              </li>
              <li>
                <strong>Context driven and memory enabled:</strong>Genie can remember what you asked, ensuring a seamless and personalized experience.

              </li>
              <li>
                <strong>Guardrails:</strong>  Safe, Unbiased, prevent misleading or harmful content.

              </li>
              <li>
                <strong>Free to use</strong>  Unlimited access anytime, anywhere.

              </li>
            </ul>

          </div>
          <div className="flex justify-left w-full">
            <Link
              href="/features"
              className="text-blue-500 hover:underline px-4 pt-2 inline-block"
            >
              <strong>Explore more about features</strong>
            </Link>
          </div>

          {/* What Genie Can Do */}
          <div className="text-left px-2">
            <p className="text-base lg:text-base font-semibold mt-4 mb-2">What C++ Genie Can Do:</p>
            <ul className="list-disc text-sm lg:text-sm text-muted-foreground space-y-2 pl-5 mb-6">
              <li>Answers query of your C++ concepts.</li>
              <li>Helps in understanding problem-based questions.</li>
              <li>Provides code examples & explanations.</li>
              <li>Debugs your C++ code.</li>
              <li>Explains errors in code.</li>
            </ul>
          </div>
        </div>

        {/* Footer Content - No longer fixed */}
        <div className="flex-shrink-0  border-t border-secondary/20">
          {/* Developer Info */}
          {/* <div className="text-muted-foreground text-left mb-2">
            <p>
              <Link
                href="/contact"
                className="text-blue-500 hover:underline text-base font-medium py-1 px-2 inline-block"
              >
                <strong><i>Contact Us</i></strong>
              </Link>
            </p>
          </div> */}

          {/* Bottom Logos */}
          <div className="flex justify-center items-center gap-2 w-full">
            <img
              src="https://www.charusat.ac.in/_next/static/media/CHARUSAT_NEW.6cad095d.png"
              alt="Charusat Logo"
              className="h-8 w-auto object-contain"
            />
            <img
              src="/depstar_logo.jpg"
              alt="DEPSTAR Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
          {/* Copyright */}
          <div className="text-center text-xs text-muted-foreground mt-4">
            © 2025 C++ Genie, CHARUSAT. All rights reserved.
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Update AuthButtons to use session
  const AuthButtons = () => (
    <div className="flex items-center gap-2">
      {session ? (
        <>
          <span className="text-sm">{session.user.email}</span>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            Sign Out
          </Button>
        </>
      ) : (
        <Button onClick={handleSignIn} variant="outline" size="sm">
          Sign in with Google
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <div className="flex flex-col lg:flex-row h-full w-full">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-1/4 flex-shrink-0 border-r border-secondary/20 p-6 flex-col space-y-4 bg-secondary/5 overflow-y-auto">
          <SidebarContent />
        </div>

        {/* Right Chat Panel */}
        <div className="flex-1 flex flex-col h-full min-w-0"> {/* Added min-w-0 */}
          {/* Chat Header */}
          <div className="p-3 border-b border-secondary/20 flex items-center justify-between bg-secondary/10 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <img src="C++.png" className="h-10 w-8" />
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-base text-primary"><strong>C++ <i>Genie</i></strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <AuthButtons />
              <Button
                asChild
                className="bg-blue-500 hover:bg-blue-700 text-white text-sm rounded-full px-3 py-2"
              >
                <Link href="/contact">
                  <strong>
                    <i>Contact Us</i>
                  </strong>
                </Link>
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-hidden min-w-0"> {/* Added min-w-0 */}
            <ScrollArea className="h-full px-4 py-2 w-full">
              <div className="space-y-4 pb-4 w-full">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex w-full min-w-0",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className="flex items-start space-x-2 max-w-[85%] min-w-0">
                      {message.role === 'assistant' && (
                        <Avatar className="h-6 w-6 mt-1 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            <img src="C++.png" className="h-7 w-8" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm shadow-sm overflow-hidden w-full min-w-0",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        )}
                      >
                        {message.role === "assistant" ? (
                          message.content === "" && isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <div
                              className="markdown-body prose prose-sm max-w-none break-words min-w-0"
                              dangerouslySetInnerHTML={{
                                __html: formatCodeBlocks(message.content)
                              }}
                            />
                          )
                        ) : (
                          <div className="whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <Avatar className="h-6 w-6 mt-1 flex-shrink-0">
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-secondary/20 bg-secondary/5 flex-shrink-0">
            <form onSubmit={sendMessage} className="flex w-full items-end space-x-2">
              <Textarea
                ref={textAreaRef}
                placeholder="Enter your C++ question! "
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isLoading) {
                      sendMessage(e);
                    }
                  }
                }}
                className="flex-1 min-h-[44px] overflow-y-auto resize-none whitespace-pre-wrap transition-height duration-100 py-2"
                disabled={isLoading}
                style={{
                  maxHeight: '200px',
                  height: '44px'
                }}
              />
              <Button
                type="submit"
                size="icon"
                className="mb-[3px]"
                disabled={isLoading || input.trim().length === 0}
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-background border-r border-secondary/20 px-4 pt-3 pb-4 overflow-y-auto z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center "> {/* Reduced mb-2 to mb-1 */}
              <h2 className="font-bold text-base">Menu</h2>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <SidebarContent />
          </div>
        </div>
      )}

    </div>
  );
}