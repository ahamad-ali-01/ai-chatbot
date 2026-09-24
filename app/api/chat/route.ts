import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { streamChat } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // Authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please sign in." },
        { status: 401 }
      );
    }

    // Validate request
    const body = await req.json();

    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid chat request." },
        { status: 400 }
      );
    }

    const {
      conversationId,
      content,
      model,
    } = parsed.data;

    // Rate limit
    const limit = await rateLimit(`chat:${session.user.id}`);

    if (!limit.success) {
      return NextResponse.json(
        {
          error:
            "You have reached the request limit. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Verify conversation ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId,
        role: "user",
        content,
        model,
      },
    });

    // Get conversation history
    const history = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 40,
    });

    const messages = history.map((message) => ({
      role: message.role as "user" | "assistant" | "system",
      content: message.content,
    }));

    console.log("[CHAT] Generating response...");
    console.log("[CHAT] Model:", model);
    console.log("[CHAT] History:", messages.length);

    // Start AI stream
    const result = streamChat(model, messages);

    /*
     * Save the generated answer after the stream finishes.
     *
     * result.text is a Promise that resolves when generation completes.
     */
    result.text
      .then(async (fullText) => {
        if (!fullText.trim()) {
          console.warn("[CHAT] AI returned an empty response.");
          return;
        }

        console.log(
          "[CHAT] AI response generated:",
          fullText.substring(0, 100)
        );

        try {
          await prisma.message.create({
            data: {
              conversationId,
              role: "assistant",
              content: fullText,
              model,
            },
          });

          if (conversation.title === "New conversation") {
            const title = content
              .replace(/\s+/g, " ")
              .slice(0, 60);

            await prisma.conversation.update({
              where: {
                id: conversationId,
              },
              data: {
                title,
              },
            });
          }

          console.log("[CHAT] Assistant message saved.");
        } catch (dbError) {
          console.error(
            "[CHAT] Failed to save assistant message:",
            dbError
          );
        }
      })
      .catch((error) => {
        console.error(
          "[CHAT] Failed to generate AI response:",
          error
        );
      });

    // Return plain text stream to frontend
    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[CHAT] Route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI service unavailable.",
      },
      { status: 500 }
    );
  }
}