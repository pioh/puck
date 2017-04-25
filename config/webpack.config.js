import webpack from 'webpack'
import cssnano from 'cssnano'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import config from './index.js'
import _debug from 'debug'
import path from 'path'
import jsfiles2 from './jsfiles'
import fs from 'fs'

let jsfiles = [...jsfiles2]
// import uniq from 'lodash/uniq'
// let jsfiles2 = uniq(jsfiles) // .map(p => p.replace(/\//g, '__'))
// jsfiles2 = []
const debug = _debug('app:webpack:config')
const paths = config.utils_paths
const {__DEV__, __PROD__, __SERVER_MODE__} = config.globals
// console.log(config.compiler_devtool)
debug('Create configuration.')
// console.log(path.join(__dirname, '..', 'node_modules'), paths.client())
const webpackConfig = {
  name    : 'client',
  target  : 'web',
  devtool : config.compiler_devtool || undefined,
  resolve : {
    mainFields : ['main'],
    modules    : [
      paths.client(),
      'node_modules',
      path.join(__dirname, '..', 'node_modules'),
    ],
    extensions: ['.js', '.jsx', '.json', '.css', '.scss', '.sass'],
    // root       : ['node_modules'],
    // modulesDirectories : [
    //   'node_modules',
    // ],
  },
  module: {
    rules: [],
  },
  // recordsOutputPath: path.join(__dirname, '..', 'records.json')
}
// let jsfiles = []
// let sh = require('shelljs')
// let jsfiles = sh.grep('-R', "'import.*from.*'", sh.find('src').filter(a => a.match(/\.js$/)))
// // .filter(p => p.match(/^[^.]/))
// console.log(jsfiles)
jsfiles = jsfiles.filter(f => fs.existsSync(path.join(__dirname, '../node_modules/', f)))
jsfiles.sort((a, b) => a.length - b.length)
  .sort((a, b) => (a.replace(/[^/]/g, '').length || 100) - (b.replace(/[^/]/g, '').length || 100))
jsfiles.reverse()
// console.log(jsfiles2.slice().reverse())
// console.log(jsfiles)

