import { X, Wrench, ShieldAlert, Clock, Film, ClipboardList, HelpCircle } from "lucide-react";
import { useEffect, useRef } from "react";

import { statusInfo } from "../data/manualStatus";
import { formatDate } from "../utils/format";

function Section({ icon: Icon, title, children }) {
  return (
    <section className="bg-surface border border-line rounded-lg p-4">
      <h3 className="flex items-center gap-2 text-xs text-text-subtle">
        <Icon size={14} />
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function ManualDetail({ manual, onClose, onAsk }) {
  const videoRef = useRef(null);
  const status = statusInfo(manual.status);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const seek = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    video.play();
    video.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={manual.title}
    >
      <div
        className="w-full max-w-4xl bg-canvas rounded-lg border border-line overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 p-5 border-b border-line bg-surface">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-xl font-semibold leading-snug">{manual.title}</h2>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] ${status.pill}`}>
                {status.label}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-text-muted">
              {manual.equipment} · {manual.steps.length} steps · {manual.tools.length} tools ·
              recorded {formatDate(manual.createdAt)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-text-muted hover:bg-canvas hover:text-text transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="p-5 grid gap-4 md:grid-cols-5">
          <div className="md:col-span-3 space-y-4">
            <div className="rounded-lg overflow-hidden border border-line bg-surface">
              <video ref={videoRef} src={manual.videoUrl} controls preload="metadata" className="w-full block" />
            </div>

            <Section icon={ClipboardList} title="Procedure overview">
              <p className="text-sm leading-relaxed text-text-muted">{manual.overview}</p>
            </Section>

            <Section icon={Clock} title="Step-by-step">
              <ol className="space-y-3">
                {manual.steps.map((step, i) => (
                  <li key={step.stamp} className="flex gap-3">
                    <button
                      onClick={() => seek(step.seconds)}
                      className="shrink-0 mt-0.5 text-xs text-text-muted bg-canvas border border-line rounded px-2 py-1 hover:border-text-subtle transition-colors"
                      title="Jump to this moment in the video"
                    >
                      {step.stamp}
                    </button>
                    <div>
                      <p className="text-sm font-medium">
                        <span className="text-text-subtle mr-1.5">{i + 1}.</span>
                        {step.title}
                      </p>
                      <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          </div>

          <div className="md:col-span-2 space-y-4">
            <Section icon={Wrench} title="Tools and components">
              <p className="text-[10px] uppercase tracking-wide text-text-subtle mb-1.5">Tools</p>
              <ul className="space-y-1">
                {manual.tools.map((t) => (
                  <li key={t} className="text-sm text-text-muted flex gap-2">
                    <span className="text-text-subtle">·</span>
                    {t}
                  </li>
                ))}
              </ul>

              <p className="text-[10px] uppercase tracking-wide text-text-subtle mt-3 mb-1.5">
                Components
              </p>
              <ul className="space-y-1">
                {manual.components.map((c) => (
                  <li key={c} className="text-sm text-text-muted flex gap-2">
                    <span className="text-text-subtle">·</span>
                    {c}
                  </li>
                ))}
              </ul>
            </Section>

            <div className="bg-warn-soft border border-warn/20 rounded-lg p-4">
              <h3 className="flex items-center gap-2 text-xs text-warn">
                <ShieldAlert size={14} />
                Safety warnings
              </h3>
              <ul className="mt-2.5 space-y-2">
                {manual.safetyWarnings.map((w) => (
                  <li key={w} className="text-sm text-warn leading-relaxed flex gap-2">
                    <span className="shrink-0">!</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            {manual.missingInfo.length > 0 && (
              <Section icon={HelpCircle} title="Missing information">
                <ul className="space-y-2">
                  {manual.missingInfo.map((m) => (
                    <li key={m} className="text-sm text-bad bg-bad-soft border border-bad/20 rounded-lg px-3 py-2 leading-relaxed">
                      {m}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section icon={Film} title="Expert review">
              {manual.review ? (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">
                    {manual.review.reviewer}
                    <span className="text-xs text-text-subtle ml-2">{formatDate(manual.review.date)}</span>
                  </p>
                  <p className="text-sm text-text-muted leading-relaxed">{manual.review.notes}</p>
                </div>
              ) : (
                <p className="text-sm text-text-subtle italic">
                  No expert has reviewed this manual yet.
                </p>
              )}

              <button
                onClick={() => onAsk(manual)}
                className="mt-3 w-full border border-line text-text rounded-lg py-2 text-sm hover:bg-canvas transition-colors"
              >
                Ask the assistant about this manual
              </button>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
