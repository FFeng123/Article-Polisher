var EditMode = false
var Saved = true
var Saveing = false
var EditingFileName = ""
var EditingObjects = []
var Settings
var BlockRoot = document.getElementById("txtList")
var CountE = document.getElementById("I_count")
var Count = 0
var BlockDefH = "150px"

IPC.settings.setOnSettingsUpdate((s) => { Settings = s })
IPC.settings.read().then((s) => {
    Settings = s
})

document.getElementById("closeBtn").onclick = () => {
    let close = () => {
        EditingFileName = ""
        openSelectProjectWindow()

        EditingObjects.length = 0
        BlockRoot.innerHTML = ""
    }
    if (!closeSave(close)) {
        close()
    }
}

document.getElementById("saveBtn").onclick = () => {
    Save()
}
document.getElementById("block_runall").onclick = () => {
    EditingObjects.forEach(obj => {
        if (obj.srcTxt != "") {
            obj.run()
        }
    });
}

document.getElementById("block_add").onclick = () => {
    makeCodeBlock().element.scrollIntoView();
}
document.getElementById("block_delempty").onclick = () => {
    EditingObjects.forEach(obj => {
        if (obj.srcTxt.length == 0 && obj.AITxt.length == 0 && obj.RedtTxt.length == 0) {
            obj.remove()
        }
    });
}
document.getElementById("block_visall").onclick = () => {
    EditingObjects.forEach(obj => {
        obj.vis(true)
    });
}
document.getElementById("block_unvisall").onclick = () => {
    EditingObjects.forEach(obj => {
        obj.vis(false)
    });
}

document.getElementById("block_import").onclick = () => {
    showOpenFilePicker({
        multiple: true,
        types: [
            {
                description: "文本文件",
                accept: {
                    "text/plain": []
                }
            }
        ]
    }).then((fs) => {
        async function read() {
            for (let i = 0; i < fs.length; i++) {
                const s = (await (await fs[i].getFile()).text());
                let pos = 0
                while (pos < s.length) {
                    let idx = s.indexOf("\n", pos)
                    if (idx == -1) {
                        idx = s.length
                    }
                    let ss = s.substring(pos, idx)
                    if (ss.length != 0) {
                        makeCodeBlock(ss)
                    }
                    pos = idx + 1
                }
            }
        }

        openWaitWindow()
        read().finally(() => { window.location.hash = '#editer'; setEditerMode(true) })
            .catch(err => toastr['error'](err, "导入失败"))
            .then(() => toastr['success']("导入文件内容已插入到此文件底部", "导入完成"))

        f.forEach(f => {

        });
    }).catch(() => { })
}

document.getElementById("block_export").onclick = () => {
    let d = ""
    EditingObjects.forEach(obj => {
        d += obj.RedtTxt + "\n"
    });
    toastr['success']("已发起文件另存请求", "正在导出")
    downloadFileData(d, "导出.txt")
}

const openEditer = (fileName, data) => {
    setEditerMode(true)
    window.location.hash = '#editer'

    EditingFileName = fileName
    Editing = data
    Count = 0
    CountUpdate(0, 0)

    Saved = true
    Saveing = false

    EditingObjects.length = 0
    BlockRoot.innerHTML = ""

    data.text.forEach(t => {
        makeCodeBlock(t[0], t[1], t[2])
    });
}

const getBlockID = (e) => {
    for (let i = 0; i < BlockRoot.children.length; i++) {
        if (e == BlockRoot.children[i]) {
            return Number(i)
        }
    }
    return -1
}

