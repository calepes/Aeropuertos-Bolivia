// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: plane-departure;

const RAW_URL = "https://raw.githubusercontent.com/calepes/Aeropuertos-Bolivia/main/widget/widget-vuelos-naabol.js";
const fm = FileManager.iCloud();
const cacheDir = fm.joinPath(fm.documentsDirectory(), "vuelos-cache");
const cachePath = fm.joinPath(cacheDir, "widget-vuelos-naabol.js");

if (!fm.fileExists(cacheDir)) fm.createDirectory(cacheDir, true);

let code;

// 1. Descargar widget desde GitHub
try {
  const req = new Request(RAW_URL);
  req.timeoutInterval = 10;
  const resp = await req.loadString();
  if (resp && resp.length > 100 && !resp.includes('"message"')) {
    code = resp;
    fm.writeString(cachePath, code);
  } else {
    throw new Error("Respuesta invalida de GitHub");
  }
} catch (e) {
  // 2. Fallback: cache local en iCloud
  console.log("Usando cache: " + e.message);
  if (fm.fileExists(cachePath)) {
    if (fm.isFileStoredIniCloud(cachePath) && !fm.isFileDownloaded(cachePath)) {
      await fm.downloadFileFromiCloud(cachePath);
    }
    code = fm.readString(cachePath);
  }
}

// 3. Ejecutar widget o mostrar error
if (code && code.length > 100) {
  try {
    await eval("(async () => { " + code + " })()");
  } catch (err) {
    console.log("Error widget: " + err.message);
    const w = new ListWidget();
    w.backgroundColor = new Color("#0A0A0A");
    const msg = w.addText("Error: " + err.message);
    msg.font = Font.mediumSystemFont(12);
    msg.textColor = new Color("#FF3D00");
    msg.centerAlignText();
    Script.setWidget(w);
    Script.complete();
  }
} else {
  const w = new ListWidget();
  w.backgroundColor = new Color("#0A0A0A");
  const msg = w.addText("Sin conexion y sin cache");
  msg.font = Font.mediumSystemFont(13);
  msg.textColor = new Color("#FF3D00");
  msg.centerAlignText();
  Script.setWidget(w);
  Script.complete();
}
