"use strict";

const fs = require("fs");
const { join, resolve } = require("path");
const http = require("http");
const { parse } = require("querystring");

const FILES = {};
const noop = () => {};

//mime

function Mime() {
  this._types = Object.create(null);
  this._extensions = Object.create(null);

  for (var i = 0; i < arguments.length; i++) {
    this.define(arguments[i]);
  }

  this.define = this.define.bind(this);
  this.getType = this.getType.bind(this);
  this.getExtension = this.getExtension.bind(this);
}

Mime.prototype.define = function (typeMap, force) {
  for (var type in typeMap) {
    var extensions = typeMap[type].map(function (t) {
      return t.toLowerCase();
    });
    type = type.toLowerCase();

    for (var i = 0; i < extensions.length; i++) {
      var ext = extensions[i];

      // '*' prefix = not the preferred type for this extension.  So fixup the
      // extension, and skip it.
      if (ext[0] == "*") {
        continue;
      }

      if (!force && ext in this._types) {
        throw new Error(
          'Attempt to change mapping for "' +
            ext +
            '" extension from "' +
            this._types[ext] +
            '" to "' +
            type +
            '". Pass `force=true` to allow this, otherwise remove "' +
            ext +
            '" from the list of extensions for "' +
            type +
            '".'
        );
      }

      this._types[ext] = type;
    }

    // Use first extension as default
    if (force || !this._extensions[type]) {
      var ext = extensions[0];
      this._extensions[type] = ext[0] != "*" ? ext : ext.substr(1);
    }
  }
};

Mime.prototype.getType = function (path) {
  path = String(path);
  var last = path.replace(/^.*[/\\]/, "").toLowerCase();
  var ext = last.replace(/^.*\./, "").toLowerCase();

  var hasPath = last.length < path.length;
  var hasDot = ext.length < last.length - 1;

  return ((hasDot || !hasPath) && this._types[ext]) || null;
};

Mime.prototype.getExtension = function (type) {
  type = /^\s*([^;\s]*)/.test(type) && RegExp.$1;
  return (type && this._extensions[type.toLowerCase()]) || null;
};

var mime = new Mime(require("./mime_standard.js"));

/* -------------------------------------------------------------------------- */
/*                                   matchit                                  */
/* -------------------------------------------------------------------------- */

const SEP = "/";
// Types ~> static, param, any, optional
const STYPE = 0,
  PTYPE = 1,
  ATYPE = 2,
  OTYPE = 3;
// Char Codes ~> / : *
const SLASH = 47,
  COLON = 58,
  ASTER = 42,
  QMARK = 63;

function every(arr, cb) {
  var i = 0,
    len = arr.length;

  for (; i < len; i++) {
    if (!cb(arr[i], i, arr)) {
      return false;
    }
  }

  return true;
}

function strip(str) {
  if (str === SEP) return str;
  str.charCodeAt(0) === SLASH && (str = str.substring(1));
  var len = str.length - 1;
  return str.charCodeAt(len) === SLASH ? str.substring(0, len) : str;
}

function split(str) {
  return (str = strip(str)) === SEP ? [SEP] : str.split(SEP);
}

function isMatch(arr, obj, idx) {
  idx = arr[idx];
  return (
    (obj.val === idx && obj.type === STYPE) ||
    (idx === SEP
      ? obj.type > PTYPE
      : obj.type !== STYPE && (idx || "").endsWith(obj.end))
  );
}

function match(str, all) {
  var i = 0,
    tmp,
    segs = split(str),
    len = segs.length,
    l;
  var fn = isMatch.bind(isMatch, segs);

  for (; i < all.length; i++) {
    tmp = all[i];
    if (
      (l = tmp.length) === len ||
      (l < len && tmp[l - 1].type === ATYPE) ||
      (l > len && tmp[l - 1].type === OTYPE)
    ) {
      if (every(tmp, fn)) return tmp;
    }
  }

  return [];
}

