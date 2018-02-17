/**
 * Middleware Functions
 */
const HTTP = require('./adapters/http.js')
const Sockets = require('./adapters/sockets.js')
const Cache = require('../middleware/cache.js')
const logger = require('../middleware/logger.js')

/**
 * Procedurally builds up http/sockets server
 */
class Server {
  /**
   * Loads up HTTP/Sockets server and modifies it
   */
  constructor (config) {
    this.http = new HTTP(config.port)
    this.sockets = new Sockets(this.http.server)
    this.cache = new Cache(config)
    this.setRequestClient()
    this.applyMiddleware()
    this.applyRoutes(config)
  }

  /**
   * Applies Middleware to adapters
   */
  applyMiddleware () {
    this.use(logger.log)
    this.use(this.cache.check)
  }

  /**
   * Apply Routes/Events after Middleware for correct order
   */
  applyRoutes (config) {
    require(config.routes)(this.http)
    require(config.events)(this.sockets, config)
  }

  /**
   * Loads RequestController into server adapters to process requests to core node
   */
  setRequestClient () {
    this.http.request.client = this.sockets
    this.sockets.request.client = this.sockets
  }

  /**
   * Sets up connection adapter middleware fired on each request
   */
  use (route, fn, verb) {
    this.http.use(route, fn, verb)
    this.sockets.use(route, fn, verb)
  }
}

module.exports = Server
