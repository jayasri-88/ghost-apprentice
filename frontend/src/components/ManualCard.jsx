import { Video } from "lucide-react";
import { formatDate, manualDuration } from "../utils/format";
import { statusInfo } from "../data/manualStatus";

export default function ManualCard({ manual, onView, onAsk }) {
  const status = statusInfo(manual.status);

  return (
    <article className="bg-surface border border-line rounded-lg overflow-hidden flex flex-col hover:border-text-subtle transition-colors">
      <div className="relative h-36 bg-canvas border-b border-line flex items-center justify-center">
        <Video size={26} className="text-text-subtle" />
        <span className="absolute bottom-2 right-2 text-[11px] bg-surface border border-line rounded px-1.5 py-0.5 text-text-muted">
          {manualDuration(manual.durationSeconds)}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium text-[15px] leading-snug">{manual.title}</h3>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${status.pill}`}>
            {status.label}
          </span>
        </div>

        <p className="text-sm text-text-muted mt-1">{manual.equipment}</p>

        <p className="text-xs text-text-subtle mt-3">
          {manual.steps.length} steps · {manual.tools.length} tools ·{" "}
          {manual.safetyWarnings.length} warnings
        </p>

        <p className="text-xs text-text-subtle mt-1">Created {formatDate(manual.createdAt)}</p>

        <div className="mt-4 pt-4 border-t border-line flex gap-2">
          <button
            onClick={() => onView(manual)}
            className="flex-1 bg-text hover:bg-neutral-800 text-white text-sm py-2 rounded-lg transition-colors"
          >
            View Manual
          </button>
          <button
            onClick={() => onAsk(manual)}
            className="flex-1 border border-line text-text-muted hover:bg-canvas hover:text-text text-sm py-2 rounded-lg transition-colors"
          >
            Ask Assistant
          </button>
        </div>
      </div>
    </article>
  );
}
