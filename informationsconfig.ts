
export interface AccountConfig {
  encryptionLevel: 'AES-256' | 'RSA-4096' | 'Quantum-Shadow';
  sessionTimeout: number;
  autoGhost: boolean;
  recoveryHash: string;
  lastLoginIp: string;
}

export const defaultAccountConfig: AccountConfig = {
  encryptionLevel: 'Quantum-Shadow',
  sessionTimeout: 3600,
  autoGhost: true,
  recoveryHash: 'DLG-RECOV-' + Math.random().toString(36).substr(2, 12).toUpperCase(),
  lastLoginIp: '127.0.0.1'
};
