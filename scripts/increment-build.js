#!/usr/bin/env node

// Use tsx to run TypeScript directly
const { spawn } = await import('child_process');
const { promisify } = await import('util');
const execAsync = promisify(spawn);

// Instead, use tsx to run a TypeScript script
const args = process.argv.slice(2);
const description = args[0] || 'Development build';

console.log(`🔨 Running TypeScript version manager...`);

// Run tsx with the TypeScript file
const child = spawn('npx', ['tsx', 'scripts/increment-build.ts', description], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

const buildDescription = process.argv[2] || 'Development build';

console.log(`🔨 Auto-incrementing build version for: ${buildDescription}`);

try {
  const updatedVersion = VersionManager.autoIncrementBuild(buildDescription);
  console.log(`✅ Build version incremented to: ${updatedVersion.version}`);
  console.log(`📝 Description: ${buildDescription}`);
} catch (error) {
  console.error('❌ Failed to increment build version:', error);
  process.exit(1);
}