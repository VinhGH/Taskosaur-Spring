#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const backendDir = path.resolve(__dirname, '..', 'backend');
const cmd = isWin ? path.join(backendDir, 'mvnw.cmd') : path.join(backendDir, 'mvnw');
const args = process.argv.slice(2);

const child = spawn(cmd, args, {
  cwd: backendDir,
  stdio: 'inherit',
  shell: isWin
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