function parseRoutes(str) {
  if (str === SEP) {
    return [{ old: str, type: STYPE, val: str, end: "" }];
  }

  var c,
    x,
    t,
    sfx,
    nxt = strip(str),
    i = -1,
    j = 0,
    len = nxt.length,
    out = [];

  while (++i < len) {
    c = nxt.charCodeAt(i);

    if (c === COLON) {
      j = i + 1; // begining of param
      t = PTYPE; // set type
      x = 0; // reset mark
      sfx = "";

      while (i < len && nxt.charCodeAt(i) !== SLASH) {
        c = nxt.charCodeAt(i);
        if (c === QMARK) {
          x = i;
          t = OTYPE;
        } else if (c === 46 && sfx.length === 0) {
          sfx = nxt.substring((x = i));
        }
        i++; // move on
      }

      out.push({
        old: str,
        type: t,
        val: nxt.substring(j, x || i),
        end: sfx
      });

      // shorten string & update pointers
      nxt = nxt.substring(i);
      len -= i;
      i = 0;

      continue; // loop
    } else if (c === ASTER) {
      out.push({
        old: str,
        type: ATYPE,
        val: nxt.substring(i),
        end: ""
      });
      continue; // loop
    } else {
      j = i;
      while (i < len && nxt.charCodeAt(i) !== SLASH) {
        ++i; // skip to next slash
      }
      out.push({
        old: str,
        type: STYPE,
        val: nxt.substring(j, i),
        end: ""
      });
      // shorten string & update pointers
      nxt = nxt.substring(i);
      len -= i;
      i = j = 0;
    }
  }

  return out;
}

