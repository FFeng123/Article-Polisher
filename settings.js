const path = require('path')
const fs = require('fs')
const Store = require('electron-store');
const store = new Store();

module.exports = {
    ReadSettings: () => {
        d = store.get("settings")
        if (!d) {
            d = {
                "AIServerAddr": "http://127.0.0.1:80",
                "max_length": "2048",
                "top_p": "0.1",
                "temperature": "0.5",
                "mem_staticA": "",
                "mem_staticB": ""
            }
        }
        return d
    },
    WriteSettings: (s) => {
        store.set("settings", s)
    },
}