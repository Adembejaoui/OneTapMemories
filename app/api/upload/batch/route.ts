import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Use /api/upload/url for direct client uploads", code: "DEPRECATED" },
    { status: 410 }
  );
}