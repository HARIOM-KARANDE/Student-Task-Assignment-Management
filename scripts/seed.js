const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');

// Find the best python executable
const venvWindows = path.join(rootDir, 'backend', 'venv', 'Scripts', 'python.exe');
const venvPosix = path.join(rootDir, 'backend', 'venv', 'bin', 'python');

let pythonBin = 'python';
if (fs.existsSync(venvWindows)) {
  pythonBin = venvWindows;
} else if (fs.existsSync(venvPosix)) {
  pythonBin = venvPosix;
}

const seedScript = path.join(rootDir, 'backend', 'seed.py');

console.log(`[SEED] Executing database seeder using: ${pythonBin}`);

const child = spawn(pythonBin, [seedScript], {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PYTHONPATH: rootDir,
  }
});

child.on('error', (err) => {
  console.error('[SEED ERROR] Failed to start seed process:', err);
  process.exit(1);
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`[SEED ERROR] Seeder exited with code ${code}`);
    process.exit(code);
  }
  process.exit(0);
});
