import * as fs from 'fs';
import * as path from 'path';
import type { VersionInfo, Release } from '@shared/version';
import { formatVersion, incrementVersion, calculateImpactScore } from '@shared/version';

const VERSION_FILE_PATH = path.resolve(process.cwd(), 'version.json');

export class VersionManager {
  // Helper method to migrate old version format to new format
  private static migrateVersionFormat(versionData: any): VersionInfo {
    // Add build number if missing
    if (versionData.build === undefined) {
      versionData.build = 0;
    }
    
    // Convert version string to include build number if it doesn't have one
    if (versionData.version && versionData.version.split('.').length === 3) {
      versionData.version = `${versionData.version}.000`;
    }
    
    // Migrate releases to include build numbers in version strings
    if (versionData.releases) {
      const migratedReleases: Record<string, any> = {};
      Object.entries(versionData.releases).forEach(([key, release]: [string, any]) => {
        // Convert old version key to new format
        const newKey = key.split('.').length === 3 ? `${key}.000` : key;
        const migratedRelease = {
          ...release,
          version: release.version.split('.').length === 3 ? `${release.version}.000` : release.version
        };
        migratedReleases[newKey] = migratedRelease;
      });
      versionData.releases = migratedReleases;
    }
    
    // Migrate changelog keys
    if (versionData.changelog) {
      const migratedChangelog: Record<string, string> = {};
      Object.entries(versionData.changelog).forEach(([key, value]: [string, any]) => {
        const newKey = key.split('.').length === 3 ? `${key}.000` : key;
        migratedChangelog[newKey] = value;
      });
      versionData.changelog = migratedChangelog;
    }
    
    return versionData;
  }
  
  static getCurrentVersion(): VersionInfo {
    try {
      if (fs.existsSync(VERSION_FILE_PATH)) {
        const versionData = JSON.parse(fs.readFileSync(VERSION_FILE_PATH, 'utf8'));
        return this.migrateVersionFormat(versionData);
      }
    } catch (error) {
      console.error('Error reading version file:', error);
    }
    
    // Default version if file doesn't exist or is corrupted
    return {
      version: "0.01.012.000",
      major: 0,
      minor: 1,
      update: 12,
      build: 0,
      changelog: {
        "0.01.012.000": "Implemented comprehensive version impact scoring to highlight key improvements and system changes"
      },
      releases: {}
    };
  }

  static updateVersion(
    type: 'major' | 'minor' | 'update' | 'build', 
    changelogEntry: string,
    releaseInfo?: {
      title: string;
      summary: string;
      changes: string[];
      technical?: string[];
      consolidateWithPrevious?: boolean; // New option to consolidate
    }
  ): VersionInfo {
    const currentVersion = this.getCurrentVersion();
    const newVersion = incrementVersion(currentVersion, type);
    
    // Add changelog entry
    newVersion.changelog[newVersion.version] = changelogEntry;
    
    // Add release information if provided
    if (releaseInfo) {
      if (!newVersion.releases) {
        newVersion.releases = {};
      }

      // Check if we should consolidate with the previous release
      if (releaseInfo.consolidateWithPrevious && newVersion.releases && Object.keys(newVersion.releases).length > 0) {
        const sortedReleases = Object.keys(newVersion.releases!).sort((a, b) => 
          new Date(newVersion.releases![b].date).getTime() - new Date(newVersion.releases![a].date).getTime()
        );
        const latestReleaseKey = sortedReleases[0];
        const latestRelease = newVersion.releases![latestReleaseKey];
        
        // Check if the titles match (indicating same feature/fix)
        if (latestRelease && latestRelease.title === releaseInfo.title) {
          // Update the existing release instead of creating a new one
          latestRelease.version = newVersion.version; // Update to latest version
          latestRelease.date = new Date().toISOString(); // Update timestamp
          latestRelease.summary = releaseInfo.summary; // Update summary
          
          // Merge changes, avoiding duplicates
          const existingChanges = new Set(latestRelease.changes);
          releaseInfo.changes.forEach(change => {
            if (!existingChanges.has(change)) {
              latestRelease.changes.push(change);
            }
          });
          
          // Merge technical details, avoiding duplicates
          if (releaseInfo.technical) {
            if (!latestRelease.technical) latestRelease.technical = [];
            const existingTechnical = new Set(latestRelease.technical);
            releaseInfo.technical.forEach(tech => {
              if (!existingTechnical.has(tech)) {
                latestRelease.technical!.push(tech);
              }
            });
          }
          
          // Recalculate impact score after consolidation
          latestRelease.impactScore = calculateImpactScore(latestRelease);
          
          // Update the key to the new version
          if (latestReleaseKey !== newVersion.version) {
            newVersion.releases![newVersion.version] = latestRelease;
            delete newVersion.releases![latestReleaseKey];
          }
          
          console.log(`Consolidated release ${newVersion.version} with previous release ${latestReleaseKey}`);
        } else {
          // Create new release as usual
          this.createNewRelease(newVersion, releaseInfo, type);
        }
      } else {
        // Create new release as usual
        this.createNewRelease(newVersion, releaseInfo, type);
      }
    }
    
    // Write to file - make sure to preserve migration
    const finalVersion = this.migrateVersionFormat(newVersion);
    fs.writeFileSync(VERSION_FILE_PATH, JSON.stringify(finalVersion, null, 2));
    
    console.log(`Version updated from ${currentVersion.version} to ${newVersion.version}`);
    console.log(`Changelog: ${changelogEntry}`);
    
    return newVersion;
  }

