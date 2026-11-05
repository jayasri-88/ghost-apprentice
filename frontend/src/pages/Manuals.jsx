import { useEffect, useMemo, useState } from "react";
import { Search, BookOpen, CheckCircle, Clock, ListChecks } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import ManualCard from "../components/ManualCard";
import ManualDetail from "../components/ManualDetail";
import StatCard from "../components/StatCard";
import sampleManuals from "../data/manuals";
import { fetchManuals } from "../services/api";
import { FILTERS } from "../data/manualStatus";

const isPending = (m) => m.status === "pending" || m.status === "pending_expert_review";

const statsFor = (list) => [
  { title: "Total Manuals", value: list.length, description: "In the knowledge library", icon: BookOpen },
  {
    title: "Approved",
    value: list.filter((m) => m.status === "approved").length,
    description: "Ready for apprentice training",
    icon: CheckCircle,
  },
  {
    title: "Pending Review",
    value: list.filter(isPending).length,
    description: "Waiting on a technician sign-off",
    icon: Clock,
  },
  {
    title: "Total Procedures",
    value: list.reduce((sum, m) => sum + m.steps.length, 0),
    description: "Documented steps across all manuals",
    icon: ListChecks,
  },
];

export default function Manuals() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [manuals, setManuals] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchManuals()
      .then((list) => {
        if (!cancelled) setManuals(list);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Could not reach the backend at http://localhost:8000.");
          setManuals([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = manuals === null;
  // Fall back to the bundled sample library only while the API is unreachable,
  // so the page is never blank during a backend restart.
  const library = !loading && manuals.length === 0 && loadError ? sampleManuals : manuals;

  const visible = useMemo(() => {
    if (!library) return [];
    const q = query.trim().toLowerCase();
    return library.filter((m) => {
      const matchesFilter =
        filter === "all" || (filter === "pending" ? isPending(m) : m.status === filter);
      const matchesQuery =
        !q || m.title.toLowerCase().includes(q) || m.equipment.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [library, query, filter]);

  const askAssistant = (manual) => {
    navigate("/ghost", { state: { manualId: manual.id } });
  };

  const counts = useMemo(() => {
    const map = { all: library?.length ?? 0 };
    for (const m of library ?? []) {
      const key = isPending(m) ? "pending" : m.status;
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [library]);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <section>
        <h1 className="font-display text-2xl font-semibold">Knowledge Manuals</h1>
        <p className="text-text-muted text-sm mt-1 max-w-2xl">
          Step-by-step procedures pulled from technician recordings. Every manual is
          reviewed by the person who did the work before it trains an apprentice.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsFor(library ?? []).map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </section>

      {loadError && (
        <p className="text-xs text-warn bg-warn-soft border border-warn/20 rounded-lg px-4 py-2.5">
          {loadError} Showing the sample library instead — generated manuals appear here once
          the backend is reachable.
        </p>
      )}

      <section className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by procedure or equipment"
            className="w-full bg-surface border border-line rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-text-subtle focus:outline-none focus:border-text-subtle transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm border transition-colors ${
                filter === f.value
                  ? "bg-text text-white border-text"
                  : "bg-surface text-text-muted border-line hover:border-text-subtle hover:text-text"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-60">{counts[f.value] ?? 0}</span>
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <section className="bg-surface border border-line rounded-lg p-10 text-center text-sm text-text-subtle">
          Loading manuals...
        </section>
      ) : visible.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((manual) => (
            <ManualCard key={manual.id} manual={manual} onView={setSelected} onAsk={askAssistant} />
          ))}
        </section>
      ) : library.length === 0 ? (
        <section className="bg-surface border border-line rounded-lg p-10 text-center">
          <h2 className="font-display text-lg font-semibold">No generated manuals yet</h2>
          <p className="text-text-muted text-sm mt-1">
            Upload a technician recording and run the analysis to build the library.
          </p>
          <Link
            to="/upload"
            className="inline-block mt-4 bg-text text-white px-4 py-2 rounded-lg text-sm hover:bg-neutral-800 transition-colors"
          >
            Go to Upload
          </Link>
        </section>
      ) : (
        <section className="bg-surface border border-line rounded-lg p-10 text-center">
          <h2 className="font-display text-lg font-semibold">No manuals match that</h2>
          <p className="text-text-muted text-sm mt-1">
            Try a different equipment name, or clear the status filter.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            className="mt-4 border border-line text-text px-4 py-2 rounded-lg text-sm hover:bg-canvas transition-colors"
          >
            Reset search
          </button>
        </section>
      )}

      {selected && (
        <ManualDetail manual={selected} onClose={() => setSelected(null)} onAsk={askAssistant} />
      )}
    </div>
  );
}
