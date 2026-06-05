import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      errors: [
        {
          message:
            "Public account creation is disabled. Ask an administrator to create employee accounts.",
        },
      ],
    },
    { status: 403 }
  );
}
