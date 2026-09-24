import { z } from "zod";
export const registerSchema = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(8).max(128) });
export const chatSchema = z.object({ conversationId: z.string().cuid(), content: z.string().min(1).max(20000), model: z.string().min(1).max(100) });
export const conversationSchema = z.object({ title: z.string().min(1).max(120).optional() });
