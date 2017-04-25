import fs from 'fs-extra'
import _debug from 'debug'
import webpackCompiler from './webpack-compiler'
import webpackConfig from './webpack.config'
import config from './index.js'

const debug = _debug('app:bin:compile')
const paths = config.utils_paths

;(async function () {
  try {
    debug('Run compiler')
    const stats = await webpackCompiler(webpackConfig)
    // fs.writeFileSync('stats.json', JSON.stringify(stats))
    if (stats.warnings.length && config.compiler_fail_on_warning) {
      debug('Config set to fail on warning, exiting with status code "1".')
      process.exit(1)
    }
    debug('Copy static assets to dist folder.')
    if (!config.globals.__SERVER_MODE__) {
      fs.copySync(paths.client('static'), paths.dist())
    }
  } catch (e) {
    debug('Compiler encountered an error.', e)
    process.exit(1)
  }
})()
