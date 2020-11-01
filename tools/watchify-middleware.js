
var createWatchify = require('./watchify')
var {EventEmitter} = require('events')
var debounce = require('lodash/debounce')
var concat = require('concat-stream')

var ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g;

function stripAnsi(str) {
	return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
};


// parses a syntax error for pretty-printing to console
function parseError (err) {
  // babelify@6.x
  if (err.codeFrame) { 
    return [err.message, err.codeFrame].join('\n\n')
  } 
  // babelify@5.x and browserify
  else { 
    return err.annotated || err.message
  }
}


function createBundler (browserify, opt) {
  opt = opt || {}
  var emitter = new EventEmitter()
  var delay = opt.delay || 0
  var closed = false
  var pending = false
  var time = Date.now()
  var updates = []
  var errorHandler = opt.errorHandler
  if (errorHandler === true) {
    errorHandler = defaultErrorHandler
  }

  var watchify = createWatchify(browserify, Object.assign({}, opt, {
    // we use our own debounce, so make sure watchify
    // ignores theirs
    delay: 0
  }))

  var contents = null

  emitter.close = function () {
    if (closed) return
    closed = true
    if (watchify) {
      // needed for watchify@3.0.0
      // this needs to be revisited upstream
      setTimeout(function () {
        watchify.close()
      }, 200)
    }
  }

  var bundleDebounced = debounce(bundle, delay)

  watchify.on('update', function (rows) {
    if (closed) return
    updates = rows
    pending = true
    time = Date.now()
    emitter.emit('pending', updates)
    bundleDebounced()
  })

  emitter.bundle = function () {
    if (closed) return
    time = Date.now()
    if (!pending) {
      pending = true
      process.nextTick(function () {
        emitter.emit('pending', updates)
      })
    }
    bundle()
  }

  // initial bundle
  if (opt.initialBundle !== false) {
    emitter.bundle()
  }

  return emitter

  function bundle () {
    if (closed) {
      update()
      return
    }

    var didError = false
    var outStream = concat(function (body) {
      if (!didError) {
        contents = body

        var delay = Date.now() - time
        emitter.emit('log', {
          contentLength: contents.length,
          elapsed: Math.round(delay),
          level: 'info',
          type: 'bundle'
        })

        bundleEnd()
      }
    })

    var wb = watchify.bundle()
    // it can be nice to handle errors gracefully
    if (typeof errorHandler === 'function') {
      wb.once('error', function (err) {
        err.message = parseError(err)
        contents = errorHandler(err) || ''

        didError = true
        emitter.emit('bundle-error', err)
        bundleEnd()
      })
    } else {
      wb.once('error', function (err) {
        err.message = parseError(err)
        emitter.emit('error', err)
        emitter.emit('bundle-error', err)
      })
    }
    wb.pipe(outStream)

    function bundleEnd () {
      update()
    }
  }

  function update () {
    if (closed) return
    if (pending) {
      pending = false
      emitter.emit('update', contents, updates)
      updates = []
    }
  }
}

function defaultErrorHandler (err) {
  console.error('%s', err)
  var msg = stripAnsi(err.message)
  return ';console.error(' + JSON.stringify(msg) + ');'
}


module.exports = function watchifyMiddleware (browserify, opt) {
  var emitter = createEmitter(browserify, opt)
  return emitter.middleware
}

module.exports.emitter = createEmitter

module.exports.getWatchifyVersion = () => "faux"; // require('watchify/package.json').version


function createEmitter (browserify, opt) {
  var bundler = createBundler(browserify, opt)
  var pending = false
  var contents = ''

  bundler.on('pending', function () {
    pending = true
  })

  bundler.on('update', function (data) {
    pending = false
    contents = data
  })

  bundler.middleware = function middleware (req, res) {
    if (pending) {
      bundler.emit('log', {
        level: 'debug',
        type: 'request',
        message: 'bundle pending'
      })

      bundler.once('update', function () {
        bundler.emit('log', {
          level: 'debug',
          type: 'request',
          message: 'bundle ready'
        })
        submit(req, res)
      })
    } else {
      submit(req, res)
    }
  }

  return bundler

  function submit (req, res) {
    res.setHeader('content-type', 'application/javascript; charset=utf-8')
    res.setHeader('content-length', contents.length)
    res.statusCode = req.statusCode || 200
    res.end(contents)
  }
}
