const fs = require("fs");
const path = require('path');

function getMimeType(filePath) {
    const fileExtension = path.extname(filePath);
    switch (fileExtension) {
        case '.aac':
            return 'audio/aac';
        case '.abw':
            return 'application/x-abiword';
        case '.arc':
            return 'application/x-freearc';
        case '.avi':
            return 'video/x-msvideo';
        case '.azw':
            return 'application/vnd.amazon.ebook';
        case '.bin':
            return 'application/octet-stream';
        case '.bmp':
            return 'image/bmp';
        case '.bz':
            return 'application/x-bzip';
        case '.bz2':
            return 'application/x-bzip2';
        case '.csh':
            return 'application/x-csh';
        case '.css':
            return 'text/css';
        case '.csv':
            return 'text/csv';
        case '.doc':
            return 'application/msword';
        case '.docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case '.eot':
            return 'application/vnd.ms-fontobject';
        case '.epub':
            return 'application/epub+zip';
        case '.gif':
            return 'image/gif';
        case '.htm':
        case '.html':
            return 'text/html';
        case '.ico':
            return 'image/vnd.microsoft.icon';
        case '.ics':
            return 'text/calendar';
        case '.jar':
            return 'application/java-archive';
        case '.jpeg':
        case '.jpg':
            return 'image/jpeg';
        case '.js':
            return 'text/javascript';
        case '.json':
            return 'application/json';
        case '.jsonld':
            return 'application/ld+json';
        case '.mid':
        case '.midi':
            return 'audio/midi';
        case '.mjs':
            return 'text/javascript';
        case '.mp3':
            return 'audio/mpeg';
        case '.mp4':
            return 'video/mp4';
        case '.mpeg':
            return 'video/mpeg';
        case '.mpkg':
            return 'application/vnd.apple.installer+xml';
        case '.odp':
            return 'application/vnd.oasis.opendocument.presentation';
        case '.ods':
            return 'application/vnd.oasis.opendocument.spreadsheet';
        case '.odt':
            return 'application/vnd.oasis.opendocument.text';
        case '.oga':
            return 'audio/ogg';
        case '.ogv':
            return 'video/ogg';
        case '.ogx':
            return 'application/ogg';
        case '.otf':
            return 'font/otf';
        case '.png':
            return 'image/png';
        case '.pdf':
            return 'application/pdf';
        case '.ppt':
            return 'application/vnd.ms-powerpoint';
        case '.pptx':
            return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case '.rar':
            return 'application/x-rar-compressed';
        case '.rtf':
            return 'application/rtf';
        case '.sh':
            return 'application/x-sh';
        case '.svg':
            return 'image/svg+xml';
        case '.swf':
            return 'application/x-shockwave-flash';
        case '.tar':
            return 'application/x-tar';
        case '.tif':
        case '.tiff':
            return 'image/tiff';
        case '.ts':
            return 'video/mp2t';
        case '.ttf':
            return 'font/ttf';
        case '.txt':
            return 'text/plain';
        case '.vsd':
            return 'application/vnd.visio';
        case '.wav':
            return 'audio/wav';
        case '.weba':
            return 'audio/webm';
        case '.webm':
            return 'video/webm';
        case '.webp':
            return 'image/webp';
        case '.woff':
            return 'font/woff';
        case '.woff2':
            return 'font/woff2';
        case '.xhtml':
            return 'application/xhtml+xml';
        case '.xls':
            return 'application/vnd.ms-excel';
        case '.xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case '.xml':
            return 'application/xml';
        case '.zip':
            return 'application/zip';
        default:
            return 'application/octet-stream';
    }
}

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
                const type = getMimeType(file.path);
                form.append('file', new Blob([data], {type}), file.name);
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
    } else if (type === "text") {
        onSuccess();
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