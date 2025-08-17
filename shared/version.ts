// Version management utilities
export interface Release {
  version: string;
  date: string;
  title: string;
  type: 'major' | 'feature' | 'update' | 'fix';
  summary: string;
  changes: string[];
  technical?: string[];
  impactScore?: number; // New field for impact scoring
}

export interface VersionInfo {
  version: string;
  major: number;
  minor: number;
  update: number;
  build: number;
  changelog: Record<string, string>;
  releases?: Record<string, Release>;
}

export const formatVersion = (major: number, minor: number, update: number, build?: number): string => {
  if (build !== undefined) {
    return `${major}.${minor.toString().padStart(2, '0')}.${update.toString().padStart(3, '0')}.${build.toString().padStart(3, '0')}`;
  }
  return `${major}.${minor.toString().padStart(2, '0')}.${update.toString().padStart(3, '0')}`;
};

export const parseVersion = (version: string) => {
  const parts = version.split('.');
  return {
    major: parseInt(parts[0] || '0'),
    minor: parseInt(parts[1] || '0'),
    update: parseInt(parts[2] || '0'),
    build: parseInt(parts[3] || '0')
  };
};

export const incrementVersion = (current: VersionInfo, type: 'major' | 'minor' | 'update' | 'build'): VersionInfo => {
  const newVersion = { ...current };
  
  switch (type) {
    case 'major':
      newVersion.major += 1;
      newVersion.minor = 0;
      newVersion.update = 0;
      newVersion.build = 0;
      break;
    case 'minor':
      newVersion.minor += 1;
      newVersion.update = 0;
      newVersion.build = 0;
      break;
    case 'update':
      newVersion.update += 1;
      newVersion.build = 0;
      break;
    case 'build':
      newVersion.build += 1;
      break;
  }
  
  newVersion.version = formatVersion(newVersion.major, newVersion.minor, newVersion.update, newVersion.build);
  return newVersion;
};

// Impact scoring system
export const calculateImpactScore = (release: Omit<Release, 'impactScore'>): number => {
  let score = 0;
  
  // Base score by type
  const typeScores = {
    'major': 100,
    'feature': 70,
    'update': 40,
    'fix': 20
  };
  score += typeScores[release.type] || 0;
  
  // Score based on number of changes (each change adds points)
  score += release.changes.length * 5;
  
  // Score based on technical complexity (technical details indicate complexity)
  if (release.technical) {
    score += release.technical.length * 3;
  }
  
  // Boost score for certain high-impact keywords
  const highImpactKeywords = [
    'security', 'performance', 'authentication', 'database', 'api',
    'integration', 'ui', 'ux', 'accessibility', 'optimization',
    'architecture', 'framework', 'migration', 'breaking'
  ];
  
  const allText = (release.title + ' ' + release.summary + ' ' + release.changes.join(' ') + ' ' + (release.technical?.join(' ') || '')).toLowerCase();
  
  highImpactKeywords.forEach(keyword => {
    if (allText.includes(keyword)) {
      score += 10;
    }
  });
  
  // Cap the score at 200 to maintain reasonable scale
  return Math.min(score, 200);
};

export const getImpactLevel = (score: number): { level: string; color: string; description: string } => {
  if (score >= 150) {
    return { level: 'Critical', color: 'text-red-600 dark:text-red-400', description: 'Major system changes with significant impact' };
  } else if (score >= 100) {
    return { level: 'High', color: 'text-orange-600 dark:text-orange-400', description: 'Important updates affecting core functionality' };
  } else if (score >= 60) {
    return { level: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', description: 'Notable improvements and enhancements' };
  } else if (score >= 30) {
    return { level: 'Low', color: 'text-blue-600 dark:text-blue-400', description: 'Minor fixes and small improvements' };
  } else {
    return { level: 'Minimal', color: 'text-gray-600 dark:text-gray-400', description: 'Small maintenance updates' };
  }
};