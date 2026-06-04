export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$connect();
  }

  // In production, override console methods to prevent logging sensitive information.
  // if (!__DEV__) {
  //   console.log = () => {};
  //   console.debug = () => {};
  //   console.info = () => {};
  //   console.warn = () => {};
  //   console.error = () => {};
  // }
}
