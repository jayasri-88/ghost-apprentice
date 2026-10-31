import { useLocation } from "react-router-dom";

const pageNames = {
  "/": "Studio",
  "/upload": "Upload",
  "/manuals": "Manuals",
  "/ghost": "Assistant",
};

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="h-16 bg-surface border-b border-line flex items-center justify-between px-6 sticky top-0 z-10">
      <h2 className="font-display text-lg font-semibold text-text">
        {pageNames[pathname] || "Workspace"}
      </h2>

      <div className="w-8 h-8 rounded-full bg-canvas border border-line text-text flex items-center justify-center font-mono text-xs">
        JA
      </div>
    </header>
  );
}
