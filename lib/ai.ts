import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const configuredModels = process.env.OPENAI_API_KEY ? [process.env.OPENAI_MODEL || "gpt-4o-mini"] : [];

export function streamChat(model: string, messages: { role: "user" | "assistant" | "system"; content: string }[]) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
  if (!configuredModels.includes(model)) throw new Error("Selected model is not configured.");
  return streamText({ model: openai(model), messages });
}
