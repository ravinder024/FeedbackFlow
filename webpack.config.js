const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/widget/index.tsx',
  output: {
    path: path.resolve(__dirname, 'public/widget'),
    filename: 'index.js',
    library: {
      name: 'FeedbackFlowWidget',
      type: 'umd',
      export: 'default',
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.widget.json',
            transpileOnly: false
          }
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
  },
};
