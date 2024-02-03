const fs = require("fs");

function appendContent(action, showAppendAlert, onSuccess, onError) {
    const {type, payload} = action;
    if (type === "over") {
        try {
            let content = utools.dbStorage.getItem("memos_content");
            if (content) {
                content += "\n" + payload;
            } else {
                content = payload;
            }
            utools.dbStorage.setItem("memos_content", content);
            if (showAppendAlert) {
                alert("添加文本成功!");
            }
            onSuccess();
        } catch (err) {
            alert(`添加文本失败! message: ${err}`);
            onError();
        }
    } else if (type === "files") {
        let resourceIdList = utools.dbStorage.getItem("memos_resource_id_list");
        if (!resourceIdList) {
            resourceIdList = [];
        }
        const token = utools.dbStorage.getItem("memos_access_token");
        const url = utools.dbStorage.getItem("memos_url");
        if (token && url) {
            const fetches = payload.filter((file) => file.isFile).map((file) => {
                const form = new FormData();
                const data = fs.readFileSync(file.path);
                form.append('file', new Blob([data]), file.name);
                return fetch(`${url}/api/v1/resource/blob`, {
                    method: 'POST',
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: form,
                });
            });
            Promise.all(fetches)
                .then(responses => {
                    return Promise.all(responses.map(function (response) {
                        return response.json();
                    }));
                })
                .then(data => {
                    Promise.all(data.map(function (dt) {
                        if (dt) {
                            resourceIdList.push(dt.id)
                        } else {
                            alert(`上传失败! error: ${JSON.stringify(dt)}`);
                            onError();
                        }
                    }))
                        .then(() => {
                            try {
                                utools.dbStorage.setItem("memos_resource_id_list", resourceIdList);
                                alert(`添加资源成功! resourceIdList: ${JSON.stringify(resourceIdList)}`);
                                onSuccess();
                            } catch (err) {
                                alert(`添加资源失败! message: ${err}`);
                                onError();
                            }
                        });

                })
                .catch(err => {
                    alert(`上传失败! error: ${err}`);
                    onError();
                });

        } else {
            alert("内部错误!");
            onError();
        }
    } else {
        alert("内部错误!");
        onError();
    }
}

function clearContent() {
    utools.dbStorage.removeItem("memos_content");
    utools.dbStorage.removeItem("memos_resource_id_list");
}

window.exports = {
    "post": {
        mode: "none",
        args: {
            enter: (action) => {
                window.utools.hideMainWindow()
                appendContent(action, false, () => {
                    const token = utools.dbStorage.getItem("memos_access_token");
                    const url = utools.dbStorage.getItem("memos_url");
                    const content = utools.dbStorage.getItem("memos_content");
                    let resourceIdList = utools.dbStorage.getItem("memos_resource_id_list");
                    if (!resourceIdList) {
                        resourceIdList = [];
                    }
                    if (token && url) {
                        fetch(`${url}/api/v1/memo`, {
                            method: 'POST',
                            headers: {
                                "Content-Type": " application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                "content": content,
                                "resourceIdList": resourceIdList,
                            }),
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data) {
                                    alert("发布成功!");
                                    clearContent();
                                    window.utools.outPlugin();
                                } else {
                                    alert(`发布失败! error: ${data}`);
                                    window.utools.outPlugin();
                                }
                            })
                            .catch(err => {
                                alert(`发布失败! error: ${err}`);
                                window.utools.outPlugin();
                            })
                    } else {
                        alert("请先设置 Access Token! (复制 Access Token 并打开 utools)");
                        window.utools.outPlugin();
                    }
                }, window.utools.outPlugin);
            },
        }
    },
    "append": {
        mode: "none",
        args: {
            enter: (action) => {
                window.utools.hideMainWindow()
                appendContent(action, true, window.utools.outPlugin, window.utools.outPlugin);
            }
        }
    },
    "clear": {
        mode: "none",
        args: {
            enter: () => {
                window.utools.hideMainWindow()
                try {
                    clearContent();
                    alert("清空暂存区成功!");
                } catch (err) {
                    alert(`清空暂存区失败! message: ${err}`);
                }
                window.utools.outPlugin()
            }
        }
    },
    "token": {
        mode: "none",
        args: {
            enter: (action) => {
                window.utools.hideMainWindow()
                const token = action.payload;
                try {
                    utools.dbStorage.setItem("memos_access_token", token);
                    alert(`设置 Access Token 成功! (${token})`);
                } catch (err) {
                    alert(`设置 Access Token 失败! message: ${err}`);
                }
                window.utools.outPlugin()
            },
        }
    },
    "url": {
        mode: "none",
        args: {
            enter: (action) => {
                window.utools.hideMainWindow()
                let url = action.payload;
                if (url.endsWith("/")) {
                    url = url.slice(0, -1);
                }
                try {
                    utools.dbStorage.setItem("memos_url", url);
                    alert(`设置 URL 成功! (${url})`);
                } catch (err) {
                    alert(`设置 URL 失败! message: ${err}`);
                }
                window.utools.outPlugin()
            },
        }
    },
}