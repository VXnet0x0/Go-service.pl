
import { createZipBundle, downloadBlob } from './services/zipService';
import { User, DLGFile, ScrapedContent } from './types';
import { updateUser } from './DLG';

/**
 * DRIVESEARCH | OPERATIONAL CORE SERVICE
 * Zarządza procesami wdrażania i komunikacją między interfejsem a systemem plików ZIP.
 */

export class DLGService {
  private static instance: DLGService;
  private baseUrl: string = "go-service.pl";

  private constructor() {}

  public static getInstance(): DLGService {
    if (!DLGService.instance) {
      DLGService.instance = new DLGService();
    }
    return DLGService.instance;
  }

  /**
   * Finalizuje wdrożenie: tworzy ZIP, dodaje pliki z Vault i generuje link dostępu.
   */
  public async deployApplication(user: User, appName: string, files: DLGFile[]) {
    console.log(`[DRIVESEARCH-DEPLOY] Rozpoczynanie generowania pakietu dla ${appName}...`);
    
    const installScript = `@echo off
title DriveSearch v1.0X Installer - ${appName}
color 0b
echo ===================================================
echo   DRIVESEARCH v1.0X | NEURAL DEPLOYMENT
echo ===================================================
echo [SYSTEM] Node Identity: ${user.dlgId}
echo [SYSTEM] Package: ${appName}
echo [SYSTEM] Resources: ${files.length} node entities
echo [SYSTEM] Extraction ID: ${Math.random().toString(36).substr(2, 8).toUpperCase()}
echo.
echo [!] DEPLOYMENT COMPLETE. Open index.html for GUI control.
echo ===================================================
pause
`;

    const metadata = {
      service: "DriveSearch",
      version: "1.0X",
      deployedBy: user.name,
      deployId: user.dlgId,
      timestamp: new Date().toISOString(),
      node: "DRIVE_SEARCH_NODE_01",
      appName: appName,
      filesCount: files.length,
      protocol: "DS-PRO-1.0X"
    };

    try {
      const zipBlob = await createZipBundle({
        name: appName,
        installScript: installScript,
        metadata: metadata,
        files: files
      });

      downloadBlob(zipBlob, `${appName}_DRIVESEARCH_v1.0X.zip`);
      
      return {
        success: true,
        url: `${this.baseUrl}/ds/${Math.random().toString(36).substr(2, 10)}`,
        status: "LIVE",
        size: (zipBlob.size / 1024).toFixed(2) + " KB"
      };
    } catch (error) {
      console.error("[DRIVESEARCH-DEPLOY] Error:", error);
      throw error;
    }
  }

  public async syncStorageUsage(user: User, newFiles: DLGFile[]) {
    const additionalSize = newFiles.length * 12; 
    const updatedUsage = Math.min(user.storageLimit, user.storageUsed + additionalSize);
    return await updateUser(user.id, { storageUsed: updatedUsage });
  }
}

export const coreService = DLGService.getInstance();
