import { manualDuration } from "../utils/format";

// Maps a question to the part of the manual it is about, so the EvidencePanel
// can point at a step or section. Answers themselves come from the backend
// model — this file only locates evidence, never composes replies.

function match(question, ...needles) {
  return needles.some((n) => question.includes(n));
}

export function findEvidence(manual, question) {
  const q = question.toLowerCase().trim();

  const stepRef = q.match(/step\s*(\d+)/);
  if (stepRef) {
    const step = manual.steps[Number(stepRef[1]) - 1];
    if (!step) return null;
    return {
      kind: "step",
      label: `Step ${Number(stepRef[1])} · ${step.stamp}`,
      detail: step.title,
      seconds: step.seconds,
    };
  }

  if (match(q, "tool", "what do i need", "kit")) {
    return {
      kind: "tools",
      label: `Tools · ${manual.tools.length} listed`,
      detail: manual.tools.join(", "),
    };
  }

  if (match(q, "component", "part")) {
    return { kind: "components", label: "Components", detail: manual.components.join(", ") };
  }

  if (match(q, "safety", "warning", "hazard", "dangerous", "ppe")) {
    if (!manual.safetyWarnings.length) return null;
    return {
      kind: "safety",
      label: `Safety · ${manual.safetyWarnings.length} warnings`,
      detail: manual.safetyWarnings[0],
    };
  }

  if (match(q, "missing", "gap", "not shown", "unclear", "reshoot")) {
    if (!manual.missingInfo.length) {
      return { kind: "review", label: "Review flagged no gaps", detail: manual.review?.reviewer ?? "" };
    }
    return {
      kind: "missing",
      label: `Missing · ${manual.missingInfo.length} items`,
      detail: manual.missingInfo[0],
    };
  }

  if (match(q, "how long", "duration", "runtime", "length")) {
    return {
      kind: "video",
      label: `Full recording · ${manualDuration(manual.durationSeconds)}`,
      detail: manual.equipment,
    };
  }

  if (match(q, "review", "approved", "expert", "who made", "who recorded")) {
    if (!manual.review) return null;
    return { kind: "review", label: `Review · ${manual.review.verdict}`, detail: manual.review.reviewer };
  }

  if (
    match(q, "explain", "procedure", "overview", "about", "walk me through", "summarize", "summary") ||
    match(q, "equipment", "machine")
  ) {
    return {
      kind: "overview",
      label: `Overview · ${manual.steps.length} steps`,
      detail: manual.title,
    };
  }

  return null;
}

export const SUGGESTED_QUESTIONS = [
  "Explain this repair procedure.",
  "What tools are required?",
  "What did the technician do in step 3?",
  "Show me the safety warnings.",
  "What information is missing from this recording?",
];
