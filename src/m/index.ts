import { connection } from './server';

const scriptExec = process.argv[2];
if (scriptExec === '--stdio') {
  connection.listen();
}
