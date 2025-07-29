const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ImageminPlugin = require('imagemin-webpack')

// webpack v5
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const filename = (ext) => isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;

const optimization = () => {
   const configObj = {
      // елси найдёт повторяюшии елемент то он вынесит их оддельно 
      // для того чтобы подключит этот file один раз
      splitChunks: {
         chunks: 'all'
      }
   };
   if (isProd) {
      // для того чтобы включаем минификацию
      configObj.minimizer = true;
      configObj.minimizer = [
         new CssMinimizerWebpackPlugin(),
         new TerserWebpackPlugin()
      ]
   }
   return configObj;
}

// plugin optimizate

const plugins = () => {
   const basePlugins = [
      // подключения html через plugin
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

      new CopyWebpackPlugin({
         patterns: [
            {
               // принисти все assets 
               from: path.resolve(__dirname, 'src/assets'),
               // в app 
               to: path.resolve(__dirname, 'app'),
            }
         ]
      }),
   ];

   if (isProd) {
      basePlugins.push(
         new ImageminPlugin({
            bail: false, // Ignore errors on corrupted images
            cache: true,
            imageminOptions: {
               // Before using imagemin plugins make sure you have added them in `package.json` (`devDependencies`) and installed them

               // Lossless optimization with custom option
               // Feel free to experiment with options for better result for you
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
   mode: 'development',
   context: path.resolve(__dirname, 'src'),
   entry: './js/main.js',
   // куда всё будет складыватся 
   output: {
      filename: `./js/${filename('js')}`,
      path: path.resolve(__dirname, 'app'),
      publicPath: '',
   },
   module: {
      // !---------------------------------------

      // в новых верси webpack hmr нету , точнее 
      // В новых версиях mini-css-extract-plugin Hot Module Replacement 
      // работает автоматически в режиме разработки, поэтому опция hmr была удалена. 
      rules: [
         // import html 
         // подключени и обработка html 
         {
            test: /\.html$/i,
            use: 'html-loader',
         },

         // import css 
         // и обработка css
         {
            test: /\.css$/i,
            use: [MiniCssExtractPlugin.loader, 'css-loader'],
         },

         //! ---------------------------------------

         // import scss
         // и обработка sass
         {
            test: /\.s[ac]ss$/i,
            use: [
               {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                     // для исправления пути img
                     publicPath: (resourcePath, context) => {
                        return path.relative(path.dirname(resourcePath), context) + '/'
                     }
                  }
               }, 'css-loader', 'sass-loader'
            ],
         },

         //! ---------------------------------------

         // import file
         // проблема с file  | в  app приходит два file с картинкой оди внутри папки img/img.jpg
         // а фторой в самом папки app / img.jpg 
         // но у первого внутри есть изоброжения а у второго нету
         {
            test: /\.(?:|gif|png|jpg|jpeg|svg)$/i,
            use: [{
               loader: 'file-loader',
               options: {
                  name: `./img/${filename('[ext]')}`
               }
            }],
         },


         //! ---------------------------------------

         // fonts 
         {
            test: /\.(?:|woff2)$/i,
            use: [{
               loader: 'file-loader',
               options: {
                  name: `./fonts/${filename('[ext]')}`
               }
            }],
         },

         // ! -----------------------------------------

         {
            test: /\.js$/,
            exclude: /node_modules/,
            use: ['babel-loader']
            // babel это обрабочик который помогает перемести 
            // наш код вновом стандарте для старый
            // код вновом стандарте не
            // все браузера не поддержывают
            // babel-loader | делает loader для обработки 
            // babel-preset-env-webpack | он определает присет для обработки
            // babel-core это сам babel
         },
      ]
   },

   // нужен для того чтобы делать соурс мопы
   // log da korsatib turdi
   devtool: isProd ? false : 'source-map',

   // устоновления дев сервера
   devServer: {
      historyApiFallback: true,
      static: {
         directory: path.resolve(__dirname, 'app'),
      },
      open: true,
      compress: true,
      hot: true,
      port: 3000,
   },
   // оптимзатция assets 
   optimization: optimization(),
   plugins: plugins(),
};