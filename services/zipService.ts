
// We use the global JSZip loaded via CDN in index.html
declare var JSZip: any;

export const createZipBundle = async (appData: { 
  name: string; 
  installScript: string; 
  metadata: any;
  files: any[];
}) => {
  const zip = new JSZip();
  
  const safeName = appData.name.replace(/\s+/g, '_');
  const appFolder = zip.folder(safeName);
  
  // App files
  appFolder.file("installer.bat", appData.installScript);
  appFolder.file("app_config.json", JSON.stringify(appData.metadata, null, 2));
  
  // Wykaz plików w formacie tekstowym
  const manifest = appData.files.map(f => `- ${f.name} (${f.type})`).join('\n');
  appFolder.file("manifest.txt", `LISTA ZASOBÓW DLG:\n${manifest}`);

  // Generowanie dynamicznej listy HTML dla instalatora
  const fileListHtml = appData.files.map(f => `
    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: left;">
            <div style="font-weight: bold; font-size: 14px;">${f.name}</div>
            <div style="font-size: 10px; opacity: 0.5; text-transform: uppercase;">Typ: ${f.type}</div>
        </div>
        <button style="background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; cursor: pointer;" onclick="alert('Inicjowanie instalacji dla: ${f.name}')">Zainstaluj</button>
    </div>
  `).join('');
  
  // Główny panel instalacyjny wewnątrz ZIP
  appFolder.file("index.html", `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Panel Instalacyjny | GO-SERVICE.PL</title>
    <style>
        body { background: #020617; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
        .card { background: rgba(30, 41, 59, 0.5); padding: 40px; border-radius: 32px; border: 1px solid rgba(99, 102, 241, 0.2); text-align: center; max-width: 500px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .logo { font-weight: 900; font-style: italic; font-size: 28px; margin-bottom: 8px; letter-spacing: -1px; }
        .tagline { font-size: 10px; opacity: 0.4; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 30px; }
        .files-container { margin: 20px 0; max-height: 300px; overflow-y: auto; padding-right: 10px; }
        .btn-main { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; border: none; padding: 16px 32px; border-radius: 16px; font-weight: bold; cursor: pointer; text-decoration: none; display: block; width: 100%; margin-top: 20px; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">GO-SERVICE<span style="color: #6366f1">.PL</span></div>
        <div class="tagline">Neural Deployment Node</div>
        <h2 style="margin-bottom: 10px;">Pakiet: ${appData.name}</h2>
        <p style="font-size: 13px; opacity: 0.7; margin-bottom: 25px;">Wykryto ${appData.files.length} zasobów gotowych do integracji systemowej.</p>
        
        <div class="files-container">
            ${fileListHtml}
        </div>

        <button class="btn-main" onclick="alert('Uruchamianie globalnego instalatora BAT...')">Zainstaluj wszystko</button>
        <p style="font-size: 9px; margin-top: 30px; opacity: 0.3;">© 2025 DriveCorp | go-service.pl | Protokół DLG-ULTRA</p>
    </div>
</body>
</html>
  `);

  const binFolder = appFolder.folder("bin");
  binFolder.file("core_service.exe", "BINARY_PLACEHOLDER");

  const content = await zip.generateAsync({ type: "blob" });
  return content;
};

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
