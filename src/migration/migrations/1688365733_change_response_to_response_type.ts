import { MigrationContext } from 'migration/types';

export const run = async ({ prisma, functionService }: MigrationContext): Promise<void> => {
  const apiFunctions = await prisma.apiFunction.findMany();

  for (const apiFunction of apiFunctions) {
    await prisma.apiFunction.update({
      where: {
        id: apiFunction.id,
      },
      data: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        responseType: await functionService.getResponseType(
          apiFunction.responseType ? JSON.parse(apiFunction.responseType) : null,
          apiFunction.payload,
        ),
      },
    });
  }
};
