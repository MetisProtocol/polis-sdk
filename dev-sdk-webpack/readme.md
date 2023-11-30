## build sdk

1. cd dev-sdk
2. npm i
3. npm run build
4. rm -rf ../dev-sdk-webpack/dist
5. mv dist ../dev-sdk-webpack/dist

## build webpack

卸载 window 的 node.js 使用 nvm

1. cd dev-sdk-webpack
2. nvm list
3. nvm use 16
4. npm i
5. npm run build

output: MetisSDK.bundle.js
