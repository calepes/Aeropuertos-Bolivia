// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: plane-departure;

const REPO_OWNER = "calepes";
const REPO_NAME = "Aeropuertos-Bolivia";
const BRANCH = "main";
const FILE = "widget/widget-vuelos-naabol.js";

const RAW_URL = "https://raw.githubusercontent.com/" + REPO_OWNER + "/" + REPO_NAME + "/" + BRANCH + "/" + FILE;

const fm = FileManager.iCloud();
const dir = fm.joinPath(fm.documentsDirectory(), "vuelos-cache");
const localPath = fm.joinPath(dir, "widget-vuelos-naabol.js");

if (!fm.fileExists(dir)) {
  fm.createDirectory(dir, true);
}

let code;

try {
  const req = new Request(RAW_URL);
  req.timeoutInterval = 10;
  code = await req.loadString();

  if (code && code.length > 100 && !code.includes('"message":"Not Found"')) {
    fm.writeString(localPath, code);
    console.log("Widget actualizado desde GitHub");
  } else {
    throw new Error("Respuesta invalida");
  }
} catch (e) {
  console.log("Sin conexion, usando copia local: " + e.message);
  if (fm.fileExists(localPath)) {
    if (fm.isFileStoredIniCloud(localPath) && !fm.isFileDownloaded(localPath)) {
      await fm.downloadFileFromiCloud(localPath);
    }
    code = fm.readString(localPath);
  } else {
    const w = new ListWidget();
    w.addText("Sin conexion y sin cache local");
    if (config.runsInWidget) {
      Script.setWidget(w);
    } else {
      await w.presentMedium();
    }
    Script.complete();
    return;
  }
}

try {
  await eval("(async () => { " + code + " })()");
} catch (err) {
  console.log("Error ejecutando widget: " + err.message);
  const w = new ListWidget();
  w.backgroundColor = new Color("#0A0A0A");
  const msg = w.addText("⚠ Error: " + err.message);
  msg.font = Font.mediumSystemFont(12);
  msg.textColor = new Color("#FF3D00");
  msg.centerAlignText();
  if (config.runsInWidget) {
    Script.setWidget(w);
  } else {
    await w.presentMedium();
  }
  Script.complete();
}
