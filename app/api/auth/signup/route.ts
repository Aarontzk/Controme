import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createEmailPasswordAccount } from "@/lib/auth/signup-provisioning";

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

function signupError(message: string, status: number) {
  return NextResponse.json({ errors: [{ message }] }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const parsed = signupSchema.safeParse(await request.json());

    if (!parsed.success) {
      return signupError(parsed.error.issues[0]?.message ?? "Invalid signup data.", 400);
    }

    const account = await createEmailPasswordAccount(parsed.data);

    return NextResponse.json(
      {
        data: {
          user: {
            id: account.user.id,
            email: account.user.email,
          },
          role: account.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed.";
    const status = /already|registered|exists|duplicate/i.test(message) ? 409 : 500;
    return signupError(message, status);
  }
}
