import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import { Configuration as WebpackConfiguration } from "webpack";
import { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";

interface Configuration extends WebpackConfiguration {
    devServer?: WebpackDevServerConfiguration;
}

export default function(): Configuration {
    return {
        entry: "./src/index.tsx",
        module: {
            rules: [
                {
                    test    : /\.tsx?$/,
                    use     : "ts-loader",
                    exclude : /node_modules/
                }, {
                    test    : /\.html$/,
                    loader  : "file-loader",
                    exclude : /node_modules/,
                    options : {
                        name       : "[name].[ext]",
                        publicPath : "/"
                    }
                }, {
                    test    : /\.(svg|woff2)$/,
                    loader  : "file-loader",
                    exclude : /node_modules/,
                    options : {
                        name       : "[name].[ext]",
                        outputPath : "assets/",
                        publicPath : "./assets/"
                    }
                }, {
                    test    : /favicon\.png$/,
                    loader  : "file-loader",
                    exclude : /node_modules/,
                    options : {
                        name       : "[name].[ext]",
                        outputPath : "/",
                        publicPath : "./"
                    }
                }, {
                    test    : /\.css$/,
                    use: [MiniCssExtractPlugin.loader, "css-loader"]
                }
            ],
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
            // @ts-ignore
            plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })]
        },
        output: {
            publicPath : "/twitch-replay",
            filename   : "main.js",
            path       : path.resolve(__dirname, "dist")
        },
        plugins: [new MiniCssExtractPlugin()],
        devServer: {
            contentBase      : path.resolve(__dirname, "dist"),
            compress         : true,
            host             : "0.0.0.0",
            port             : 3000,
            disableHostCheck : true
        }
    }
};
