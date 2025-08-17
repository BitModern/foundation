#!/usr/bin/env tsx

import { VersionManager } from '../server/utils/version-manager';

// Simpler version for development server integration
const timestamp = new Date().toLocaleTimeString();
const buildNote = `Development server restart - ${timestamp}`;

try {
  const updatedVersion = VersionManager.autoIncrementBuild(buildNote);
  console.log(`🔄 Development build auto-incremented to: ${updatedVersion.version}`);
} catch (error) {
  console.log(`⚠️ Version auto-increment failed: ${error.message}`);
}