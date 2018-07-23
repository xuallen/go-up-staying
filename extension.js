
const vscode = require('vscode');
const axios = require('axios');
const baseUrl = 'https://gupiao.baidu.com/api/rails/stockbasicbatch?stock_code=';
const intervalTimeForShow = 3000;
const intervalTimeForFetch = 5000;

function keepTwoDecimal(num) {
    var result = parseFloat(num);
    if (isNaN(result)) {
        return 0;
    }
    result = Math.round(num * 100) / 100;
    return result;
}

function activate() {

    let results = []; //保存所有结果
    let codes = [];
    let current = 0;

    function displayResult() {
        const max = results.length;
        if (max && max >= current) {
            const item = results[current];
            current++;
            setTimeout(() => {
                displayResult();
            }, intervalTimeForShow);
            const message = `「${item.stockName}」 💰 ${keepTwoDecimal(item.close)} ${item.netChangeRatio > 0 ? '📈' : '📉'} ${keepTwoDecimal(item.netChangeRatio)}%`;
            vscode.window.setStatusBarMessage(message);
        } else {
            current = 0;
            setTimeout(() => {
                displayResult();
            }, intervalTimeForShow);
        }
    }

    function fetchAllData() {
        axios.get(`${baseUrl}${codes.join(',')}`)
            .then((rep) => {
                const result = rep.data;
                if (result.errorNo === 0 && result.data.length) {
                    results = result.data;
                }
            });
    }


    displayResult();
    setInterval(fetchAllData, intervalTimeForFetch);

    vscode.commands.registerCommand('extension.goUpStaying', function () {
        const options = {
            password: false,
            prompt: "请输入股票代码，如600666"
        };

        vscode.window.showInputBox(options).then((value) => {
            if (value === undefined || value.trim() === '') {
                vscode.window.showInformationMessage('请输入股票代码，如600666');
            } else {
                let code = value.trim();
                code = (code[0] === '6' ? 'sh' : 'sz') + code;
                fetchData(code, () => {
                    if (codes.indexOf(code) < 0) {
                        codes.push(code);
                    }
                    fetchAllData();
                });
            }
        })
    });

    vscode.commands.registerCommand('extension.removeStock', function () {
        const items = results.map((item) => {
            return { label: item.stockName, description: item.stockCode, exchange: item.exchange }
        });

        vscode.window.showQuickPick(items, { placeHolder: '请选择需要移除的股票' }).then((value) => {
            if (value) {
                codes = codes.filter(item => {
                    return item !== (value.exchange + value.description)
                })
                results = results.filter(item => {
                    return item.stockCode !== value.description
                })
            }
        });
    });
}



function fetchData(value, cb) {
    axios.get(`${baseUrl}${value}`)
        .then((rep) => {
            const result = rep.data;
            if (result.errorNo === 0 && result.data.length) {
                cb(result.data[0]);
            } else {
                const errMsg = result.data ? '获取数据失败，请检查股票代码是否有误！' : '获取数据失败，请检查网络或重试！';
                vscode.window.showErrorMessage(errMsg);
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