// console.log(jsfiles)
// var sh = require('execSync')
// console.log(sh.exec('echo $PWD').stdout)
// ------------------------------------
// Entry Points
// ------------------------------------
var APP_ENTRY_PATHS = []
if (!__SERVER_MODE__) {
  APP_ENTRY_PATHS = [
    paths.client('main.js'),
  ]
  webpackConfig.entry = {
    // app: __DEV__
    //   ? APP_ENTRY_PATHS.concat(`webpack-hot-middleware/client?path=${config.compiler_public_path}__webpack_hmr`)
    //   : APP_ENTRY_PATHS,
    // app: APP_ENTRY_PATHS,
    // vendor : config.compiler_vendor,
    // router : ['containers/Router/Router.js'],
  }

  jsfiles.forEach((p, i) => {
    webpackConfig.entry[p.replace(/\//g, '_')] = [p]
  })
  webpackConfig.entry.app = APP_ENTRY_PATHS
} else {
  APP_ENTRY_PATHS = [
    paths.client('server/main.js'),
  ]
  webpackConfig.entry = {
    server: [...APP_ENTRY_PATHS],
  }
}

// ------------------------------------
// Bundle Output
// ------------------------------------
if (!__SERVER_MODE__) {
  webpackConfig.output = {
    filename   : `[name].[${config.compiler_hash_type}].js`,
    path       : paths.dist(),
    publicPath : config.compiler_public_path
  }
  if (__PROD__) {
    webpackConfig.output = {
      filename      : '[name].[chunkhash].js',
      chunkFilename : '[name].[chunkhash].js',
      path          : paths.dist(),
      publicPath    : config.compiler_public_path
    }
  }
} else {
  webpackConfig.output = {
    filename   : `[name].js`,
    path       : config.SERVER_JS_PATH,
    publicPath : config.compiler_public_path
  }
}
const sassLoaderOptions = {
  data         : '@import "var";',
  includePaths : [
    paths.client('styles'),
    'node_modules',
    'react-toolbox/lib'
  ],
  sourceMap: true,
}
const postcssOptions = [cssnano({
  autoprefixer: {
    add      : true,
    remove   : true,
    browsers : ['> 5%']
  },
  discardComments: {
    removeAll: true
  },
  discardUnused : false,
  mergeIdents   : false,
  reduceIdents  : false,
  safe          : true,
  sourcemap     : true,
})]
// ------------------------------------
// Plugins
// ------------------------------------
webpackConfig.plugins = [
  new webpack.LoaderOptionsPlugin({
    options: {
      context : path.resolve(__dirname, '..'),
      postcss : postcssOptions,
      // sassLoader : sassLoaderOptions,
    },
    htmlLoader: {
      whateverProp: true
    }
  }),
  new webpack.DefinePlugin(config.globals),
]

if (!__SERVER_MODE__) {
  webpackConfig.plugins.push(
    new HtmlWebpackPlugin({
      template : paths.client('index.html'),
      hash     : false,
      favicon  : paths.client('static/favicon.ico'),
      filename : 'index.html',
      inject   : 'body',
      minify   : {
        collapseWhitespace: true
      }
    })
  )
}
let extractCss = new ExtractTextPlugin({
  filename  : '[name].[id].[contenthash].css',
  allChunks : true,
  disable   : __DEV__ || __SERVER_MODE__,
})
if (__DEV__ && !__SERVER_MODE__) {
  debug('Enable plugins for live development (HMR, NoErrors).')
  webpackConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    // new webpack.NoErrorsPlugin()
  )
} else if (__PROD__) {
  debug('Enable plugins for production (OccurenceOrder, Dedupe & UglifyJS).')
  webpackConfig.plugins.push(
    // new webpack.optimize.OccurrenceOrderPlugin(), // on by default
    // new webpack.optimize.DedupePlugin(),
  )
  if (!__SERVER_MODE__) {
    webpackConfig.plugins.push(
      // extractCss,
      // new webpack.optimize.AggressiveSplittingPlugin({
      //   minSize : 30 * 1024,
      //   maxSize : 50 * 1024
      // }),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          unused        : true,
          dead_code     : true,
          warnings      : false,
          properties    : true,
          drop_debugger : true,
          unsafe        : true,
          unsafe_comps  : true,
          conditionals  : true,
          comparisons   : true,

          sequences : true,
          join_vars : true,

          evaluate    : true,
          booleans    : true,
          loops       : true,
          hoist_funs  : true,
          if_return   : true,
          cascade     : true,
          negate_iife : true,
        },
        comments  : false,
        sourceMap : true,
      }),
      // new webpack.optimize.AggressiveSplittingPlugin({
      //   minSize : 30 * 1024,
      //   maxSize : 50 * 1024
      // }),
    )
  } else {
    webpackConfig.plugins.push(
      new webpack.optimize.UglifyJsPlugin({
        // compress: false,
        compress: {
          unused        : true,
          dead_code     : true,
          warnings      : false,
          properties    : true,
          drop_debugger : true,
          unsafe        : true,
          unsafe_comps  : true,
          conditionals  : true,
          comparisons   : true,

          sequences : true,
          join_vars : true,

          evaluate     : true,
          booleans     : true,
          loops        : true,
          hoist_funs   : true,
          if_return    : true,
          cascade      : true,
          negate_iife  : true,
          drop_console : true,
        },
        comments: false,
      }),
    )
  }
}

