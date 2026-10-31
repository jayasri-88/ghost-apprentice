import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
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

export default api;
