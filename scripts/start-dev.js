const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';

// 1. Python binary
const venvWindows = path.join(rootDir, 'backend', 'venv', 'Scripts', 'python.exe');
const venvPosix = path.join(rootDir, 'backend', 'venv', 'bin', 'python');

let pythonBin = 'python';
if (fs.existsSync(venvWindows)) {
  pythonBin = venvWindows;
} else if (fs.existsSync(venvPosix)) {
  pythonBin = venvPosix;
}

console.log('====================================================');
console.log(' Starting Student Task & Assignment Management System');
console.log('====================================================');

// Start FastAPI Backend
console.log('[BACKEND] Launching FastAPI on http://127.0.0.1:8000 ...');
const backend = spawn(pythonBin, ['-m', 'uvicorn', 'backend.app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PYTHONPATH: rootDir,
  }
});

// Start Vite Frontend
console.log('[FRONTEND] Launching Vite on http://localhost:5173 ...');
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'frontend'),
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\nStopping servers...');
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
