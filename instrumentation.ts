export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
    const { prisma } = await import("@/lib/prisma");
    await prisma.$connect();
  }
}
