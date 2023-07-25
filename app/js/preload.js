const { contextBridge, ipcRenderer } = require('electron')

var onMaxState = null
var onSettingsUpdate = null

contextBridge.exposeInMainWorld("IPC", {
    win: {
        max: () => {
            return ipcRenderer.invoke("winMax")
        },
        min: () => {
            return ipcRenderer.invoke("winMin")
        },
        setOnMaxState: (f) => {
            onMaxState = f
        },
        showSettingsWin: () => {
            return ipcRenderer.invoke("showSettingsWin")
        }
    },
    settings: {
        read: () => {
            return ipcRenderer.invoke("getSettings")
        },
        write: (s) => {
            console.log("save")
            return ipcRenderer.invoke("setSettings", s)
        },
        setOnSettingsUpdate: (f) => {
            onSettingsUpdate = f
        },
    },
    file: {
        new: () => {
            return ipcRenderer.invoke("openFile", true)
        },
        open: () => {
            return ipcRenderer.invoke("openFile", false)
        },
        save: (d) => {
            return ipcRenderer.invoke("saveFile", d)
        }
    }
})

ipcRenderer.on("maxstate", (_, state) => {
    if (onMaxState) {
        onMaxState(state)
    }
})
ipcRenderer.on("settingsUpdate", (_, s) => {
    if (onSettingsUpdate) {
        onSettingsUpdate(s)
    }
})
