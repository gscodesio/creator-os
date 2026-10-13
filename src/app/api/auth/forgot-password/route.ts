import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateSecureToken } from "@/lib/server/auth";
import { sendPasswordResetEmail } from "@/lib/server/email";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = forgotSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: (result.error as any).issues?.[0]?.message || "Invalid email" },
        { status: 400 }
      );
    }

    const normalizedEmail = result.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Security practice: Return generic response regardless of whether email exists to prevent user enumeration
    if (user) {
      const resetToken = generateSecureToken(32);
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
        },
      });

      sendPasswordResetEmail(user.email, resetToken).catch((err) =>
        console.error("Failed sending password reset email:", err)
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists for that email address, a password reset link has been generated and sent.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
