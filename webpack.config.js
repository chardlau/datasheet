const path = require('path');

module.exports = {
  entry: './index.js',
  output: {
    library: 'DataSheet',
    libraryExport: 'default',
    libraryTarget: 'umd'
  },
  devServer: {
    contentBase: path.join(__dirname, 'example')
  }
};