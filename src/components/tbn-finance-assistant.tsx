import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { BookOpenCheck, MessageSquareText, Plus, Trash2 } from "lucide-react";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { TbnAiSnapshot, TbnAiThread } from "@/lib/tbn-ai-types";

const starterQuestions = [
  "Which profit centres drive the largest net balances?",
  "Explain the debit and credit concentration.",
  "Which GL accounts need finance review?",
];

function createThread(snapshot: TbnAiSnapshot, index: number): TbnAiThread {
  return { id: crypto.randomUUID(), title: `Analysis ${index}`, createdAt: Date.now(), snapshot, messages: [] };
}

function messageText(message: UIMessage) {
  return message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
}

async function authorizedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response = await fetch(input, { ...init, headers });
  for (let retry = 0; retry < 2 && (response.status === 429 || response.status >= 500); retry += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** retry));
    response = await fetch(input, { ...init, headers });
  }
  return response;
}

function ChatThread({ thread, currentSnapshot, onMessages, onSnapshot }: {
  thread: TbnAiThread;
  currentSnapshot: TbnAiSnapshot;
  onMessages: (messages: UIMessage[]) => void;
  onSnapshot: (snapshot: TbnAiSnapshot) => void;
}) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/tbn-assistant", fetch: authorizedFetch }), []);
  const { messages, sendMessage, stop, status, error } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport,
    onFinish: ({ messages: completed }) => onMessages(completed),
  });
  const busy = status === "submitted" || status === "streaming";
  const submit = async (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    onSnapshot(currentSnapshot);
    await sendMessage({ text: value }, { body: { threadId: thread.id, snapshot: currentSnapshot } });
  };

  return <div className="flex min-h-0 flex-1 flex-col">
    <Conversation className="min-h-[360px] bg-background">
      <ConversationContent className="gap-5">
        {messages.length === 0 ? <ConversationEmptyState icon={<BookOpenCheck className="size-8 text-primary" />} title="Ask about this TBN dashboard" description="Answers use the current filtered totals, profit centres, alerts, and leading GL accounts." /> : null}
        {messages.map((message) => <Message key={message.id} from={message.role}><MessageContent>{message.parts.map((part, index) => {
          if (part.type === "text") return <MessageResponse key={index}>{part.text}</MessageResponse>;
          if (part.type === "reasoning" && part.text) return <details key={index} className="text-xs text-muted-foreground"><summary className="cursor-pointer">Analysis basis</summary><p className="mt-2 whitespace-pre-wrap">{part.text}</p></details>;
          return null;
        })}</MessageContent></Message>)}
        {status === "submitted" ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Shimmer>Reviewing the current ZTBN figures…</Shimmer></div> : null}
        {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error.message || "Unable to complete this analysis."}</div> : null}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
    <div className="border-t bg-muted/15 p-3">
      {messages.length === 0 ? <div className="mb-2 flex flex-wrap gap-1.5">{starterQuestions.map((question) => <Button key={question} type="button" variant="outline" size="sm" className="h-auto whitespace-normal text-left text-[11px]" onClick={() => void submit(question)}>{question}</Button>)}</div> : null}
      <PromptInput onSubmit={({ text }) => submit(text)}>
        <PromptInputBody><PromptInputTextarea placeholder="Ask about balances, profit centres, or GL movements…" disabled={busy} /></PromptInputBody>
        <PromptInputFooter><PromptInputTools><span className="px-1 text-[10px] text-muted-foreground">Current filtered ZTBN data · no chat history is stored</span></PromptInputTools><PromptInputSubmit status={status} onStop={stop} /></PromptInputFooter>
      </PromptInput>
    </div>
  </div>;
}

export function TbnFinanceAssistant({ snapshot }: { snapshot: TbnAiSnapshot }) {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<TbnAiThread[]>(() => [createThread(snapshot, 1)]);
  const [activeId, setActiveId] = useState(() => threads[0]!.id);
  const active = threads.find((thread) => thread.id === activeId) ?? threads[0]!;
  const addThread = () => {
    const thread = createThread(snapshot, threads.length + 1);
    setThreads((current) => [...current, thread]);
    setActiveId(thread.id);
  };
  const removeThread = (id: string) => {
    setThreads((current) => {
      if (current.length === 1) return [createThread(snapshot, 1)];
      const next = current.filter((thread) => thread.id !== id);
      if (id === activeId) setActiveId(next[0]!.id);
      return next;
    });
  };
  const updateActive = (patch: Partial<TbnAiThread>) => setThreads((current) => current.map((thread) => thread.id === active.id ? { ...thread, ...patch } : thread));

  return <>
    <Button type="button" onClick={() => setOpen(true)}><MessageSquareText className="size-4" />Ask TBN AI</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[min(820px,92vh)] max-w-6xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b bg-accent/40 px-5 py-4"><DialogTitle className="flex items-center gap-2"><BookOpenCheck className="size-5 text-primary" />TBN Finance Assistant</DialogTitle><DialogDescription>Model-assisted explanations grounded in the current dashboard data. Verify material decisions against the source table.</DialogDescription></DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="w-full shrink-0 border-b bg-muted/25 p-3 md:w-56 md:border-b-0 md:border-r">
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={addThread}><Plus className="size-4" />New analysis</Button>
            <div className="mt-3 flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">{threads.map((thread) => <div key={thread.id} className={`flex min-w-40 items-center rounded-md border ${thread.id === active.id ? "border-primary/30 bg-primary/10" : "border-transparent"}`}><button type="button" onClick={() => setActiveId(thread.id)} className="min-w-0 flex-1 px-3 py-2 text-left"><span className="block truncate text-xs font-medium">{thread.title}</span><span className="block text-[10px] text-muted-foreground">{thread.messages.length ? `${thread.messages.filter((m) => m.role === "user").length} questions` : "New thread"}</span></button><Button type="button" variant="ghost" size="icon" className="mr-1 size-7" onClick={() => removeThread(thread.id)} aria-label={`Delete ${thread.title}`}><Trash2 className="size-3.5" /></Button></div>)}</div>
          </aside>
          <ChatThread key={active.id} thread={active} currentSnapshot={snapshot} onMessages={(messages) => { const firstUser = messages.find((message) => message.role === "user"); updateActive({ messages, title: firstUser ? messageText(firstUser).slice(0, 36) || active.title : active.title }); }} onSnapshot={(value) => updateActive({ snapshot: value })} />
        </div>
      </DialogContent>
    </Dialog>
  </>;
}