import { Clapperboard, FileText } from "lucide-react";
import { manualDuration } from "../utils/format";

export default function EvidencePanel({ manual, evidence, onWatch }) {
  if (!manual) return null;

  return (
    <aside className="bg-surface border border-line rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-xs text-text-subtle">Evidence</h3>
      </div>

      {!evidence ? (
        <p className="p-4 text-sm text-text-subtle">
          The source clip and step behind each answer will show here.
        </p>
      ) : (
        <div>
          <button onClick={onWatch} className="block w-full text-left">
            <div className="h-28 bg-canvas border-b border-line flex items-center justify-center">
              <Clapperboard size={22} className="text-text-subtle" />
            </div>
          </button>

          <div className="p-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-subtle">Clip</p>
              <p className="text-sm mt-0.5">
                {evidence.label}
                {evidence.seconds != null && (
                  <span className="text-text-subtle"> · {manualDuration(evidence.seconds)}</span>
                )}
              </p>
            </div>

            {evidence.detail && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-text-subtle">
                  {evidence.kind === "step" ? "Procedure step" : "Detail"}
                </p>
                <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{evidence.detail}</p>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-subtle">Source manual</p>
              <p className="text-sm mt-0.5 flex gap-1.5">
                <FileText size={14} className="text-text-subtle shrink-0 mt-0.5" />
                {manual.title}
              </p>
            </div>

            <button
              onClick={onWatch}
              className="w-full border border-line text-text rounded-lg py-2 text-sm hover:bg-canvas transition-colors"
            >
              Watch Video
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
