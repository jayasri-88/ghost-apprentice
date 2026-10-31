import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Clapperboard, Loader2, Mic, Search, Send, X } from "lucide-react";

import EvidencePanel from "../components/EvidencePanel";
import ManualDetail from "../components/ManualDetail";
import manuals from "../data/manuals";
import seedConversations from "../data/ghostSeeds";
import { statusInfo } from "../data/manualStatus";
import { findEvidence, SUGGESTED_QUESTIONS } from "../utils/ghostAnswer";
import { manualToContext } from "../utils/manualContext";
import { sendMessage } from "../services/assistant";

const RECENT_KEY = "ghost.recentManuals";
const MAX_RECENT = 3;

const readRecent = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) ?? [];
  } catch {
    return [];
  }
};

export default function GhostAssistant() {
  const location = useLocation();
  const [selectedId, setSelectedId] = useState(
    () => location.state?.manualId ?? manuals[0]?.id ?? null
  );
  const [recentIds, setRecentIds] = useState(readRecent);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [watching, setWatching] = useState(null);
  const [notice, setNotice] = useState("");
  const [chats, setChats] = useState({});
  const [model, setModel] = useState(null);
  const noticeTimer = useRef(null);
  const scrollRef = useRef(null);
  const idRef = useRef(0);

  const nextId = (role) => {
    idRef.current += 1;
    return `${role}-${idRef.current}`;
  };

  const say = (text) => {
    setNotice(text);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3500);
  };

  useEffect(
    () => () => {
      clearTimeout(noticeTimer.current);
    },
    []
  );

  const selected = manuals.find((m) => m.id === selectedId) ?? null;
  const messages = selected
    ? chats[selected.id] ?? seedConversations[selected.id] ?? []
    : [];
  const lastEvidence = [...messages]
    .reverse()
    .find((m) => m.role === "ghost" && m.evidence)?.evidence;

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length, thinking]);

  const pickManual = (id) => {
    setSelectedId(id);
    setSidebarOpen(false);
    const next = [id, ...recentIds.filter((r) => r !== id)].slice(0, MAX_RECENT);
    setRecentIds(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const focusEvidence = () => {
    if (!selected) return;
    if (!lastEvidence) {
      say("Ask a question first and the source clip will show up here.");
      return;
    }
    setWatching(selected);
  };

  const send = async (text) => {
    const content = text.trim();
    if (!content || !selected || thinking) return;

    const manual = selected;
    const id = manual.id;
    const seed = seedConversations[id] ?? [];
    const userMessage = {
      id: nextId("u"),
      role: "user",
      text: content,
    };

    setDraft("");
    setChats((prev) => ({ ...prev, [id]: [...(prev[id] ?? seed), userMessage] }));
    setThinking(true);

    try {
      const data = await sendMessage(content, manualToContext(manual));
      setModel(data.model);

      setChats((prev) => ({
        ...prev,
        [id]: [
          ...(prev[id] ?? seed),
          userMessage,
          {
            id: nextId("g"),
            role: "ghost",
            text: data.answer,
            model: data.model,
            evidence: findEvidence(manual, content),
          },
        ],
      }));
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      let text;
      if (error.code === "ECONNABORTED") {
        text = "The model took too long to answer. Try a shorter, more specific question.";
      } else if (status === 503) {
        text = "The model is not responding. Check that Ollama is running and qwen3-vl:2b is pulled.";
      } else if (status) {
        text = detail || "The assistant could not answer that. Try rephrasing.";
      } else {
        text = "Cannot reach the backend at http://localhost:8000. Start the FastAPI server and try again.";
      }

      setNotice(text);
      clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setNotice(""), 6000);
    } finally {
      setThinking(false);
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? manuals.filter(
        (m) => m.title.toLowerCase().includes(q) || m.equipment.toLowerCase().includes(q)
      )
    : manuals;

  const recentManuals = recentIds
    .map((id) => manuals.find((m) => m.id === id))
    .filter(Boolean);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-canvas">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-line bg-surface">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="lg:hidden p-2 rounded-lg border border-line text-text-muted"
          aria-label="Toggle manual list"
        >
          {sidebarOpen ? <X size={17} /> : <Search size={17} />}
        </button>

        <div className="flex items-baseline gap-3 flex-1 min-w-0">
          <h1 className="font-display text-lg font-semibold">Assistant</h1>
          <p className="text-xs text-text-subtle hidden sm:block">
            Answers come only from the selected manual.
          </p>
        </div>

        {selected && (
          <p className="hidden md:block text-xs text-text-muted truncate max-w-xs">
            Selected: <span className="text-text">{selected.title}</span>
          </p>
        )}
      </div>

      <div className="flex-1 flex min-h-0 relative">
        <aside
          className={`${
            sidebarOpen ? "block" : "hidden"
          } lg:block w-full lg:w-64 shrink-0 bg-surface border-r border-line overflow-y-auto absolute lg:static inset-0 z-20 lg:inset-auto`}
        >
          <div className="p-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search manuals"
                className="w-full bg-canvas border border-line rounded-lg pl-8 pr-3 py-2 text-sm placeholder:text-text-subtle focus:outline-none focus:border-text-subtle transition-colors"
              />
            </div>
          </div>

          <div className="px-3 pb-3">
            <p className="text-[10px] uppercase tracking-wide text-text-subtle mb-1.5 px-1">
              Knowledge manuals
            </p>
            <div className="space-y-0.5">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => pickManual(m.id)}
                  className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${
                    m.id === selectedId ? "bg-canvas text-text" : "text-text-muted hover:bg-canvas"
                  }`}
                >
                  <p className={`text-sm leading-snug ${m.id === selectedId ? "font-medium" : ""}`}>
                    {m.title}
                  </p>
                  <p className="text-xs text-text-subtle mt-0.5 truncate">{m.equipment}</p>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-text-subtle px-3 py-2">No manuals match the search.</p>
              )}
            </div>
          </div>

          {recentManuals.length > 0 && (
            <div className="px-3 pb-4 border-t border-line pt-3">
              <p className="text-[10px] uppercase tracking-wide text-text-subtle mb-1.5 px-1">
                Recently accessed
              </p>
              <div className="space-y-0.5">
                {recentManuals.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => pickManual(m.id)}
                    className={`w-full text-left rounded-lg px-3 py-1.5 text-sm truncate transition-colors ${
                      m.id === selectedId ? "text-text font-medium" : "text-text-muted hover:bg-canvas"
                    }`}
                  >
                    {m.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
            {messages.length === 0 ? (
              <div className="max-w-lg mx-auto pt-8">
                <h2 className="font-display text-lg font-semibold text-center">
                  Questions about the selected manual
                </h2>
                <p className="text-sm text-text-muted text-center mt-1 mb-6">
                  {selected
                    ? `Ask about the ${selected.equipment} procedure. Anything the recording does not cover is flagged as missing, not guessed.`
                    : "Select a manual to begin."}
                </p>

                <div className="space-y-2">
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      onClick={() => send(question)}
                      className="w-full text-left bg-surface border border-line rounded-lg px-4 py-2.5 text-sm text-text-muted hover:border-text-subtle hover:text-text transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[85%]">
                      <div
                        className={`rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                          msg.role === "user"
                            ? "bg-text text-white"
                            : "bg-surface border border-line text-text"
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.model && (
                        <p className="mt-1 text-[11px] text-text-subtle font-mono">
                          answered by {msg.model}
                        </p>
                      )}
                      {msg.evidence && (
                        <button
                          onClick={() => setWatching(selected)}
                          className="xl:hidden mt-1.5 inline-flex items-center gap-1.5 text-xs text-text-subtle hover:text-text transition-colors"
                        >
                          <Clapperboard size={12} />
                          {msg.evidence.label}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {thinking && (
                  <div className="flex items-center gap-2 text-sm text-text-subtle">
                    <Loader2 size={14} className="animate-spin" />
                    Consulting {model || "the model"}...
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-line bg-surface p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
              className="max-w-2xl mx-auto flex items-center gap-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={selected ? "Ask about this procedure..." : "Select a manual first"}
                disabled={!selected}
                className="flex-1 bg-canvas border border-line rounded-lg px-4 py-2.5 text-sm placeholder:text-text-subtle focus:outline-none focus:border-text-subtle disabled:opacity-50 transition-colors"
              />
              <button
                type="button"
                className="p-2.5 rounded-lg border border-line text-text-muted hover:bg-canvas hover:text-text transition-colors"
                title="Voice input (not available yet)"
                onClick={() => say("Voice input isn't available yet.")}
              >
                <Mic size={17} />
              </button>
              <button
                type="submit"
                disabled={!draft.trim() || !selected || thinking}
                className="p-2.5 rounded-lg bg-text hover:bg-neutral-800 disabled:bg-line disabled:text-text-subtle text-white transition-colors"
              >
                <Send size={17} />
              </button>
            </form>

            {selected && selected.status !== "approved" && (
              <p className="max-w-2xl mx-auto text-xs text-warn mt-2">
                This manual is {statusInfo(selected.status).label.toLowerCase()} — answers may be
                unverified.
              </p>
            )}
          </div>
        </main>

        <div className="hidden xl:block w-72 shrink-0 border-l border-line bg-surface p-4 space-y-4 overflow-y-auto">
          <EvidencePanel manual={selected} evidence={lastEvidence} onWatch={focusEvidence} />

          {selected && (
            <button onClick={() => setWatching(selected)} className="w-full text-left">
              <div className="bg-canvas border border-line rounded-lg p-4">
                <p className="text-[10px] uppercase tracking-wide text-text-subtle">
                  Selected manual
                </p>
                <p className="text-sm mt-1 leading-snug">{selected.title}</p>
                <p className="text-xs text-text-muted mt-1">{selected.equipment}</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white px-4 py-2.5 rounded-lg text-sm max-w-[90vw]">
          {notice}
        </div>
      )}

      {watching && (
        <ManualDetail
          manual={watching}
          onClose={() => setWatching(null)}
          onAsk={(manual) => {
            pickManual(manual.id);
            setWatching(null);
          }}
        />
      )}
    </div>
  );
}
