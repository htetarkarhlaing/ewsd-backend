import { PrismaClient } from '@prisma/client';
// const permissionList = ['*', 'dashboard-view'];

const prisma = new PrismaClient();

export const generateRole = async () => {
  const role = await prisma.accountRole.findFirst({
    where: {
      name: 'Super Admin',
    },
  });

  if (!role) {
    await prisma.accountRole.create({
      data: {
        name: 'Super Admin',
        description: 'Super privilege',
        permissions: '*',
      },
    });
  }
};
