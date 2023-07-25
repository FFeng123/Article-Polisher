const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { ReadSettings, WriteSettings } = require(path.join(__dirname, 'settings.js'))

var DebugMode = false
var MainWin = null
var SettingsWin = null
var Settings = ReadSettings()
var Filter = [{
    name: "APText工程文件",
    extensions: [
        "apt",
        "json",
    ]
}, {
    name: "任意文件",
    extensions: [
        "*",
    ]
}]
var NowFile = ""

const ShowMainWindow = () => {
    if (MainWin) {
        MainWin.show()
        MainWin.restore()
        MainWin.focus()
        return
    }
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 320,
        minHeight: 320,
        frame: false,
        show: false,
        skipTaskbar: false,
        backgroundColor: "#323232",

        webPreferences: {
            devTools: DebugMode,
            preload: path.join(__dirname, 'app/js/preload.js')
        }


    })

    if (DebugMode) {
        win.webContents.openDevTools()
    }


    win.once("ready-to-show", () => {
        win.show()
    })

    win.loadFile("app/index.html")
    //win.loadURL("https://zhuanlan.zhihu.com/p/112564936")

    win.on("maximize", () => { win.webContents.send("maxstate", true) })
    win.on("unmaximize", () => { win.webContents.send("maxstate", false) })



    MainWin = win
}

const ShowSettingsWindow = () => {
    if (SettingsWin) {
        MainWin.show()
        MainWin.restore()
        MainWin.focus()
        return
    }

    let win = new BrowserWindow({
        width: 200,
        height: 400,
        minWidth: 100,
        minHeight: 100,
        frame: false,
        show: true,
        backgroundColor: "#323232",
        fullscreenable: false,
        parent: MainWin,
        modal: true,
        skipTaskbar: true,

        webPreferences: {
            devTools: DebugMode,
            preload: path.join(__dirname, 'app/js/preload.js')
        }
    })

    if (DebugMode) {
        win.webContents.openDevTools()
    }

    win.focus()
    /*
    if (!DebugMode) {
        win.on("blur", () => {
            win.close()
        })
    }*/

    win.loadFile("app/settings.html")

    win.on("close", () => {
        MainWin = null
    })
}

app.whenReady().then(() => {
    ShowMainWindow()
})


///////// IPC处理

ipcMain.handle("winMax", () => { MainWin.isMaximized() ? MainWin.unmaximize() : MainWin.maximize(); return true; })
ipcMain.handle("winMin", () => { MainWin.minimize(); return true; })
ipcMain.handle("setSettings", (_, s) => { Settings = s; WriteSettings(Settings); MainWin.webContents.send("settingsUpdate", Settings); return true; })
ipcMain.handle("getSettings", () => { return Settings; })
ipcMain.handle("showSettingsWin", ShowSettingsWindow)
ipcMain.handle("openFile", (_, is_new) => {
    return new Promise((ok, err) => {
        try {
            var files
            if (is_new) {
                files = dialog.showSaveDialogSync(MainWin, {
                    title: "选择新建文件的保存位置",
                    defaultPath: path.join(__dirname, ""),
                    filters: Filter,
                })
            } else {
                files = dialog.showOpenDialogSync(MainWin, {
                    title: "选择要打开的文件",
                    defaultPath: path.join(__dirname, ""),
                    filters: Filter,
                    openFile: true,
                    openDirectory: false,
                    multiSelections: false,
                    promptToCreate: false,
                })
            }
            if (files) {
                NowFile = typeof (files) == "string" ? files : files[0]
                if (is_new) {
                    ok({
                        "name": NowFile
                    })
                } else {
                    ok({
                        "name": NowFile,
                        "data": JSON.parse(fs.readFileSync(NowFile, { encoding: "utf-8" })),
                    })
                }
            } else {
                err("操作已取消")
            }
        } catch (err) {
            err("操作发生错误")
        }
    })

})

ipcMain.handle("saveFile", (_, dic) => {
    return new Promise((ok, err) => {
        try {
            if (dic.name != NowFile) {
                err("保存的文件不是活动文件")
            }
            if ((!dic.data) || dic.data.length == 0) {
                err("试图保存空数据")
            }
            fs.writeFileSync(NowFile, JSON.stringify(dic.data), {
                encoding: "utf-8"
            })
            ok("文件已保存")
        } catch (err) {
            err("操作发生错误")
        }

    })
})