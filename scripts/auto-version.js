#!/usr/bin/env node

import { VersionManager } from '../server/utils/version-manager.js';

// This script can be called automatically during development
// It auto-increments build numbers with a timestamp

const buildDescription = `Development build - ${new Date().toLocaleTimeString()}`;

console.log('🔄 Auto-incrementing build for development...');

try {
  const updatedVersion = VersionManager.autoIncrementBuild(buildDescription);
  console.log(`⚡ Auto-incremented to: ${updatedVersion.version}`);
} catch (error) {
  console.error('❌ Auto-increment failed:', error);
  // Don't exit with error for development builds
}