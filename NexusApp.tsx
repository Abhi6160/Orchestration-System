import { useCallback, useMemo, useState } from "react";
import { History as HistoryIcon, X } from "lucide-react";
import {
  nowLabel,
  sendMessage,
  uid,
  type Attachment,
  type ChatMessageData,
  type Conversation,
} from "@/lib/ai-service";
import NeuralBackground from "./NeuralBackground";
import Navbar from "./Navbar";
import Hero from "./Hero";
import AIInput from "./AIInput";
import LoginModal from "./LoginModal";
import ProfileMenu from "./ProfileMenu";
import NavigationDrawer, { type DrawerAction } from "./NavigationDrawer";
import CameraModal from "./CameraModal";
import SettingsPanel from "./SettingsPanel";
import ChatInterface from "./ChatInterface";
import ChatHistory from "./ChatHistory";

const seed = (title: string, day: Conversation["day"]): Conversation => ({
  id: uid(),
  title,
  day,
  messages: [],
});

const SEEDED: Conversation[] = [
  seed("Explain quantum computing", "Today"),
  seed("Create a Python program", "Today"),
  seed("How does neural networking work?", "Today"),
  seed("What is machine learning?", "Yesterday"),
  seed("Explain recursion", "Yesterday"),
];

export function NexusApp() {
  const [conversations, setConversations] = useState<Conversation[]>(SEEDED);
  const [activeId, setActiveId] = useState<string>("");
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );
  const inChat = !!active && active.messages.length > 0;

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4200);
  }, []);

  const addAttachment = useCallback((a: Attachment) => {
    setAttachments((prev) => [...prev, a]);
  }, []);

  const submit = useCallback(async () => {
    const text = draft.trim();
    if (!text) {
      notify("Please enter a question first.");
      return;
    }
    const sent = attachments;
    const userMsg: ChatMessageData = {
      id: uid(),
      role: "user",
      text,
      time: nowLabel(),
      ...(sent.length ? { attachments: sent } : {}),
    };

    let convoId = activeId;
    if (!active) {
      convoId = uid();
      setConversations((prev) => [
        { id: convoId, title: text.slice(0, 46), day: "Today", messages: [userMsg] },
        ...prev,
      ]);
      setActiveId(convoId);
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convoId ? { ...c, messages: [...c.messages, userMsg] } : c,
        ),
      );
    }

    setDraft("");
    setAttachments([]);
    setThinking(true);

    let reply: string;
    try {
      reply = await sendMessage(text, sent);
    } catch {
      reply = "My intelligence layer is unreachable right now. Please try again in a moment.";
    }
    setThinking(false);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convoId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: uid(), role: "nexus", text: reply, time: nowLabel() },
              ],
            }
          : c,
      ),
    );
  }, [draft, attachments, active, activeId, notify]);

  const newChat = () => {
    setActiveId("");
    setDraft("");
    setAttachments([]);
  };

  const onDrawer = (action: DrawerAction) => {
    setDrawerOpen(false);
    if (action === "new-chat" || action === "home") newChat();
    else if (action === "history") setHistoryOpen(true);
    else if (action === "profile") setProfileOpen(true);
    else if (action === "settings") setSettingsOpen(true);
    else if (action === "about")
      notify("Nexus.ai — a premium AI intelligence command center. Core v2.4.");
    else if (action === "login") setLoginOpen(true);
    else if (action === "logout") {
      setUser(null);
      notify("You have been signed out of Nexus.");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <NeuralBackground />

      <Navbar
        user={user}
        profileOpen={profileOpen}
        onLogin={() => setLoginOpen(true)}
        onProfile={() => setProfileOpen((o) => !o)}
        onMenu={() => setDrawerOpen(true)}
      />

      <ProfileMenu
        open={profileOpen}
        user={user}
        onClose={() => setProfileOpen(false)}
        onSettings={() => {
          setProfileOpen(false);
          setSettingsOpen(true);
        }}
        onHistory={() => {
          setProfileOpen(false);
          setHistoryOpen(true);
        }}
        onLogin={() => {
          setProfileOpen(false);
          setLoginOpen(true);
        }}
        onLogout={() => {
          setProfileOpen(false);
          setUser(null);
          notify("You have been signed out of Nexus.");
        }}
      />

      {!inChat ? (
        <main className="flex flex-1 flex-col items-center px-4 pt-[6vh] pb-24 sm:pt-[10vh]">
          <Hero />
          <div className="mt-10 w-full sm:mt-12">
            <AIInput
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              attachments={attachments}
              onAdd={addAttachment}
              onRemove={(id) => setAttachments((p) => p.filter((a) => a.id !== id))}
              onCamera={() => setCameraOpen(true)}
              notify={notify}
            />
          </div>
        </main>
      ) : (
        <main className="mx-auto flex w-full max-w-7xl flex-1 gap-4 px-4 pb-6 sm:px-6">
          <div className="hidden w-72 shrink-0 lg:block">
            <div className="h-[calc(100vh-9rem)]">
              <ChatHistory
                conversations={conversations}
                activeId={activeId}
                onSelect={setActiveId}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-xs text-gold"
              >
                <HistoryIcon className="size-4" /> History
              </button>
              <button
                type="button"
                onClick={newChat}
                className="rounded-full border border-neon/40 px-4 py-2 text-xs text-neon-bright"
              >
                New chat
              </button>
            </div>

            <div className="h-[calc(100vh-16rem)] min-h-[22rem] lg:h-[calc(100vh-14rem)]">
              <ChatInterface messages={active.messages} thinking={thinking} />
            </div>

            <AIInput
              compact
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              attachments={attachments}
              onAdd={addAttachment}
              onRemove={(id) => setAttachments((p) => p.filter((a) => a.id !== id))}
              onCamera={() => setCameraOpen(true)}
              notify={notify}
            />
          </div>
        </main>
      )}

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex bg-ink/80 p-4 backdrop-blur-sm lg:hidden">
          <div className="mx-auto h-full w-full max-w-sm">
            <ChatHistory
              conversations={conversations}
              activeId={activeId}
              onSelect={(id) => {
                setActiveId(id);
                setHistoryOpen(false);
              }}
              onClose={() => setHistoryOpen(false)}
            />
          </div>
        </div>
      )}

      <NavigationDrawer
        open={drawerOpen}
        user={user}
        onClose={() => setDrawerOpen(false)}
        onSelect={onDrawer}
      />
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={(email) => {
          setUser(email);
          setLoginOpen(false);
          notify(`Welcome back, ${email.split("@")[0]}.`);
        }}
      />
      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={addAttachment}
      />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {toast && (
        <div
          role="status"
          className="glass-panel fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-rise-in items-center gap-3 rounded-full px-4 py-2.5 text-xs text-warm"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-neon" />
          <span className="truncate">{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="text-muted-foreground hover:text-gold"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default NexusApp;
