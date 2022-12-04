const fs = require("fs");

function convertBase64UrlToBlob(dataUrl) {
    const bytes = window.atob(dataUrl.split(',')[1]);
    const ab = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        ab[i] = bytes.charCodeAt(i);
    }
    return new Blob([ab], {type: "image/png"});
}

window.exports = {
    "post": {
        mode: "none",
        args: {
            enter: (action) => {
                window.utools.hideMainWindow()
                const openid = utools.dbStorage.getItem("memos_openid");
                const url = utools.dbStorage.getItem("memos_url");
                const content = utools.dbStorage.getItem("memos_content");
                let resourceIdList = utools.dbStorage.getItem("memos_resource_id_list");
                if (!resourceIdList) {
                    resourceIdList = [];
                }
                if (openid && url) {
                    fetch(`${url}/api/memo?openId=${openid}`, {
                        method: 'POST',
                        headers: {
                            "Content-Type": " application/json",
                        },
                        body: JSON.stringify({
                            "content": content,
                            "resourceIdList": resourceIdList,
                        }),
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.data) {
                                alert("发布成功!");
                                utools.dbStorage.removeItem("memos_content");
                                utools.dbStorage.removeItem("memos_resource_id_list");
                                window.utools.outPlugin();
                            } else {
                                alert(`发布失败! error: ${JSON.stringify(data)}`);
                                window.utools.outPlugin();
                            }
                        })
                        .catch(err => {
                            alert(`发布失败! error: ${err}`);
                            window.utools.outPlugin();
                        })
                } else {
                    alert("请先设置 OpenID!");
                    window.utools.outPlugin();
                }
            },
        }
    },
    "direct": {
        mode: "none",
        args: {
            enter: (action) => {
                window.utools.hideMainWindow()
                const payload = action.payload;
                const openid = utools.dbStorage.getItem("memos_openid");
                const url = utools.dbStorage.getItem("memos_url");
                if (openid && url) {
                    fetch(`${url}/api/memo?openId=${openid}`, {
                        method: 'POST',
                        headers: {
                            "Content-Type": " application/json",
                        },
                        body: JSON.stringify({
                            "content": payload,
                        }),
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.data) {
                                alert("发布成功!");
                                window.utools.outPlugin();
                            } else {
                                alert(`发布失败! error: ${JSON.stringify(data)}`);
                                window.utools.outPlugin();
                            }
                        })
                        .catch(err => {
                            alert(`发布失败! error: ${err}`);
                            window.utools.outPlugin();
                        })
                } else {
                    alert("请先设置 OpenID!");
                    window.utools.outPlugin();
                }
            },
        }
    },
    "append": {
        mode: "none",
        args: {
            enter: (action) => {
                window.utools.hideMainWindow()
                const {code, type, payload} = action;
                if (type === "over") {
                    try {
                        let content = utools.dbStorage.getItem("memos_content");
                        if (content) {
                            content += "\n" + payload;
                        } else {
                            content = payload;
                        }
                        utools.dbStorage.setItem("memos_content", content);
                        alert("添加文本成功!");
                        window.utools.outPlugin();
                    } catch (err) {
                        alert(`添加文本失败! message: ${err}`);
                        window.utools.outPlugin();
                    }
                } else if (type === "img") {
                    let resourceIdList = utools.dbStorage.getItem("memos_resource_id_list");
                    if (!resourceIdList) {
                        resourceIdList = [];
                    }
                    const openid = utools.dbStorage.getItem("memos_openid");
                    const url = utools.dbStorage.getItem("memos_url");
                    if (openid && url) {
                        const file = convertBase64UrlToBlob(payload);
                        const form = new FormData();
                        form.append('file', file, `image.png`);
                        fetch(`${url}/api/resource?openId=${openid}`, {
                            method: 'POST',
                            body: form,
                        })
                            .then(resp => resp.json())
                            .then(data => {
                                if (data.data) {
                                    resourceIdList.push(data.data.id)
                                } else {
                                    alert(`上传失败! error: ${JSON.stringify(data)}`);
                                    window.utools.outPlugin();
                                }
                            })
                            .then(() => {
                                try {
                                    utools.dbStorage.setItem("memos_resource_id_list", resourceIdList);
                                    alert(`添加资源成功! resourceIdList: ${JSON.stringify(resourceIdList)}`);
                                } catch (err) {
                                    alert(`添加资源失败! message: ${err}`);
                                    window.utools.outPlugin();
                                }
                            })
                            .catch(err => {
                                alert(`上传失败! error: ${err}`);
                                window.utools.outPlugin();
                            });
                    } else {
                        alert("内部错误!");
                        window.utools.outPlugin();
                    }
                } else if (type === "files") {
                    let resourceIdList = utools.dbStorage.getItem("memos_resource_id_list");
                    if (!resourceIdList) {
                        resourceIdList = [];
                    }
                    const openid = utools.dbStorage.getItem("memos_openid");
                    const url = utools.dbStorage.getItem("memos_url");
                    if (openid && url) {
                        const fetches = payload.filter((file) => file.isFile).map((file) => {
                            const form = new FormData();
                            const data = fs.readFileSync(file.path);
                            form.append('file', new Blob([data]), file.name);
                            return fetch(`${url}/api/resource?openId=${openid}`, {
                                method: 'POST',
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
                                    if (dt.data) {
                                        resourceIdList.push(dt.data.id)
                                    } else {
                                        alert(`上传失败! error: ${JSON.stringify(dt)}`);
                                        window.utools.outPlugin();
                                    }
                                }))
                                    .then(() => {
                                        try {
                                            utools.dbStorage.setItem("memos_resource_id_list", resourceIdList);
                                            alert(`添加资源成功! resourceIdList: ${JSON.stringify(resourceIdList)}`);
                                            window.utools.outPlugin();
                                        } catch (err) {
                                            alert(`添加资源失败! message: ${err}`);
                                            window.utools.outPlugin();
                                        }
                                    });

                            })
                            .catch(err => {
                                alert(`上传失败! error: ${err}`);
                                window.utools.outPlugin();
                            });

                    } else {
                        alert("内部错误!");
                        window.utools.outPlugin();
                    }
                } else {
                    alert("内部错误!");
                    window.utools.outPlugin();
                }
            }
        }
    },
    "clear": {
        mode: "none",
        args: {
            enter: (action) => {
                window.utools.hideMainWindow()
                try {
                    utools.dbStorage.removeItem("memos_content");
                    utools.dbStorage.removeItem("memos_resource_id_list");
                    alert("清空暂存区成功!");
                } catch (err) {
                    alert(`清空暂存区失败! message: ${err}`);
                }
                window.utools.outPlugin()
            }
        }
    },
    "openapi": {
        mode: "none",
        args: {
            enter: (action) => {
                window.utools.hideMainWindow()
                const payload = action.payload;
                try {
                    const [url, openid] = payload.split("/api/memo?openId=");
                    utools.dbStorage.setItem("memos_openid", openid);
                    utools.dbStorage.setItem("memos_url", url);
                    alert(`设置 OpenAPI 成功! (${payload})`);
                } catch (err) {
                    alert(`设置 OpenAPI 失败! message: ${err}`);
                }
                window.utools.outPlugin()
            },
        }
    }
}