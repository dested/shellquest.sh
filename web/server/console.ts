import {PrismaClient} from './generated/prisma';
import {env} from './env';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});





async function main() {


  try {
    // await createCompaniesFromFolder('5992162', 'cmch4r0cc0000lnjce4xukw1b');
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
}

main()
  .then(async () => {})
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  });
