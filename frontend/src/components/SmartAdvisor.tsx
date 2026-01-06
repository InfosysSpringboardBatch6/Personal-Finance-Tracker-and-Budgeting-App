import { useState, useRef, useEffect, useContext } from "react";
import { Loader2, Send, Sparkles, User, Bot, Trash2 } from "lucide-react";
import axios from "axios";
import { AppContext } from "@/context/AppContext";
import { toast } from "react-toastify";
import React from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "How can I start saving for an emergency fund?",
  "What's the 50/30/20 budget rule?",
  "How do I pay off credit card debt faster?",
  "Should I save or invest my money first?",
];

export function SmartAdvisor() {
  const { backend, usertoken } = useContext(AppContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (query: string) => {
    if (!query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${backend}/api/user/ai/smart-advisor`,
        { query },
        { headers: { usertoken } }
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.advice,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Advisor error:", error);
      toast.error(error.response?.data?.error || error.message || "Failed to get advice");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I couldn't process your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="bg-[#1a233a] rounded-lg overflow-hidden flex flex-col h-[600px] shadow-xl border border-[#2d3748]">
      <div className="bg-gradient-to-r from-[#10b981] to-[#3b82f6] text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Smart Financial Advisor</h2>
              <p className="text-white/80 text-sm">
                Get personalized money advice
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex p-4 bg-[#10b981]/10 rounded-full mb-4">
                  <Bot className="h-8 w-8 text-[#10b981]" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-white">
                  Hi! I'm your financial advisor
                </h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  Ask me anything about budgeting, saving, investing, or managing your money better.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Suggested questions
                </p>
                <div className="grid gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(question)}
                      className="text-left p-3 text-sm bg-[#0d1224] hover:bg-[#141a2e] rounded-lg transition-colors text-white border border-[#2d3748]"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 animate-fade-in ${message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-[#10b981]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${message.role === "user"
                      ? "bg-gradient-to-r from-[#10b981] to-[#3b82f6] text-white rounded-br-md"
                      : "bg-[#0d1224] text-white rounded-bl-md border border-[#2d3748]"
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-[#3b82f6]" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-[#10b981]" />
                  </div>
                  <div className="bg-[#0d1224] p-4 rounded-2xl rounded-bl-md border border-[#2d3748]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#10b981]" />
                      <span className="text-sm text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#2d3748] bg-[#1a233a]">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about budgeting, saving, investing..."
              disabled={loading}
              className="flex-1 bg-[#0d1224] border border-[#2d3748] rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981] transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#10b981] hover:bg-[#10b981]/90 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
