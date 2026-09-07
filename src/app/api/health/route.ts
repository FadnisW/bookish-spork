import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Execute a lightweight query to keep both the web server and Render database active
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "online",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Database connection error",
      },
      { status: 500 }
    );
  }
}
