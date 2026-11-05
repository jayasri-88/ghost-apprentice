import { useEffect, useRef, useState } from "react";
import { UploadCloud, Video, CheckCircle, Loader2, Clapperboard } from "lucide-react";
import { Link } from "react-router-dom";

import { analyzeVideo, getAnalysisStatus, uploadVideo } from "../services/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const pickFile = (f) => {
    setFile(f);
    setResult(null);
    setError("");
    setProgress(0);
    setAnalysis(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a video first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setAnalysis(null);

    try {
      const data = await uploadVideo(file, setProgress);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Video upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    setError("");
    try {
      const { analysis_id } = await analyzeVideo(result.video_id);
      setAnalysis({ id: analysis_id, stage: "queued", percent: 0, message: "Queued..." });

      pollRef.current = setInterval(async () => {
        try {
          const st = await getAnalysisStatus(analysis_id);
          setAnalysis(st);
          if (st.stage === "done" || st.stage === "failed") {
            clearInterval(pollRef.current);
            if (st.stage === "failed") setError(st.error || "Analysis failed.");
          }
        } catch {
          clearInterval(pollRef.current);
          setError("Lost contact with the analysis service.");
        }
      }, 1500);
    } catch (err) {
      setError(
        err.response?.status === 409
          ? "This video is already being analysed."
          : err.response?.data?.detail || "Could not start the analysis."
      );
    }
  };

  const analyzing = analysis && analysis.stage !== "done" && analysis.stage !== "failed";
  const done = analysis?.stage === "done";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-semibold">Upload Technician Recording</h1>
      <p className="text-text-muted text-sm mt-1">
        A repair demonstration recorded by an expert technician.
      </p>

      <div className="bg-surface border border-line rounded-lg p-6 mt-6">
        <label
          className={`border border-dashed rounded-lg p-10 flex flex-col items-center cursor-pointer transition-colors ${
            dragging ? "border-text bg-canvas" : "border-line hover:border-text-subtle"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files[0]) pickFile(e.dataTransfer.files[0]);
          }}
        >
          <UploadCloud size={36} className="text-text-subtle" />
          <p className="font-medium mt-3">Drag a video here, or click to browse</p>
          <p className="text-xs text-text-subtle mt-1">mp4, mov, webm or avi — 100 MB max</p>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            className="hidden"
            onChange={(e) => pickFile(e.target.files[0])}
          />
        </label>

        {file && (
          <div className="flex items-center gap-3 border border-line p-3 rounded-lg mt-4">
            <Video size={18} className="text-text-muted" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{file.name}</p>
              <p className="text-xs text-text-subtle">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-text-muted mb-1.5">
              <span>Uploading video...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-canvas border border-line rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-text rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <p className="text-bad text-sm mt-4 bg-bad-soft border border-bad/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {result && !analysis && (
          <div className="bg-good-soft border border-good/20 rounded-lg p-4 mt-5">
            <div className="flex items-center gap-2 text-good font-medium text-sm">
              <CheckCircle size={17} />
              Video uploaded successfully
            </div>
            <p className="text-sm text-text mt-2 font-mono">Video ID: {result.video_id}</p>
            <button
              onClick={startAnalysis}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-text hover:bg-neutral-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Clapperboard size={16} />
              Generate knowledge manual
            </button>
            <p className="text-xs text-text-muted mt-2">
              Runs fully locally with Ollama. Expect a few minutes per recording on a small GPU.
            </p>
          </div>
        )}

        {analysis && (
          <div className="border border-line rounded-lg p-4 mt-5">
            <div className="flex justify-between text-xs text-text-muted mb-1.5">
              <span>{done ? "Manual generated" : analyzing ? "Analyzing..." : "Analysis failed"}</span>
              <span>{analysis.percent}%</span>
            </div>
            <div className="w-full bg-canvas border border-line rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${done ? "bg-good" : "bg-text"}`}
                style={{ width: `${analysis.percent}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">
              {analysis.message || analysis.error}
            </p>
            {done && (
              <Link
                to="/manuals"
                className="inline-block mt-3 text-sm text-text underline hover:text-text-muted transition-colors"
              >
                Open it in Knowledge Manuals
              </Link>
            )}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading || analyzing}
          className="w-full mt-5 bg-text hover:bg-neutral-800 disabled:bg-line disabled:text-text-subtle text-white py-2.5 rounded-lg text-sm font-medium flex justify-center items-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Uploading...
            </>
          ) : (
            "Upload Recording"
          )}
        </button>
      </div>
    </div>
  );
}
