
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  dlgId: string;
  storageLimit: number; // in MB
  storageUsed: number;  // in MB
  tier: 'Standard' | 'Elite' | 'Paranoia';
  accountType: 'Personal' | 'Child' | 'Business';
  googleToken?: string;
  githubToken?: string;
  authProvider: 'google' | 'github' | 'quantum-direct';
  primaryStorage: 'local' | 'google-drive';
  driveConnected: boolean;
  agreementAccepted?: boolean;
}

export type Platform = 'Android' | 'PC' | 'Universal';
export type AppSource = 'Local' | 'Google Play' | 'Microsoft Store' | 'Archive.org' | 'Web Search' | 'Deep Web' | 'DLG-Disc';

export interface DLGFile {
  id: string;
  name: string;
  size: string;
  type: string;
  icon: string;
  createdAt: number;
  isEncrypted: boolean;
}

export interface AppBundle {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'System' | 'Tool' | 'Game' | 'Utility' | 'Ghost-Data';
  platform: Platform;
  source: AppSource;
  createdAt: number;
  status: 'Ready' | 'Packaging' | 'Deployed' | 'Encrypted';
  size?: string;
  isPublic: boolean;
  privacy: 'public' | 'password' | 'private' | 'ghost';
  authorId: string;
  authorName: string;
}

export interface ScrapedContent {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  contentType: string;
  scrapedAt: number;
}
