const jwt = require('jsonwebtoken')
// const Client = require('cubic-client')
const Cookies = require('cookies')

class ExpressMiddleware {
  constructor (config) {
    this.config = config
    /**
    this.authClient = new Client({
      api_url: this.config.authUrl,
      auth_url: this.config.authUrl,
      user_key: this.config.userKey,
      user_secret: this.config.userSecret
    })
    **/
  }

  decode (req, res, next) {
    req.url = req.url === '' ? '/' : decodeURI(req.url)
    next()
  }

  cookie (req, res, next) {
    const cookies = new Cookies(req, res)

    let cookie = {}
    try {
      // decode base64 to object
      cookie = JSON.parse(Buffer.from(cookies.get(this.config.authCookie), 'base64').toString('ascii'))
    } catch (err) {} // No cookie set, or not base64 encoded

    const accessToken = cookie.access_token
    const refreshToken = cookie.refresh_token

    // Set access token from cookie as auth header if none was provided already.
    if (accessToken && !req.headers.authorization) {
      req.headers.authorization = `bearer ${accessToken}`
    }

    // Set refresh token in case of the access token being expired.
    if (refreshToken) req.refresh_token = refreshToken

    return next()
  }

  async authorize (req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    req.user = {
      uid: ip,
      scp: ''
    }

    // Token present?
    if (req.headers.authorization) {
      let token = req.headers.authorization.replace(/bearer /i, '')

      // Set req.user from token
      try {
        req.user = jwt.verify(token, this.config.certPublic)
        req.access_token = token
        cubic.log.verbose(`${this.config.prefix} | (http) ${ip} connected as ${req.user.uid}`)
        return next()
      }

      // Invalid Token
      catch (err) {
        cubic.log.verbose(`${this.config.prefix} | (http) ${ip} rejected (${err})`)

        /* eslint camelcase: 'off' */
        // Refresh access token if refresh token is provided
        /**
        if (err.name === 'TokenExpiredError' && req.refresh_token) {
          const { access_token } = await this.authClient.post('/refresh', {
            refresh_token: req.refresh_token
          })

          if (access_token) {
            req.headers.authorization = `bearer ${access_token}`
            this.auth(req, res, next)
          } else {
            return res.status(401).json({
              error: 'Invalid Token.',
              reason: 'Refresh token could not be attributed to any user.'
            })
          }
        }

        // No refresh token or already refreshed
        else {
        **/
        return res.status(401).json({
          error: 'Invalid Token.',
          reason: err
        })
        // }
      }
    }

    // No token provided
    else {
      cubic.log.verbose(`${this.config.prefix} | (http) ${req.user.uid} connected without token`)
      return next()
    }
  }
}

module.exports = ExpressMiddleware
