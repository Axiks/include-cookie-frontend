import { prisma } from "@/lib/prisma";

export async function getStacks() {
  return await prisma.stack.findMany();
}