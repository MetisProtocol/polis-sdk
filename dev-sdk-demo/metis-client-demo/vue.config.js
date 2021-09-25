// vue.config.js
module.exports = {
    devServer: {
        disableHostCheck: true,
        hot: true,
        open: true,
        // 域名
        host: '127.0.0.1',
        // 端口
        port: 8000,
        // 代理
        proxy: {
            '/api': {
                // target: 'https://rocket.metis.io/',
                target: 'http://localhost:5000/',
                pathRewrite: {
                    '^/api': '/api'
                },
                logLevel: 'debug'
            }
        }
    }
}