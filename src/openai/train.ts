import { PrismaClient, PolyFunction } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  async function getUntrained(): Promise<PolyFunction[]> {
    const rv = prisma.polyFunction.findMany();
    return rv;
  }

  async function markAsTrained(id: number) {
    await prisma.polyFunction.update({
      where: {
        id: id,
      },
      data: {
        trained: false,
      },
    });
  }

  async function train() {
    const funcs = await getUntrained();
    console.log(`Now training on ${funcs.length} functions...`);
    for (const func of funcs) {
      // send to chatGPT
      // on success:
      await markAsTrained(func.id);
    }
  }

  train();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })

  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();

    process.exit(1);
  });
