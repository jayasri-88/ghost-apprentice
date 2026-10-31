// Serializes a manual object into the plain-text block the local Qwen model
// is prompted with. Send the whole procedure so the model can cite steps,
// tools and warnings, and so it can tell when something genuinely isn't there.
export function manualToContext(manual) {
  const list = (items) => items.map((i) => `  - ${i}`).join("\n");
  const steps = manual.steps
    .map((s, i) => `  ${i + 1}. [${s.stamp}] ${s.title}: ${s.detail}`)
    .join("\n");

  return [
    `TITLE: ${manual.title}`,
    `EQUIPMENT: ${manual.equipment}`,
    ``,
    `OVERVIEW: ${manual.overview}`,
    ``,
    `TOOLS:\n${list(manual.tools)}`,
    ``,
    `COMPONENTS:\n${list(manual.components)}`,
    ``,
    `SAFETY WARNINGS:\n${list(manual.safetyWarnings)}`,
    ``,
    `PROCEDURE STEPS:\n${steps}`,
    ``,
    manual.missingInfo.length
      ? `KNOWN GAPS (flagged in review):\n${list(manual.missingInfo)}`
      : `KNOWN GAPS: none flagged`,
    ``,
    manual.review
      ? `EXPERT REVIEW (${manual.review.verdict}) by ${manual.review.reviewer}: ${manual.review.notes}`
      : `EXPERT REVIEW: not reviewed yet`,
  ].join("\n");
}
