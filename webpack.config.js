import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    entry: './src/index.js',
    
    output: {
        filename: 'bundle[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },

    devServer: {
        port: 666,
        open: true,
        hot: true,
        compress: true,
    },

    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: 'BDO Worker Tool!',
            filename: 'index.html',
            template: 'src/index.html'
        }),
    ]
};