const makeCodeBlock = (srcTxt = "", AITxt = "", RedtTxt = "", pos = undefined) => {
    let e = document.createElement("div")
    e.style.height = "0"
    e.innerHTML = `
    <div class="dos">
        <div class="btn nodisplay"><span class="icon-plus"></span></div>
        <div class="btn"><span class="icon-bin2"></span></div>
        <div class="btn"><span class="icon-play3"></span></div>
        <div class="btn"><span class="icon-eye-minus"></span></div>
    </div>
    <div class="edit">
        <textarea spellcheck="false"></textarea>
        <div class="editbtn">
            <textarea spellcheck="false" readonly></textarea>
            <div class="btn"><span class="icon-arrow-down"></span></div>
        </div>
        <textarea spellcheck="false"></textarea>
        <div></div>
    </div>
    `

    let obj = {
        _element: e,
        _count: 0,
        _vis: true,
        oncountchage: null,

        get element() {
            return this._element
        },
        get srcTxt() {
            return this._element.children[1].children[0].value
        },
        set srcTxt(v) {
            if (EditingFileName.length != 0) Saved = false
            this._element.children[1].children[0].value = v
        },
        get AITxt() {
            return this._element.children[1].children[1].children[0].value
        },
        set AITxt(v) {
            if (EditingFileName.length != 0) Saved = false
            this._element.children[1].children[1].children[0].value = v
        },
        get RedtTxt() {
            return this._element.children[1].children[2].value
        },
        set RedtTxt(v) {
            if (EditingFileName.length != 0) Saved = false
            this._element.children[1].children[2].value = v
            this.count = v.length
        },
        set stateText(v) {
            if (v) {
                this._element.children[1].children[3].innerHTML = v
            } else {
                this._element.children[1].children[3].innerHTML = ""
            }
        },
        set stateTextRunning(v) {
            if (v) {
                this._element.children[1].children[3].innerHTML = `<img src="images/loading.svg"style="height: 1em;margin-right: 1em;"><span>${v}</span>`
            } else {
                this._element.children[1].children[3].innerHTML = ""
            }
        },

        get count() {
            return this._count
        },

        set count(v) {
            this.oncountchage && this.oncountchage(this._count, v)
            this._count = v
        },

        remove() {
            if (this.srcTxt.length != 0) {
                toastr['warning']("禁止删除源文本不为空的块", "不能删除此块")
                return
            }
            $(this._element).animate({
                "opacity": "0",
            }, 200)
            $(this._element).animate({
                "height": "0",
            }, 200, undefined, () => {
                this.count = 0
                this._element.remove()
                EditingObjects.splice(EditingObjects.indexOf(this), 1)
            })


        },
        run() {
            if (this.srcTxt.length == 0) {
                toastr['warning']("源文本为空", "不能进行计算")
                return
            }
            if (!this.callmark) {
                this.stateTextRunning = "等待计算···"
                AICallManager.AddCall(this, () => {
                    this.stateTextRunning = "正在计算···"
                }).then(() => {
                    this.stateText = ""
                }).catch((err) => {
                    this.stateText = `计算失败: ${err}`
                })
            }
        },
        vis(v) {

            this._vis = v == undefined ? !this._vis : v

            if (this._vis) {
                this._element.children[0].children[1].style.removeProperty("display")
                this._element.children[0].children[2].style.removeProperty("display")
                this._element.children[1].children[0].style.removeProperty("display")
                this._element.children[1].children[1].style.removeProperty("display")
            } else {
                this._element.children[0].children[1].style["display"] =
                    this._element.children[0].children[2].style["display"] =
                    this._element.children[1].children[0].style["display"] =
                    this._element.children[1].children[1].style["display"] = this._vis ? undefined : "none"
            }

            this._element.children[0].children[3].children[0].className = this._vis ? "icon-eye-minus" : "icon-eye-plus"
        },
    }
    // 放入容器
    if (pos == undefined) {
        BlockRoot.appendChild(e)
        EditingObjects.push(obj)
    } else {
        pos.insertAdjacentElement("beforebegin", e)
        EditingObjects.splice(pos, 0, obj)

    }
    // 绑定事件

    e.children[0].children[0].onclick = () => {// 前插入
        makeCodeBlock("", "", "", e).element.scrollIntoView();
    }

    e.children[0].children[1].onclick = () => {// 删除
        obj.remove()
    }

    e.children[0].children[2].onclick = () => {// 进行计算
        obj.run()
    }
    e.children[0].children[3].onclick = () => {// 展开和隐藏
        obj.vis()
    }

    e.children[1].children[1].children[1].onclick = () => {// AI文本到最终文本
        if (obj.RedtTxt.length != 0) {
            toastr['warning']("最终文本不为空", "不能应用文本")
            return
        }
        obj.RedtTxt = obj.AITxt
    }

    e.children[1].children[2].oninput = () => {
        if (EditingFileName.length != 0) Saved = false
        obj.count = obj.RedtTxt.length
    }
    e.children[1].children[0].oninput = () => {
        if (EditingFileName.length != 0) Saved = false
    }
    //
    obj.oncountchage = CountUpdate


    // 动画
    e.style.height = "0"
    e.style.opacity = "0"
    $(e).animate({
        "height": BlockDefH,
    }, 100, undefined, () => {
        e.style.height = "auto"
    })
    $(e).animate({
        "opacity": "1",
    }, 300)

    // 赋值

    obj.srcTxt = srcTxt
    obj.AITxt = AITxt
    obj.RedtTxt = RedtTxt


    return obj
}


