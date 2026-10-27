// electron/preload.ts
var import_electron = require("electron");
var goldApi = {
  isElectron: true,
  onFlushBeforeQuit: (callback) => {
    import_electron.ipcRenderer.removeAllListeners("app:flush-before-quit");
    import_electron.ipcRenderer.on("app:flush-before-quit", async () => {
      try {
        await callback();
      } catch {
      } finally {
        import_electron.ipcRenderer.send("app:flush-complete");
      }
    });
  },
  storage: {
    load: () => import_electron.ipcRenderer.invoke("storage:load"),
    save: (state) => import_electron.ipcRenderer.invoke("storage:save", state),
    createSnapshotBackup: (label) => import_electron.ipcRenderer.invoke("storage:createSnapshotBackup", label),
    saveImage: (date, dataUrl) => import_electron.ipcRenderer.invoke("storage:saveImage", date, dataUrl),
    loadImage: (date) => import_electron.ipcRenderer.invoke("storage:loadImage", date),
    deleteImage: (date) => import_electron.ipcRenderer.invoke("storage:deleteImage", date),
    listBackups: () => import_electron.ipcRenderer.invoke("storage:listBackups"),
    restoreBackup: (name) => import_electron.ipcRenderer.invoke("storage:restoreBackup", name),
    openDataFolder: () => import_electron.ipcRenderer.invoke("storage:openDataFolder"),
    chooseExternalFolder: () => import_electron.ipcRenderer.invoke("storage:chooseExternalFolder"),
    syncExternalBackup: (folderPath) => import_electron.ipcRenderer.invoke("storage:syncExternalBackup", folderPath),
    saveVisitSnapshot: (visitId, visitData) => import_electron.ipcRenderer.invoke("storage:saveVisitSnapshot", visitId, visitData),
    checkImagesExist: (dates) => import_electron.ipcRenderer.invoke("storage:checkImagesExist", dates),
    exportJson: (payload) => import_electron.ipcRenderer.invoke("storage:exportJson", payload),
    importJson: () => import_electron.ipcRenderer.invoke("storage:importJson")
  },
  ocr: {
    readLedger: (params) => import_electron.ipcRenderer.invoke("ocr:readLedger", params)
  },
  ai: {
    summarize: (params) => import_electron.ipcRenderer.invoke("ai:summarize", params),
    setApiKey: (key) => import_electron.ipcRenderer.invoke("ai:setApiKey", key),
    getApiKeyStatus: () => import_electron.ipcRenderer.invoke("ai:getApiKeyStatus"),
    testApiKey: (customKey, modelName) => import_electron.ipcRenderer.invoke("ai:testApiKey", customKey, modelName)
  },
  security: {
    getStatus: () => import_electron.ipcRenderer.invoke("security:getStatus"),
    verifyPassword: (password) => import_electron.ipcRenderer.invoke("security:verifyPassword", password),
    configure: (params) => import_electron.ipcRenderer.invoke("security:configure", params)
  },
  print: {
    saveToPdf: (defaultFilename) => import_electron.ipcRenderer.invoke("print:saveToPdf", defaultFilename)
  }
};
import_electron.contextBridge.exposeInMainWorld("goldApi", goldApi);
