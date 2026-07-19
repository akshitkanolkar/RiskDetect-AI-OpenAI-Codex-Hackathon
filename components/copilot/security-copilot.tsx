"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Copy, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@/hooks/use-scans";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function SecurityCopilot() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"simple" | "technical" | "checklist">("simple");
  const { data, send } = useChat(sessionId);
  const { toast } = useToast();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data?.sessionId) setSessionId(data.sessionId);
  }, [data?.sessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages, send.isPending]);

  const onSend = async () => {
    const message = input.trim();
    if (!message || send.isPending) return;
    setInput("");
    try {
      const result = await send.mutateAsync({
        message,
        sessionId,
        mode,
      });
      setSessionId(result.sessionId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copilot unavailable",
        description: error instanceof Error ? error.message : "Try again",
      });
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied" });
  };

  return (
    <>
      <Button
        variant="brand"
        size="icon"
        className="fixed bottom-6 right-6 z-toast h-14 w-14 rounded-full shadow-glow"
        onClick={() => setOpen(true)}
        aria-label="Open Security Copilot"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-24 right-6 z-toast flex h-[min(640px,75vh)] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-modal backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Security Copilot</p>
                  <p className="text-[11px] text-muted-foreground">Context-aware · scan history</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-1 border-b border-border/50 px-3 py-2">
              {(["simple", "technical", "checklist"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
                    mode === value
                      ? "bg-brand/15 text-brand"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>

            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3">
                {(data?.messages?.length ?? 0) === 0 && (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                    <Sparkles className="mb-2 h-4 w-4 text-brand" />
                    Ask me to explain a scan, generate a checklist, or break down why something is
                    risky.
                  </div>
                )}
                {data?.messages?.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "group relative rounded-2xl px-3 py-2 text-sm",
                      message.role === "user"
                        ? "ml-8 bg-brand text-brand-foreground"
                        : "mr-4 border border-border/60 bg-muted/30",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert prose-p:my-2 prose-pre:bg-background max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                    {message.role === "assistant" && (
                      <button
                        type="button"
                        className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
                        onClick={() => void copy(message.content)}
                        aria-label="Copy message"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {send.isPending && (
                  <div className="mr-4 rounded-2xl border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    <span className="inline-flex gap-1">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse [animation-delay:150ms]">●</span>
                      <span className="animate-pulse [animation-delay:300ms]">●</span>
                    </span>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-border/70 p-3">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your scans…"
                  className="max-h-28 min-h-[44px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void onSend();
                    }
                  }}
                />
                <Button
                  variant="brand"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  disabled={!input.trim() || send.isPending}
                  onClick={() => void onSend()}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
