import { getStacks } from "@/features/stack/Stack";
import { ResponceHandler, witchUser, withAuth } from "@/lib/api-middleware/with-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function secretGET(request: NextRequest, context: ResponceHandler) {
  const inDevEnvironment = !!process && process.env.NODE_ENV === 'development';
  if(!inDevEnvironment) return NextResponse.json({
    "error": "not found",
  });

  const users = await prisma.user.findMany()
  const stacks = await getStacks()

  return NextResponse.json({
    "users": users,
    "stacks": stacks,
  });
}

// Action to read
export const GET = witchUser(secretGET);