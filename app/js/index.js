toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": false,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
}

document.getElementById("settingBtn").onclick = () => {
    IPC.win.showSettingsWin()
}
document.getElementById("smallBtn").onclick = () => {
    IPC.win.min()
}
document.getElementById("fillBtn").onclick = () => {
    IPC.win.max()
}
document.getElementById("exitBtn").onclick = () => {
    window.close()
}
document.getElementById("open_hasBtn").onclick = () => {
    openWaitWindow()
    var fileName = ""
    IPC.file.open().then(data => {
        if (data.data.type != "APT") {
            toastr['error']("打开的文件类型错误", "打开文件失败")
            openSelectProjectWindow()
            return
        }
        openEditer(data.name, data.data)
    }).catch(openSelectProjectWindow)
}

document.getElementById("open_newBtn").onclick = () => {
    openWaitWindow()
    IPC.file.new().then(data => {
        openEditer(data.name, {
            "type": "APT",
            "text": []
        })
    }).catch(openSelectProjectWindow)
}

window.IPC.win.setOnMaxState((state) => {
    document.getElementById("fillBtn").children[0].className = state ? "icon-shrink2" : "icon-enlarge2"
})

const openSelectProjectWindow = () => {
    setEditerMode(false)
    window.location.hash = '#selectProject'
}

const openWaitWindow = () => {
    setEditerMode(false)
    window.location.hash = '#wait'
}

window.onload = () => {
    openSelectProjectWindow()
    //openEditer()//
}



