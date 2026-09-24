import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("[AI] OPENAI_API_KEY is not configured.");
}

const openai = createOpenAI({
  apiKey,
});

export const configuredModels = [
  process.env.OPENAI_MODEL || "gpt-4o-mini",
];

export function streamChat(
  model: string,
  messages: {
    role: "user" | "assistant" | "system";
    content: string;
  }[]
) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!configuredModels.includes(model)) {
    throw new Error(`Selected model "${model}" is not configured.`);
  }

  console.log("[AI] Starting generation with model:", model);
  console.log("[AI] Messages:", messages.length);

  return streamText({
    model: openai(model),
    messages,

    onError({ error }) {
      console.error("[AI] Streaming error:", error);
    },
  });
}