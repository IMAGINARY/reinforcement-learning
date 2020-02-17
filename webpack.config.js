const path = require('path');

module.exports = {
  entry: './src/js/view.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
