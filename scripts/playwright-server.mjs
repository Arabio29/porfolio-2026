import { spawn } from 'node:child_process';

const url = 'http://127.0.0.1:4321/';
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function available() {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

let server;
if (!(await available())) {
  server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  server.on('exit', (code) => process.exit(code ?? 1));

  for (let attempt = 0; attempt < 120 && !(await available()); attempt += 1) {
    await wait(250);
  }
}

if (!(await available())) {
  server?.kill();
  throw new Error(`Astro did not become available at ${url}`);
}

const shutdown = () => {
  server?.kill();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Playwright owns this process for the duration of the suite.
await new Promise(() => {});
