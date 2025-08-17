#!/usr/bin/env node

import { VersionManager } from '../server/utils/version-manager.js';

const title = process.argv[2] || 'Feature Update';
const summary = process.argv[3] || 'New feature or enhancement added';
const changes = process.argv.slice(4).length > 0 ? process.argv.slice(4) : ['Feature enhancement'];

console.log(`🚀 Incrementing update version for: ${title}`);

try {
  const updatedVersion = VersionManager.incrementUpdate(title, summary, changes);
  console.log(`✅ Update version incremented to: ${updatedVersion.version}`);
  console.log(`📋 Changes: ${changes.join(', ')}`);
} catch (error) {
  console.error('❌ Failed to increment update version:', error);
  process.exit(1);
}