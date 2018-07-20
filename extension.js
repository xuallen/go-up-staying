
const vscode = require('vscode');
const axios = require('axios');

function activate(context) {
    const intervalTime = 5000;
    let results = {}; //保存所有结果
    let current = 0;


    function displayResult() {
        const codes = Object.keys(results);
        const max = codes.length;
        if(max && max >= current){
            const key = codes[current];
            const item = results[key];
            current++;
            setTimeout(() => {
                displayResult();
            }, intervalTime);
            const message = `📈「${key.substr(4)}」💰${item[0]} 😱${item[3]}%`;
            vscode.window.setStatusBarMessage(message);
        }else{
            current = 0;
            setTimeout(() => {
                displayResult();
            }, intervalTime);
        }
    }

    function fetchAllData() {
        const codes = Object.keys(results).join(',');
        axios.get(`https://hq.finance.ifeng.com/q.php?l=${codes}`)
            .then((rep) => {
                const result = rep.data;
                eval(result);
                if(typeof json_q === 'object'){
                    results = Object.assign(results, json_q);
                }
            });
    }
    displayResult();
    setInterval(fetchAllData, 5000);

    let disposable = vscode.commands.registerCommand('extension.goUpStaying', function () {
        const options = {
            ignoreFocusOut: true,
            password: false,
            prompt: "请输入股票代码"
        };

        vscode.window.showInputBox(options).then((value) => {
            if (value === undefined || value.trim() === '') {
                vscode.window.showInformationMessage('请输入股票代码，如600666');
            } else {
                let code = value.trim();
                code = 's_' + (code[0] === '6' ? 'sh' : 'sz') + code;
                fetchData(code, (data) => {
                    results[code] = data;
                    fetchAllData();
                });
            }
        })
    });

    context.subscriptions.push(disposable);
}



function fetchData(value, cb) {
    axios.get(`https://hq.finance.ifeng.com/q.php?l=${value}`)
        .then((rep) => {
            const result = rep.data;
            if (result) {
                const dataStr = result.match(/\[(.+?)\]/);
                if (dataStr && dataStr[1]) {
                    const data = dataStr[1].split(',');
                    cb(data);
                } else {
                    vscode.window.showErrorMessage('获取数据失败，请检查股票代码是否有误！');
                }
            }
        }).catch(() => {
            vscode.window.showErrorMessage('获取数据失败，请检查网络或重试！');
        });
}

exports.activate = activate;


// this method is called when your extension is deactivated
function deactivate() {

}
exports.deactivate = deactivate;