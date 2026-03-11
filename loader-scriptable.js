// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: plane-departure;

const REPO_OWNER = "calepes";
const REPO_NAME = "widget-vuelos-bolivia";
const BRANCH = "claude/review-repo-C5wso";
const FILE = "widget-vuelos-naabol.js";

const API_URL = "https://api.github.com/repos/" + REPO_OWNER + "/" + REPO_NAME + "/contents/" + FILE + "?ref=" + encodeURIComponent(BRANCH);

const fm = FileManager.iCloud();
const dir = fm.joinPath(fm.documentsDirectory(), "vuelos-cache");
const localPath = fm.joinPath(dir, "widget-vuelos-naabol.js");

if (!fm.fileExists(dir)) {
  fm.createDirectory(dir, true);
}

let code;

try {
  const req = new Request(API_URL);
  req.timeoutInterval = 10;
  req.headers = { Accept: "application/vnd.github.v3.raw" };
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

await eval("(async () => { " + code + " })()");
