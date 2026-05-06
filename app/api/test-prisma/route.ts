import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$connect();

    return Response.json({
      success: true,
      message: "Prisma connected successfully 🚀",
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: "Prisma connection failed ❌",
        error: error.message,
      },
      { status: 500 }
    );
  }
}