import { BookOpen, Clock, Upload, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";

const stats = [
  { title: "Recordings", description: "Total uploaded recordings", icon: Video },
  { title: "Knowledge Manuals", description: "Approved repair procedures", icon: BookOpen },
  { title: "Apprentices", description: "Training participants", icon: Users },
  { title: "Training Hours", description: "Knowledge preserved", icon: Clock },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <section className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Welcome to Ghost Apprentice</h1>
          <p className="text-text-muted text-sm mt-1">
            Upload recordings from expert technicians and turn them into training.
          </p>
        </div>

        <Link
          to="/upload"
          className="flex items-center gap-2 bg-text text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Upload size={16} />
          Upload Recording
        </Link>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} value="0" {...s} />
        ))}
      </section>

      {/* TODO: replace this with the real recordings list once the API has one */}
      <section className="bg-surface border border-line rounded-lg p-10 text-center">
        <div className="mx-auto w-12 h-12 bg-canvas border border-line rounded-full flex items-center justify-center text-text-subtle">
          <Video size={22} />
        </div>
        <h2 className="font-display text-lg font-semibold mt-4">Nothing uploaded yet</h2>
        <p className="text-text-muted text-sm mt-2 max-w-md mx-auto">
          Upload a technician recording and it will be turned into a
          step-by-step training manual.
        </p>
        <Link
          to="/upload"
          className="inline-block mt-5 border border-line text-text px-4 py-2 rounded-lg text-sm hover:bg-canvas transition-colors"
        >
          Upload your first video
        </Link>
      </section>
    </div>
  );
}
