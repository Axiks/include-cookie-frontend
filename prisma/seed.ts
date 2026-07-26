// import { prisma } from "../lib/prisma";

import { PrismaClient } from "..//.generated/prisma";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma =
  globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const initialStack = [
    { name: 'Python' },
    { name: 'C++' },
    { name: 'C' },
    { name: 'Java' },
    { name: 'C#' },
    { name: 'JavaScript' },
    { name: 'TypeScript' },
    { name: 'Go' },
    { name: 'Visual Basic' },
    { name: 'F#' },
    { name: 'PHP' },
    { name: 'R' },
    { name: 'Ruby' },
    { name: 'Swift' },
    { name: 'Rust' },
    { name: 'Perl' },
    { name: 'Delphi' },
    { name: 'Kotlin' },
    { name: 'Assembly language' },
    { name: 'Visual Basic' },
    { name: 'MATLAB' },
    { name: 'Objective-C' },
    { name: 'Scratch' },
    { name: 'COBOL' },
    { name: 'Dart' },
    { name: 'Scala' },
    { name: 'Prolog' },
    { name: 'Lua' },
    { name: 'Haskell' },
    { name: 'Ada' },
    { name: 'Fortran' },
    { name: 'Lisp' },

    // { name: 'HTML' },
    // { name: 'CSS' },
    // { name: 'SQL' },
    // { name: 'ML' },
    // { name: '' },
];

const seed = async () => {
  // clean up before the seeding (optional)
  await prisma.stack.deleteMany();

  for (const stack of initialStack) {
    await prisma.stack.create({
      data: stack,
    });
  }
};

seed();