function exec(str, arr) {
  var i = 0,
    x,
    y,
    segs = split(str),
    out = {};
  for (; i < arr.length; i++) {
    x = segs[i];
    y = arr[i];
    if (x === SEP) continue;
    if (x !== void 0 && y.type | (2 === OTYPE)) {
      out[y.val] = x.replace(y.end, "");
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*                                   trouter                                  */
/* -------------------------------------------------------------------------- */

class Trouter {
  constructor(opts) {
    this.opts = opts || {};
    this.routes = {};
    this.handlers = {};

    this.all = this.add.bind(this, "*");
    this.get = this.add.bind(this, "GET");
    this.head = this.add.bind(this, "HEAD");
    this.patch = this.add.bind(this, "PATCH");
    this.options = this.add.bind(this, "OPTIONS");
    this.connect = this.add.bind(this, "CONNECT");
    this.delete = this.add.bind(this, "DELETE");
    this.trace = this.add.bind(this, "TRACE");
    this.post = this.add.bind(this, "POST");
    this.put = this.add.bind(this, "PUT");
  }

  add(method, pattern, ...fns) {
    // Save decoded pattern info
    if (this.routes[method] === void 0) this.routes[method] = [];
    this.routes[method].push(parseRoutes(pattern));
    // Save route handler(s)
    if (this.handlers[method] === void 0) this.handlers[method] = {};
    this.handlers[method][pattern] = fns;
    // Allow chainable
    return this;
  }

  find(method, url) {
    let arr = match(url, this.routes[method] || []);
    if (arr.length === 0) {
      arr = match(url, this.routes[(method = "*")] || []);
      if (!arr.length) return false;
    }
    return {
      params: exec(url, arr),
      handlers: this.handlers[method][arr[0].old]
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                                 @polka/url                                 */
/* -------------------------------------------------------------------------- */

function parser(req) {
  let url = req.url;
  if (url === void 0) return url;

  let obj = req._parsedUrl;
  if (obj && obj._raw === url) return obj;

  obj = {};
  obj.query = obj.search = null;
  obj.href = obj.path = obj.pathname = url;

  let idx = url.indexOf("?", 1);
  if (idx !== -1) {
    obj.search = url.substring(idx);
    obj.query = obj.search.substring(1);
    obj.pathname = url.substring(0, idx);
  }

  obj._raw = url;

  return (req._parsedUrl = obj);
}

function toAssume(uri, extns) {
  let i = 0,
    x,
    len = uri.length - 1;
  if (uri.charCodeAt(len) === 47) {
    uri = uri.substring(0, len);
  }

  let arr = [],
    tmp = `${uri}/index`;
  for (; i < extns.length; i++) {
    x = "." + extns[i];
    if (uri) arr.push(uri + x);
    arr.push(tmp + x);
  }

  return arr;
}

function find(uri, extns) {
  let i = 0,
    data,
    arr = toAssume(uri, extns);
  for (; i < arr.length; i++) {
    if ((data = FILES[arr[i]])) return data;
  }
}

function is404(req, res) {
  return (res.statusCode = 404), res.end();
}

function list(dir, fn, pre = "") {
  let i = 0,
    abs,
    stats;
  let arr = fs.readdirSync(dir);
  for (; i < arr.length; i++) {
    abs = join(dir, arr[i]);
    stats = fs.statSync(abs);
    stats.isDirectory()
      ? list(abs, fn, join(pre, arr[i]))
      : fn(join(pre, arr[i]), abs, stats);
  }
}

function send(req, res, file, stats, headers = {}) {
  let code = 200,
    opts = {};

  if (req.headers.range) {
    code = 206;
    let [x, y] = req.headers.range.replace("bytes=", "").split("-");
    let end = (opts.end = parseInt(y, 10) || stats.size - 1);
    let start = (opts.start = parseInt(x, 10) || 0);

    if (start >= stats.size || end >= stats.size) {
      res.setHeader("Content-Range", `bytes */${stats.size}`);
      res.statusCode = 416;
      return res.end();
    }

    headers["Content-Range"] = `bytes ${start}-${end}/${stats.size}`;
    headers["Content-Length"] = end - start + 1;
    headers["Accept-Ranges"] = "bytes";
  }

  res.writeHead(code, headers);
  fs.createReadStream(file, opts).pipe(res);
}

/* -------------------------------------------------------------------------- */
/*                                    sirv                                    */
/* -------------------------------------------------------------------------- */

function sirv(dir, opts = {}) {
  dir = resolve(dir || ".");

  let isNotFound = opts.onNoMatch || is404;
  let extensions = opts.extensions || ["html", "htm"];
  let setHeaders = opts.setHeaders || noop;

  if (opts.dev) {
    return function (req, res, next) {
      let stats,
        file,
        uri = decodeURIComponent(
          req.path || req.pathname || parser(req).pathname
        );
      let arr = [uri]
        .concat(toAssume(uri, extensions))
        .map(x => join(dir, x))
        .filter(fs.existsSync);
      while ((file = arr.shift())) {
        stats = fs.statSync(file);
        if (stats.isDirectory()) continue;
        setHeaders(res, uri, stats);
        return send(req, res, file, stats, {
          "Content-Type": mime.getType(file),
          "Last-Modified": stats.mtime.toUTCString(),
          "Content-Length": stats.size
        });
      }
      return next ? next() : isNotFound(req, res);
    };
  }

  let cc = opts.maxAge != null && `public,max-age=${opts.maxAge}`;
  if (cc && opts.immutable) cc += ",immutable";

  list(dir, (name, abs, stats) => {
    if (!opts.dotfiles && name.charAt(0) === ".") {
      return;
    }

    let headers = {
      "Content-Length": stats.size,
      "Content-Type": mime.getType(name),
      "Last-Modified": stats.mtime.toUTCString()
    };

    if (cc) headers["Cache-Control"] = cc;
    if (opts.etag)
      headers["ETag"] = `W/"${stats.size}-${stats.mtime.getTime()}"`;

    FILES["/" + name.replace(/\\+/g, "/")] = { abs, stats, headers };
  });

  return function (req, res, next) {
    let pathname = decodeURIComponent(
      req.path || req.pathname || parser(req).pathname
    );
    let data = FILES[pathname] || find(pathname, extensions);
    if (!data) return next ? next() : isNotFound(req, res);

    setHeaders(res, pathname, data.stats);
    send(req, res, data.abs, data.stats, data.headers);
  };
}

function lead(x) {
  return x.charCodeAt(0) === 47 ? x : "/" + x;
}

function value(x) {
  let y = x.indexOf("/", 1);
  return y > 1 ? x.substring(0, y) : x;
}

function mutate(str, req) {
  req.url = req.url.substring(str.length) || "/";
  req.path = req.path.substring(str.length) || "/";
}

function onError(err, req, res, next) {
  let code = (res.statusCode = err.code || err.status || 500);
  res.end((err.length && err) || err.message || http.STATUS_CODES[code]);
}

/* -------------------------------------------------------------------------- */
/*                                    polka                                   */
/* -------------------------------------------------------------------------- */

class Polka extends Trouter {
  constructor(opts = {}) {
    super(opts);
    this.apps = {};
    this.wares = [];
    this.bwares = {};
    this.parse = parser;
    this.server = opts.server;
    this.handler = this.handler.bind(this);
    this.onError = opts.onError || onError; // catch-all handler
    this.onNoMatch = opts.onNoMatch || this.onError.bind(null, { code: 404 });
  }

  add(method, pattern, ...fns) {
    let base = lead(value(pattern));
    if (this.apps[base] !== void 0)
      throw new Error(
        `Cannot mount ".${method.toLowerCase()}('${lead(
          pattern
        )}')" because a Polka application at ".use('${base}')" already exists! You should move this handler into your Polka application instead.`
      );
    return super.add(method, pattern, ...fns);
  }

  use(base, ...fns) {
    if (typeof base === "function") {
      this.wares = this.wares.concat(base, fns);
    } else if (base === "/") {
      this.wares = this.wares.concat(fns);
    } else {
      base = lead(base);
      fns.forEach(fn => {
        if (fn instanceof Polka) {
          this.apps[base] = fn;
        } else {
          let arr = this.bwares[base] || [];
          arr.length > 0 || arr.push((r, _, nxt) => (mutate(base, r), nxt()));
          this.bwares[base] = arr.concat(fn);
        }
      });
    }
    return this; // chainable
  }

  listen() {
    (this.server = this.server || http.createServer()).on(
      "request",
      this.handler
    );
    this.server.listen.apply(this.server, arguments);
    return this;
  }

  handler(req, res, info) {
    info = info || this.parse(req);
    let fns = [],
      arr = this.wares,
      obj = this.find(req.method, info.pathname);
    req.originalUrl = req.originalUrl || req.url;
    let base = value((req.path = info.pathname));
    if (this.bwares[base] !== void 0) {
      arr = arr.concat(this.bwares[base]);
    }
    if (obj) {
      fns = obj.handlers;
      req.params = obj.params;
    } else if (this.apps[base] !== void 0) {
      mutate(base, req);
      info.pathname = req.path; //=> updates
      fns.push(this.apps[base].handler.bind(null, req, res, info));
    } else if (fns.length === 0) {
      fns.push(this.onNoMatch);
    }
    // Grab addl values from `info`
    req.search = info.search;
    req.query = parse(info.query);
    // Exit if only a single function
    let i = 0,
      len = arr.length,
      num = fns.length;
    if (len === i && num === 1) return fns[0](req, res);
    // Otherwise loop thru all middlware
    let next = err => (err ? this.onError(err, req, res, next) : loop());
    let loop = _ => res.finished || (i < len && arr[i++](req, res, next));
    arr = arr.concat(fns);
    len += num;
    loop(); // init
  }
}

const polka = opts => new Polka(opts);

module.exports = {
  sirv,
  polka
};
