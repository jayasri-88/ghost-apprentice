import axios from "axios";

export const API_ORIGIN = "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
});

export async function uploadVideo(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/videos/upload", formData, {
    onUploadProgress: (progressEvent) => {
      const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress?.(percentage);
    },
  });

  return response.data;
}

// Manual pipeline. The backend serves the same manual shape the cards use;
// only the relative videoUrl needs the API origin prepended for playback.
export const analyzeVideo = (videoId) =>
  api.post("/manuals/analyze", { video_id: videoId }).then((r) => r.data);

export const getAnalysisStatus = (analysisId) =>
  api.get(`/manuals/analyze/${analysisId}`).then((r) => r.data);

export const fetchManuals = () =>
  api.get("/manuals").then((r) =>
    r.data.manuals.map((m) =>
      m.videoUrl ? { ...m, videoUrl: API_ORIGIN + m.videoUrl } : m
    )
  );

export default api;
