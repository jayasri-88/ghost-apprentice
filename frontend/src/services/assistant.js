import api from "./api";

// The FastAPI route allows Ollama up to 180s; stay just above it so a slow
// local model finishes instead of tripping the timeout.
const ASSISTANT_TIMEOUT_MS = 200000;

export const sendMessage = async (question, manualContext) => {
  const response = await api.post(
    "/assistant/chat",
    {
      question: question,
      manual_context: manualContext,
    },
    { timeout: ASSISTANT_TIMEOUT_MS }
  );

  return response.data;
};