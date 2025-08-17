#!/usr/bin/env tsx

import { VersionManager } from '../server/utils/version-manager';
import * as fs from 'fs';
import * as path from 'path';

// Auto-increment build when called during development
const generateBuildNote = (): string => {
  const timestamp = new Date().toLocaleTimeString();
  const changeTypes = [
    'Development iteration',
    'Code refinement', 
    'Bug fixes',
    'UI improvements',
    'Performance optimization',
    'Testing changes'
  ];
  
  const randomType = changeTypes[Math.floor(Math.random() * changeTypes.length)];
  return `${randomType} - ${timestamp}`;
};

// Only auto-increment if we're in development mode
if (process.env.NODE_ENV === 'development') {
  try {
    const buildNote = generateBuildNote();
    console.log(`🔄 Auto-incrementing build: ${buildNote}`);
    
    const updatedVersion = VersionManager.autoIncrementBuild(buildNote);
    console.log(`⚡ Auto-incremented to: ${updatedVersion.version}`);
  } catch (error) {
    // Don't fail the development process if version increment fails
    console.log(`⚠️ Auto-increment skipped: ${error.message}`);
  }
} else {
  console.log('🚫 Auto-increment disabled in production mode');
}