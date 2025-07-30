const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const loader = require('sass-loader');
const { name } = require('file-loader');

// web 5
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const TerserWebpackPlugin = require('terser-webpack-plugin');
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin');
const { type } = require('os');


const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;
// birinchi agar isdev bosa name.ext

// ikkinchisi bosa isprod name.contenthash.ext
const filename = (ext) => isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;


const optimization = () => {
   const configObj = {
      splitChunks: {
         chunks: 'all'
      }
   }

   if (isProd) {
      configObj.minimize = true;
      configObj.minimizer = [
         new CssMinimizerWebpackPlugin(),
         new TerserWebpackPlugin()
      ];
   }
   return configObj
}

const plugins = () => {
   const basePlugins = [
      new HtmlWebpackPlugin({
         template: path.resolve(__dirname, 'src/index.html'),
         filename: 'index.html',
         minify: {
            collapseWhitespace: isProd
         }
      }),
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
         filename: `./css/${filename('css')}`
      }),
      // new CopyWebpackPlugin({
      //    patterns: [
      //       // src. assets => app/assets 
      //       { from: path.resolve(__dirname, 'src/assets'), to: path.resolve(__dirname, 'app/assets/'), }
      //    ]
      // }),
   ]

   if (isProd) {
      basePlugins.push(
         new ImageminPlugin({
            bail: false, // Ignore errors on corrupted images
            cache: true,
            imageminOptions: {
               plugins: [
                  ["gifsicle", { interlaced: true }],
                  ["jpegtran", { progressive: true }],
                  ["optipng", { optimizationLevel: 5 }],
                  [
                     "svgo",
                     {
                        plugins: [
                           {
                              removeViewBox: false
                           }
                        ]
                     }
                  ]
               ]
            }
         })
      )
   }

   return basePlugins;
}

module.exports = {
   context: path.resolve(__dirname, "src"),
   mode: isProd ? 'production' : 'development',
   entry: './js/main.js',
   output: {
      filename: `./js/${filename('js')}`,
      path: path.resolve(__dirname, "app"),
   },
   devServer: {
      historyApiFallback: true,
      static: {
         directory: path.resolve(__dirname, 'app'),
      },
      // open: true,
      // compress: true,
      hot: true,
      port: 3000,
   },
   optimization: optimization(), // обязательно вызвать функцию
   devtool: isProd ? false : 'source-map',
   plugins: plugins(), // обязательно вызвать функцию
   module: {
      rules: [

         // ? html , css , sass | scss successfully 
         // !

         // html loader
         {
            test: /\.html$/i,
            loader: 'html-loader'
         },

         // css loader
         {
            test: /\.css$/i,
            use: [MiniCssExtractPlugin.loader, 'css-loader']
         },

         // scss loader
         // {
         //    test: /\.s[ac]ss$/i,
         //    use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
         // },


         // ? -------------------------------------------------------------------
         // ? -------------------------------------------------------------------
         {
            test: /\.s[ac]ss$/i,
            use: [
               {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                     publicPath: (resourcePath, context) => {
                        return path.relative(path.dirname(resourcePath), context) + '/';
                     }
                  }

               },
               'css-loader', 'sass-loader'
            ]
         },

         // ? -------------------------------------------------------------------------------------
         // webpack 5 новый спосап чтобы вместо file-loader
         {
            test: /\.(gif|png|jpe?g|svg)$/i,
            type: 'asset/resource',
            generator: {
               filename: 'img/[name][contenthash][ext]'
            }
         },

         {
            test: /\.(woff2?|ttf|eot)$/i,
            type: 'asset/resource',
            generator: {
               filename: 'fonts/[name][contenthash][ext]'
            }
         },


         // ? ---------------------------------------------------------------------------------
         // ? ---------------------------------------------------------------------------------
         // ! js

         {
            test: /\.js$/i,
            exclude: /node_modules/,
            use: ['babel-loader']
         }
      ]
   }
};
