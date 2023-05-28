const path = require("path");

module.exports = {
  // 您的库的入口点
  entry: "./dist/index.js",
  output: {
    path: path.resolve(__dirname, "./"),
    // 输出文件的名字
    filename: "MetisSDK.bundle.js",
    // 你的库的名字
    library: "MetisSDK",
    // 你的库的目标，可以是 'var', 'umd', 'commonjs', 'commonjs2', 'amd', 'this', 'assign', 'window', 'self', 'global', 'jsonp' 等，推荐使用 'umd'
    libraryTarget: "umd",
    // 为了使浏览器和Node.js都能使用你的库
    globalObject: "this",
  },
  module: {
    rules: [
      {
        test: /\.js$/, // 使用 babel 转译 js 文件
        exclude: /node_modules/, // 不转译 node_modules 下的文件
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
};