// Don't split bundles during testing, since we only want import one bundle
if (!__SERVER_MODE__) {
  // webpackConfig.plugins.push(
  //   new webpack.optimize.CommonsChunkPlugin({
  //     names: ['vendor'], // [...jsfiles2, 'vendor'],
  //     // minChunks : 2,
  //     // children  : true,
  //     // async     : true,
  //   }),
  // )
  webpackConfig.plugins.push(
    // ...jsfiles.map(m =>
    new webpack.optimize.CommonsChunkPlugin({
      names     : jsfiles.map(f => f.replace(/\//g, '_')),
      filename  : '[name].[hash].js',
      // chunks    : jsfiles,
      minChunks : Infinity
      // filename : m.replace(/\//g, '_') + '.[hash].js',
    })
    // )
  )
      // filename  : 'mobx.js',
      // minChunks : function (module, count) {
      //   // If module has a path, and inside of the path exists the name "somelib",
      //   // and it is used in 3 separate chunks/entries, then break it out into
      //   // a separate chunk with chunk keyname "my-single-lib-chunk", and filename "my-single-lib-chunk.js"
      //   console.log(module, count)
      //   return module.resource && (/mobx/).test(module.resource) && count === 3
      // }
  //   })
  // )
}

// ------------------------------------
// Pre-Loaders
// ------------------------------------
/*
[ NOTE ]
We no longer use eslint-loader due to it severely impacting build
times for larger projects. `npm run lint` still exists to aid in
deploy processes (such as with CI), and it's recommended that you
use a linting plugin for your IDE in place of this loader.
If you do wish to continue using the loader, you can uncomment
the code below and run `npm i --save-dev eslint-loader`. This code
will be removed in a future release.
*/
webpackConfig.module.rules.push({
  test    : /\.(js|jsx)$/,
  loader  : 'eslint-loader',
  options : {
    configFile  : paths.base('.eslintrc'),
    emitWarning : __DEV__,
    fix         : false,
    cache       : true,
  },
  exclude : /node_modules/,
  enforce : 'pre',
})

// ------------------------------------
// Loaders
// ------------------------------------
// JavaScript / JSON
var babelSettings = {
  cacheDirectory : true,
  presets        : [
    ['es2015', {
      modules: false,
    }],
    'stage-0', 'react'
  ],
  plugins: [
    ['transform-decorators-legacy'],
    ['transform-promise-to-bluebird'],
    ['transform-async-to-module-method', {
      'module' : 'bluebird',
      'method' : 'coroutine',
    }],
  ],
  env: {
    production: {
      presets: ['react-optimize'],
    }
  },
}

webpackConfig.module.rules.push({
  test    : /\.(js|jsx)$/,
  exclude : /(?=.*\b(node_modules)\b)(?!.*\b(node_modules\/[\w.-]+\/(?:src|es)|react-router|redux-router|redux-saga|react-reinput|react-bootstrap-multiselect|react-tag-input|react-bootstrap-datetimepicker|react-tag-input|react-dnd-html5-backend)\b)(.+)/i, // eslint-disable-line max-len
  use     : [
    {
      loader  : 'babel-loader',
      options : {
        ...babelSettings,
      }
      // 'babel?' + JSON.stringify(babelSettings),
    }
  ]
})

// -- proto loaders
webpackConfig.module.rules.push({
  test   : /\.proto$/,
  loader : 'proto-loader'
})

// ------------------------------------
// Style Loaders
// ------------------------------------
// We use cssnano with the postcss loader, so we tell
// css-loader not to duplicate minimization.
// const BASE_CSS_LOADER = 'css?sourceMap&-minimize'
const BASE_CSS_LOADER = {
  loader  : 'css-loader',
  options : {
    sourceMap : true,
    minimize  : false,
  }
}
// Add any packge names here whose styles need to be treated as CSS modules.
// These paths will be combined into a single regex.
const PATHS_TO_TREAT_AS_CSS_MODULES = [
  'react-toolbox', 'susy', 'compass-mixins'
]

// If config has CSS modules enabled, treat this project's styles as CSS modules.
if (config.compiler_css_modules) {
  PATHS_TO_TREAT_AS_CSS_MODULES.push(
    paths.client().replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&') // eslint-disable-line
  )
}

const isUsingCSSModules = !!PATHS_TO_TREAT_AS_CSS_MODULES.length
const cssModulesRegex = new RegExp(`(${PATHS_TO_TREAT_AS_CSS_MODULES.join('|')})`)


// Loaders for styles that need to be treated as CSS modules.
if (isUsingCSSModules) {
  // const cssModulesLoader = [
  //   BASE_CSS_LOADER,
  //   'modules',
  //   'importLoaders=1',
  //   'localIdentName=[name]__[local]___[hash:base64:5]'
  // ].join('&')
  const cssModulesLoader = {
    ...BASE_CSS_LOADER,
    options: {
      ...BASE_CSS_LOADER.options,
      modules        : true,
      importLoaders  : 1,
      localIdentName : '[name]__[local]___[hash:base64:5]',
    }
  }

  webpackConfig.module.rules.push({
    test    : /\.(scss|sass)$/,
    include : cssModulesRegex,
    exclude : /\.var\.(scss|sass)$/,
    use     : extractCss.extract({
      use: [
        // {loader: 'style-loader'},
        cssModulesLoader,
        {loader: 'postcss-loader'},
        {
          loader  : 'sass-loader',
          options : {
            ...sassLoaderOptions,
            sourceMap: true
          }
        }
      ],
      fallback: 'style-loader',
    })
  })

  webpackConfig.module.rules.push({
    test    : /\.css$/,
    include : cssModulesRegex,
    exclude : /\.var\.(scss|sass)$/,
    // use     : [
    //   {loader: 'style-loader'},
    //   cssModulesLoader,
    //   {loader: 'postcss-loader'},
    // ]
    use     : extractCss.extract({
      use: [
        // {loader: 'style-loader'},
        cssModulesLoader,
        {loader: 'postcss-loader'},
      ],
      fallback: 'style-loader',
    })
  })
}

// Loaders for files that should not be treated as CSS modules.
const excludeCSSModules = isUsingCSSModules ? cssModulesRegex : false
webpackConfig.module.rules.push({
  test    : /\.(scss|sass)$/,
  exclude : [excludeCSSModules, /\.var\.(scss|sass)$/],
  // use     : [
  //   {loader: 'style-loader'},
  //   BASE_CSS_LOADER,
  //   {loader: 'postcss-loader'},
  //   {
  //     loader  : 'sass-loader',
  //     options : {
  //       ...sassLoaderOptions,
  //       sourceMap: true,
  //     }
  //   },
  // ],
  use     : extractCss.extract({
    use: [
      // {loader: 'style-loader'},
      BASE_CSS_LOADER,
      {loader: 'postcss-loader'},
      {
        loader  : 'sass-loader',
        options : {
          ...sassLoaderOptions,
          sourceMap: true,
        }
      },
    ],
    fallback: 'style-loader',
  })
})

webpackConfig.module.rules.push({
  test    : /\.css$/,
  exclude : [excludeCSSModules, /\.var\.(scss|sass)$/],
  // use     : [
  //   {loader: 'style-loader'},
  //   BASE_CSS_LOADER,
  //   {loader: 'postcss-loader'},
  // ],
  use     : extractCss.extract({
    use: [
      // {loader: 'style-loader'},
      BASE_CSS_LOADER,
      {loader: 'postcss-loader'},
    ],
    fallback: 'style-loader',
  })
})

webpackConfig.module.rules.push({
  test : /\.var\.(scss|sass)$/,
  use  : [{loader: 'sass-variable-loader'}],
})

// ------------------------------------
// Style Configuration
// ------------------------------------


// File loaders
/* eslint-disable */
webpackConfig.module.rules.push(
  { test: /\.woff(\?.*)?$/,  loader: 'url-loader', options: {prefix:'fonts/',name:'[path][name].[ext]',limit:10000, mimetype:'application/font-woff'}},
  { test: /\.woff2(\?.*)?$/, loader: 'url-loader', options: {prefix:'fonts/',name:'[path][name].[ext]',limit:10000, mimetype:'application/font-woff2'}},
  { test: /\.otf(\?.*)?$/,   loader: 'file-loader', options: {prefix:'fonts/',name:'[path][name].[ext]',limit:10000, mimetype:'font/opentype'}},
  { test: /\.ttf(\?.*)?$/,   loader: 'url-loader', options: {prefix:'fonts/',name:'[path][name].[ext]',limit:10000, mimetype:'application/octet-stream'}},
  { test: /\.eot(\?.*)?$/,   loader: 'file-loader', options: {prefix:'fonts/',name:'[path][name].[ext]'}},
  { test: /\.svg(\?.*)?$/,   loader: 'url-loader', options: {prefix:'fonts/',name:'[path][name].[ext]',limit:10000, mimetype:'image/svg+xml'}},
  { test: /\.(png|jpg)$/,    loader: 'url-loader', options: {limit:8192}}
)
/* eslint-enable */

// ------------------------------------
// Finalize Configuration
// ------------------------------------
// when we don't know the public path (we know it only when HMR is enabled [in development]) we
// need to use the extractTextPlugin to fix this issue:
// http://stackoverflow.com/questions/34133808/webpack-ots-parsing-error-loading-fonts/34133809#34133809

// if (!__DEV__ && !__SERVER_MODE__) {
//   // debug('Apply ExtractTextPlugin to CSS loaders.')
//   webpackConfig.module.rules.filter((rule) =>
//     rule.use && rule.use.find((use) => use.loader === 'css-loader')
//   ).forEach((rule) => {
//     // const [first, ...rest] = rule.use
//     console.log(rule.use.map(u => u.loader).join('!'))
//     let loaders = rule.use.map(u =>
//       u.loader + (u.options ? '?' + Object.entries(u.options).map(a => a.join('=')).join('&') : '')
//     )
//     console.log(loaders)
//     rule.loader = ExtractTextPlugin.extract({
//       fallbackLoader : loaders[0],
//       loader         : loaders.slice(1).join('!'),
//       // use            : rule.use,
//     })
//     Reflect.deleteProperty(rule, 'use')
//   })
// }
// webpackConfig.plugins.push(
// let extractCSS = new ExtractTextPlugin({
//   filename  : '[name].[contenthash].css',
//   allChunks : true,
//   disable   : __DEV__ || __SERVER_MODE__,
// })
// )

// if (__PROD__ && !__SERVER_MODE__) {

// }
webpackConfig.plugins.push(extractCss)
export default webpackConfig
