import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, X, Send, Bot } from "lucide-react";
import { chatWithAssistant, type ChatMessage } from "../lib/ai";

const SUGGESTED_PROMPTS = [
  "How much did I spend on food this month?",
  "Am I on track with my budgets?",
  "How close am I to my savings goals?",
];

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: ChatMessage[] }) =>
      chatWithAssistant(message, history),
    onSuccess: (reply) => {
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.error;
      setError(message || "Couldn't reach the assistant. Try again.");
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, mutation.isPending]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending) return;

    setError("");
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    mutation.mutate({ message: trimmed, history });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-sprout-primary text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label="Open AI financial assistant"
      >
        <Sparkles size={22} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[32rem] z-50 flex flex-col bg-sprout-surface sm:border sm:border-sprout-border sm:rounded-sprout shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-sprout-border bg-sprout-primary-light">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sprout-primary flex items-center justify-center shrink-0">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <p className="font-display text-sm text-sprout-text font-semibold">Finance assistant</p>
            <p className="text-sprout-text-muted text-xs">Grounded in your real data</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-sprout-text-muted hover:text-sprout-text transition-colors"
          aria-label="Close assistant"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sprout-text-muted text-sm">
              Ask me anything about your spending, budgets, or goals.
            </p>
            <div className="space-y-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="w-full text-left text-sm text-sprout-text bg-sprout-bg border border-sprout-border rounded-xl px-3 py-2 hover:border-sprout-primary transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] text-sm rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-sprout-primary text-white rounded-br-sm"
                  : "bg-sprout-bg text-sprout-text rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {mutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-sprout-bg text-sprout-text-muted text-sm rounded-2xl rounded-bl-sm px-3.5 py-2.5">
              Thinking...
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-xs px-1">{error}</p>}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-sprout-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your finances..."
          className="flex-1 border border-sprout-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-sprout-primary"
        />
        <button
          type="submit"
          disabled={mutation.isPending || !input.trim()}
          className="w-10 h-10 shrink-0 rounded-xl bg-sprout-primary text-white flex items-center justify-center disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}