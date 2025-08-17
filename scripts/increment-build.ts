#!/usr/bin/env tsx

import { VersionManager } from '../server/utils/version-manager';

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