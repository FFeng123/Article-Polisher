


const main = () => {
    window.IPC.settings.read().then((settings) => {
        var root = document.getElementById("settingList")
        for (let i = 0; i < root.children.length; i++) {
            const c = root.children[i];
            if (c.children.length >= 2) {
                let key = c.dataset["key"]
                let node = c.children[1]
                node.value = settings[key]
                node.oninput = () => {
                    settings[key] = node.value
                }
            }
        }


        window.onbeforeunload = () => {
            window.IPC.settings.write(settings)
        }
    })

    document.getElementById("close").onclick = () => { window.close() }
}

main()