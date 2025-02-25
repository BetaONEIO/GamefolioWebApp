import { makeUserAdmin } from '../lib/admin';

async function main() {
  try {
    await makeUserAdmin('tom@betaone.io');
    console.log('Successfully made tom@betaone.io an admin');
  } catch (error) {
    console.error('Failed to make user admin:', error);
    process.exit(1);
  }
}

main();