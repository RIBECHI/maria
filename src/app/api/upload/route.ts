
// This API route is no longer needed with the client-side upload strategy.
// It can be deleted. We will clear its content to prevent it from being used.
// The upload logic is now handled by a rewrite rule in next.config.js
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    return NextResponse.json({ error: "This API route is deprecated. Uploads are handled by a Next.js rewrite proxy." }, { status: 410 });
}
