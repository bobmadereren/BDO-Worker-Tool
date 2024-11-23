import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const entry = './src/index.js';

const output = {
    filename: 'bundle[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
}

const devtool = 'source-map';

const devServer = {
    static: {
        directory: path.resolve(__dirname, 'dist'),
    },
    port: 666,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,
}

const mode = 'development';

const module = {
    rules: [
        {
            test: /\.css$/,
            use: [
                'style-loader',
                'css-loader'
            ]
        },
        {
            test: /\.png$/i,
            type: 'asset/resource'
        }
    ]
}

const plugins = [
    new HtmlWebpackPlugin({
        title: 'BDO Worker Tool!',
        filename: 'index.html',
        template: 'src/index.html'
    }),
];

export default { entry, output, devtool, devServer, mode, module, plugins };