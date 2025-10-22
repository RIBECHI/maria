
// This API route is no longer needed with the client-side upload strategy.
// It can be deleted. We will clear its content to prevent it from being used.

import { NextResponse } from "next/server";

export async function POST(request: Request) {
    return NextResponse.json({ error: "This API route is deprecated. Uploads are now handled on the client-side." }, { status: 410 });
}
