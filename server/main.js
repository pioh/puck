const express = require('express')
const debug = require('debug')('app:server')
const webpack = require('webpack')
const webpackConfig = require('../config/webpack.config').default
const config = require('../config').default
const proxy = require('redbird')({port: 3000, xfwd: false, bunyan: false})
const basenames = require('../src/config/basenames')

const app = express()
const paths = config.utils_paths
const port  = config.server_port

// This rewrites all routes requests to the root /index.html file
// (ignoring file requests). If you want to implement universal
// rendering, you'll want to remove this middleware.
app.use(require('connect-history-api-fallback')({
  // rewrites: [
  //   {
  //     from : /^(?!\/9r\/telephonist\/)/,
  //     to   : function (context) {
  //       return '/9r/telephonist/' + context.parsedUrl.pathname.replace(/^\/?(9r)?\/?(telephonist)?\/?/, '')
  //     }
  //   },
  // ],
  rewrites: [
    {
      from : /^.+\/[^/]+\.(css|js)$/,
      to   : function (context) {
        return context.parsedUrl.pathname.replace(/^.+(\/[^\/]+\.(?:css|js))$/, '$1')
      }
    },
    {
      from : /^.+\/favicon.ico$/,
      to   : function (context) {
        return '/favicon.ico'
      }
    },
    {
      from : /^.+\/img\/[^\/]+$/,
      to   : function (context) {
        return context.parsedUrl.pathname.replace(/^.+(\/img\/[^\/]+)$/, '$1')
      }
    },
  ],
  index  : '/index.html', // '/9r/telephonist/index.html',
  logger : console.log.bind(console),
}))

// ------------------------------------
// Apply Webpack HMR Middleware
// ------------------------------------
if (config.env === 'development') {
  // console.log(JSON.stringify(webpackConfig, 2, 2))
  const compiler = webpack(webpackConfig)

  debug('Enable webpack dev and HMR middleware')
  app.use(require('webpack-dev-middleware')(compiler, {
    publicPath  : webpackConfig.output.publicPath,
    contentBase : paths.client(),
    hot         : true,
    quiet       : config.compiler_quiet,
    noInfo      : config.compiler_quiet,
    lazy        : false,
    stats       : config.compiler_stats
  }))
  // app.use('/', require('webpack-hot-middleware')(compiler))

  // Serve static assets from ~/src/static since Webpack is unaware of
  // these files. This middleware doesn't need to be enabled outside
  // of development since this directory will be copied into ~/dist
  // when the application is compiled.
  app.use('/telephonist/', express.static(paths.client('static')))
} else {
  debug(
    'Server is being run outside of live development mode, meaning it will ' +
    'only serve the compiled application bundle in ~/dist. Generally you ' +
    'do not need an application server for this and can instead use a web ' +
    'server such as nginx to serve your static files. See the "deployment" ' +
    'section in the README for more information on deployment strategies.'
  )

  // Serving ~/dist by default. Ideally these files should be served by
  // the web server and not the app server, but this helps to demo the
  // server in production.
  app.use(express.static(paths.dist()))
}

app.listen(port)

for (let basename of basenames.basenames) {
  if (basename !== '') {
    proxy.register(`localhost:3000/${basename}`, `http://localhost:8080/${basename}`)
    proxy.register(`test.srg-it.ru:3000/${basename}`, `https://test.srg-it.ru/${basename}`)
    for (let reactPath of basenames.reactPaths) {
      proxy.register(`localhost:3000/${basename}/${reactPath}`, `http://localhost:3030/${reactPath}`)
      proxy.register(`test.srg-it.ru:3000/${basename}/${reactPath}`, `http://localhost:3030/${reactPath}`)
    }
  } else {
    proxy.register(`localhost:3000`, `http://localhost:3030`)
  }
}
// proxy.register('localhost:3001/9r/rest', 'http://localhost:8080/9r/rest')

module.exports.default = app
