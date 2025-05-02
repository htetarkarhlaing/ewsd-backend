import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { genSaltSync, hashSync } from 'bcrypt';
import { generateRole } from './roleAndPermission';

const masterAdmin = {
  email: process.env.EMAIL || 'admin@apex.com.edu',
  name: process.env.NAME || 'admin',
  username: process.env.USERNAME || 'admin',
  password: process.env.PASSWORD || 'admin',
};

const prisma = new PrismaClient();

async function main() {
  await generateRole();
  const admin = await prisma.account.findFirst({
    where: {
      AccountRoleType: 'ADMIN',
    },
  });

  if (!admin) {
    const role = await prisma.accountRole.findFirst();

    const salt = genSaltSync(10);
    const hashedPassword = hashSync(masterAdmin.password, salt);

    const createdAccountInfo = async () => {
      return await prisma.accountInfo.create({
        data: {
          name: masterAdmin.name,
          Avatar: {
            create: {
              name: 'avatar.png',
              path: 'https://www.pngkit.com/png/detail/799-7998601_profile-placeholder-person-icon.png',
              type: 'image/png',
            },
          },
        },
      });
    };

    if (role) {
      await prisma.account.create({
        data: {
          username: masterAdmin.name,
          email: masterAdmin.email,
          password: hashedPassword,
          AccountRoleType: 'ADMIN',
          AccountStatus: 'ACTIVE',
          accountRoleId: role.id,
          accountInfoId: (await createdAccountInfo()).id,
        },
      });
    }
  }

  const addedNotification = await prisma.notification.createMany({
    data: [
      {
        title: `test 1`,
        content: `test desc 1`,
        studentId: '68123581d1050d45078ac4a4',
      },
      {
        title: `test 2`,
        content: `test desc 2`,
        studentId: '68123581d1050d45078ac4a4',
      },
      {
        title: `test 3`,
        content: `test desc 3`,
        studentId: '68123581d1050d45078ac4a4',
      },
      {
        title: `test 4`,
        content: `test desc 4`,
        studentId: '68123581d1050d45078ac4a4',
      },
      {
        title: `test 1`,
        content: `test desc 1`,
        studentId: '68123581d1050d45078ac4a4',
      },
      {
        title: `test 2`,
        content: `test desc 2`,
        studentId: '68123581d1050d45078ac4a4',
      },
      {
        title: `test 3`,
        content: `test desc 3`,
        studentId: '68123581d1050d45078ac4a4',
      },
      {
        title: `test 4`,
        content: `test desc 4`,
        studentId: '68123581d1050d45078ac4a4',
      },
    ],
  });

  console.log(addedNotification);
}
void main();
