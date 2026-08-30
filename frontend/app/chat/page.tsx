"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import { BACKEND_URL } from "../lib/backend";
import { MOCK_LEARNER_ID } from "../lib/constants";
import type { ExperienceLevel } from "../lib/learnerProfile";

type ChatMessage = { role: "user" | "assistant"; content: string };

type ChecklistField = {
  key: "goal" | "interests" | "experienceLevel" | "timeBudgetHoursPerWeek";
  label: string;
};

const CHECKLIST: ChecklistField[] = [
  { key: "goal", label: "Goal" },
  { key: "interests", label: "Interests" },
  { key: "experienceLevel", label: "Experience" },
  { key: "timeBudgetHoursPerWeek", label: "Time budget" },
];

type Profile = {
  goal: string | null;
  interests: string[];
  experienceLevel: ExperienceLevel | null;
  completedCourseIds: string[];
  timeBudgetHoursPerWeek: number | null;
};

const EMPTY_PROFILE: Profile = {
  goal: null,
  interests: [],
  experienceLevel: null,
  completedCourseIds: [],
  timeBudgetHoursPerWeek: null,
};

function fieldValue(profile: Profile, key: ChecklistField["key"]): string | null {
  if (key === "goal") return profile.goal;
  if (key === "interests")
    return profile.interests.length > 0 ? profile.interests.join(", ") : null;
  if (key === "experienceLevel") return profile.experienceLevel;
  if (key === "timeBudgetHoursPerWeek")
    return profile.timeBudgetHoursPerWeek !== null
      ? `${profile.timeBudgetHoursPerWeek} hrs/week`
      : null;
  return null;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Tell me what you're trying to learn or become — a job, a skill, a project. I'll ask what I still need to know.",
    },
  ]);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const allFieldsKnown = CHECKLIST.every((f) => fieldValue(profile, f.key) !== null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stampedKeys, setStampedKeys] = useState<Set<ChecklistField["key"]>>(
    new Set()
  );
  const listRef = useRef<HTMLUListElement>(null);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    const history = messages;
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/chat/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "PathFinder couldn't respond just now.");
      }
      const data: {
        reply: string;
        profilePatch: Partial<Profile>;
        profileComplete: boolean;
      } = await res.json();

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      const newProfile: Profile = {
        goal: data.profilePatch.goal ?? profile.goal,
        interests:
          data.profilePatch.interests && data.profilePatch.interests.length > 0
            ? data.profilePatch.interests
            : profile.interests,
        experienceLevel: data.profilePatch.experienceLevel ?? profile.experienceLevel,
        completedCourseIds: profile.completedCourseIds,
        timeBudgetHoursPerWeek:
          data.profilePatch.timeBudgetHoursPerWeek ?? profile.timeBudgetHoursPerWeek,
      };
      const newlyFilled = CHECKLIST.filter(
        (f) => fieldValue(profile, f.key) === null && fieldValue(newProfile, f.key) !== null
      ).map((f) => f.key);

      setProfile(newProfile);
      if (newlyFilled.length > 0) {
        setStampedKeys(new Set(newlyFilled));
        setTimeout(() => setStampedKeys(new Set()), 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  async function generatePath() {
    setGenerating(true);
    setError(null);
    try {
      const patchRes = await fetch("/api/learner-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!patchRes.ok) throw new Error("Couldn't save your profile.");

      const genRes = await fetch(`${BACKEND_URL}/recommendations/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId: MOCK_LEARNER_ID }),
      });
      if (!genRes.ok) {
        const body = await genRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't generate a path just now.");
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-ground text-text">
      <SiteHeader active="/chat" />

      <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* Conversation */}
        <div className="flex h-[65vh] flex-col rounded-[20px] bg-surface ring-1 ring-border lg:h-[70vh]">
          <ul ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <li
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[80%] rounded-2xl bg-blaze px-3.5 py-2.5 text-base leading-7 text-text"
                    : "mr-auto max-w-[80%] rounded-2xl bg-surface-raised px-3.5 py-2.5 text-base leading-7 text-text ring-1 ring-border"
                }
              >
                {m.content}
              </li>
            ))}
            {sending && (
              <li className="mr-auto max-w-[80%] rounded-2xl bg-surface-raised px-3.5 py-2.5 font-mono text-xs uppercase tracking-wide text-text-faint ring-1 ring-border">
                Thinking…
              </li>
            )}
          </ul>

          <form
            onSubmit={sendMessage}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your goal…"
              disabled={sending}
              className="flex-1 rounded-full bg-surface-raised px-4 py-2.5 text-sm text-text placeholder:text-text-faint ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-blaze"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-full bg-blaze px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text transition-[background-color,box-shadow] hover:bg-blaze-deep hover:shadow-[0_0_0_1px_rgba(224,136,56,0.4),0_8px_20px_-8px_rgba(224,136,56,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>

        {/* Trail permit checklist */}
        <div className="rounded-[20px] bg-surface p-6 ring-1 ring-border">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            Trail permit
          </p>
          <p className="mt-1 text-sm leading-6 text-text-muted">
            Four things PathFinder needs before it can mark a route.
          </p>

          <ul className="mt-5 flex flex-col gap-4">
            {CHECKLIST.map((field) => {
              const value = fieldValue(profile, field.key);
              const filled = value !== null;
              return (
                <li key={field.key} className="flex items-start gap-3">
                  <span
                    className={
                      filled
                        ? `mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-grade-beginner text-ground ${
                            stampedKeys.has(field.key) ? "stamp" : ""
                          }`
                        : "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-faint ring-1 ring-border"
                    }
                    aria-hidden
                  >
                    {filled ? (
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                        <path
                          d="M3 8.5L6.2 11.5L13 4.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span className="font-mono text-[11px]">
                        {CHECKLIST.indexOf(field) + 1}
                      </span>
                    )}
                  </span>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wide text-text-muted">
                      {field.label}
                    </p>
                    <p className="text-sm leading-5 text-text">
                      {value ?? <span className="text-text-faint">not yet known</span>}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {allFieldsKnown && (
            <button
              type="button"
              onClick={generatePath}
              disabled={generating}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-blaze px-5 py-3 font-mono text-sm uppercase tracking-wide text-text transition-[background-color,box-shadow] hover:bg-blaze-deep hover:shadow-[0_0_0_1px_rgba(224,136,56,0.4),0_10px_28px_-8px_rgba(224,136,56,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? "Marking your route…" : "Generate my path"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mx-6 mb-6 rounded-xl bg-blaze/10 px-3 py-2.5 text-sm text-blaze-glow ring-1 ring-blaze/30 sm:mx-10">
          {error}
        </p>
      )}
    </div>
  );
}