  private static createNewRelease(
    versionInfo: VersionInfo, 
    releaseInfo: any, 
    type: 'major' | 'minor' | 'update' | 'build'
  ): void {
    if (!versionInfo.releases) {
      versionInfo.releases = {};
    }
    
    const release = {
      version: versionInfo.version,
      date: new Date().toISOString(),
      title: releaseInfo.title,
      type: type === 'major' ? 'major' : type === 'minor' ? 'feature' : type === 'build' ? 'fix' : 'update',
      summary: releaseInfo.summary,
      changes: releaseInfo.changes,
      technical: releaseInfo.technical
    } as Release;
    
    // Calculate and add impact score
    release.impactScore = calculateImpactScore(release);
    
    versionInfo.releases[versionInfo.version] = release;
  }

  static addChangelogEntry(changelogEntry: string): void {
    const currentVersion = this.getCurrentVersion();
    currentVersion.changelog[currentVersion.version] = changelogEntry;
    fs.writeFileSync(VERSION_FILE_PATH, JSON.stringify(currentVersion, null, 2));
  }

  static addRelease(release: Release): void {
    const currentVersion = this.getCurrentVersion();
    if (!currentVersion.releases) {
      currentVersion.releases = {};
    }
    currentVersion.releases[release.version] = release;
    fs.writeFileSync(VERSION_FILE_PATH, JSON.stringify(currentVersion, null, 2));
  }

  // Auto-increment build number - called during build process
  static autoIncrementBuild(buildDescription: string): VersionInfo {
    console.log('Auto-incrementing build number...');
    return this.updateVersion('build', buildDescription, {
      title: `Build Update - ${buildDescription}`,
      summary: `Automated build increment: ${buildDescription}`,
      changes: [buildDescription],
      technical: [`Build number auto-incremented during development`]
    });
  }

  // Increment update version - for new features/enhancements
  static incrementUpdate(title: string, summary: string, changes: string[], technical?: string[]): VersionInfo {
    console.log('Incrementing update version...');
    return this.updateVersion('update', `${title}: ${summary}`, {
      title,
      summary,
      changes,
      technical
    });
  }

  // Increment minor version - requires user approval
  static incrementMinor(title: string, summary: string, changes: string[], technical?: string[]): VersionInfo {
    console.log('Incrementing minor version...');
    return this.updateVersion('minor', `${title}: ${summary}`, {
      title,
      summary,
      changes,
      technical
    });
  }

  // Increment major version - requires user approval
  static incrementMajor(title: string, summary: string, changes: string[], technical?: string[]): VersionInfo {
    console.log('Incrementing major version...');
    return this.updateVersion('major', `${title}: ${summary}`, {
      title,
      summary,
      changes,
      technical
    });
  }
}