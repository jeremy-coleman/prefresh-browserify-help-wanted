
const {PassThrough, Transform} = require('stream')
const {minify} = require('terser')
const jetpack = require('fs-jetpack')

var TERSER_CONFIG = {
  compress: {
      passes: 10,
      dead_code: true,
      keep_infinity: true,
      ecma: 9,
      hoist_funs: true,
      reduce_funcs: false, // i think this will cause polymorphic expressions
      unsafe_math: true,
      unsafe_proto: true, //good for perf maybe? but way slow to bundle
      unsafe_undefined: true, // turns undefined into void 0 , should really be called ensure_safe_undefined
      unsafe_regexp: true,
      negate_iife: false,
      unsafe_arrows: true, //arrow fns run faster in v8
      pure_getters: true,
      hoist_vars: true,
      arguments: true,
      unsafe_methods: true,
      
      //keep_fnames: true //idk seems like you should

  },
  // mangle:{
  //   //keep_fnames: true,
  //   module: true,
  //   //regex: /^_MIN_/
  // },

  ecma: 9,
  module: true,
  //nameCache: {},
  toplevel: true,
  output:{
    ecma: 9,
    wrap_iife: true
  }
}

const minifyStream = (file) => {
    const shouldMinify = /\.[tj]sx?$/.test(file);
    //if (!/\.tsx?$|\.jsx?$/.test(file) || file.indexOf("node_modules") > 0 || file.indexOf("src") < 0) {
    if (!shouldMinify) {
      return new PassThrough();
    }
    var _transform = new Transform();
    //var minifiedOutput = minify(jetpack.read(file), TERSER_CONFIG).code;
    //console.log(jetpack.read(file))
    _transform._write = (chunk, encoding, next) => {
      let input = chunk.toString('utf8')
      //console.log(input)
      let output = minify(input).code
      //console.log(output)
      _transform.push(output)
      next();
    }
    return _transform
  };

  module.exports = {
    minifyStream
  }