const setEditerMode = (v) => {
    EditMode = v
    document.getElementById("saveBtn").style.display =
        document.getElementById("closeBtn").style.display = v ? "flex" : "none"
}


const closeSave = (call = null) => {
    if (Saveing) {
        toastr['warning']("退出前请先等待文件保存完成", "正在保存文件")
        return true
    }
    if (EditMode && !Saved) {
        Save().then(() => {
            if (call) { call() }
        }).catch(_ => toastr['error']("保存失败", "无法退出"))
        return true
    }

}

window.onbeforeunload = () => {
    return closeSave(window.close)
}

async function Save() {
    if (Saveing) {
        throw "正在保存"
    }
    try {
        Saveing = true
        Saved = true
        var DataArr = Array(EditingObjects.length)

        EditingObjects.forEach((obj, idx) => {
            DataArr[idx] = [
                obj.srcTxt,
                obj.AITxt,
                obj.RedtTxt,
            ]
        })
        await IPC.file.save({
            "name": EditingFileName,
            "data": {
                "type": "APT",
                "text": DataArr
            },
        })
    } catch (err) {
        toastr['error'](err, "保存文件失败")
        Saveing = false
        Saved = false
        throw "失败"
    }
    toastr['success']("已将编辑器内的内容写入到磁盘", "保存文件完成")
    Saveing = false
}

const AICallManager = {
    _callQueue: [],
    _started: false,

    AddCall(obj, startcall) {
        return new Promise((ok, err) => {
            if (obj["callmark"] == undefined) {
                obj["callmark"] = this._callQueue.push({
                    obj: obj,
                    ok: ok,
                    err: err,
                    startcall: startcall,
                })
                if (!this._started) {
                    this.StartCall()
                }
            } else {
                err("重复发起计算")
            }
        })
    },
    RemoveCall(obj) {
        if (obj.callmark != undefined) {
            this._callQueue.splice(obj.callmark, 1)
            return true
        }
        return false
    },
    async StartCall() {
        this._started = true
        while (this._callQueue.length != 0) {
            let c = this._callQueue.shift()

            try {
                c.startcall && c.startcall()
                let d = await fetch(Settings.AIServerAddr, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: c.obj.srcTxt,
                        history: [[Settings.mem_staticA, Settings.mem_staticB]],
                        max_length: Number(Settings.max_length),
                        top_p: Number(Settings.top_p),
                        temperature: Number(Settings.temperature),
                    })
                })

                d = await d.json()

                c.obj.AITxt = d.response

                c.ok(d)
            } catch (err) {
                c.err(err)
            }
            c.obj.callmark = undefined
        }

        this._started = false
        return null
    }
}

const CountUpdate = (old, now) => {
    Count += now - old
    CountE.innerHTML = String(Count)
}

function downloadFileData(data, fileName) {
    blob = new Blob([data], { "type": 'application/octet-stream' });
    let blobUrl = window.URL.createObjectURL(blob);
    let link = document.createElement('a');
    link.download = fileName;
    link.style.display = 'none';
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.keyCode === 13) { // 按下了 Ctrl + Enter
        if (e.target.tagName == "TEXTAREA") {
            e.target.parentNode.parentNode.children[0].children[2].onclick()
            nextNode = e.target.parentNode.parentNode.nextElementSibling
            if (!nextNode) {
                nextNode = makeCodeBlock().element
            }
            if (e.target == e.target.parentNode.children[0]) {
                nextNode.children[1].children[0].focus()
            } else {
                nextNode.children[1].children[2].focus()
            }
        }
    }
    else if (e.ctrlKey && e.keyCode === 83) { // 按下了 Ctrl + s
        if (EditingFileName.length != 0) Save()
    }
});