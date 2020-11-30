// import fs from 'fs'
// import path from 'path'
// import through from 'through2'

var fs = require("fs");
var path = require("path");
var through = require("through2");

//https://github.com/fitzgen/glob-to-regexp/blob/master/index.js

/** 
 * @type {(glob: string, opts: Partial<{
    extended: boolean
    globstar: boolean
    flags: string
  }>) => RegExp}
 */
function GlobToRegExp(glob, opts) {
  if (typeof glob !== "string") {
    throw new TypeError("Expected a string");
  }
  var str = String(glob);
  var reStr = "";
  var extended = opts ? !!opts.extended : false;
  var globstar = opts ? !!opts.globstar : false;
  var inGroup = false;
  var flags = opts && typeof opts.flags === "string" ? opts.flags : "";

  /** @type {string} */
  var c;

  for (var i = 0, len = str.length; i < len; i++) {
    c = str[i];

    switch (c) {
      case "/":
      case "$":
      case "^":
      case "+":
      case ".":
      case "(":
      case ")":
      case "=":
      case "!":
      case "|":
        reStr += "\\" + c;
        break;

      case "?":
        if (extended) {
          reStr += ".";
          break;
        }

      case "[":
      case "]":
        if (extended) {
          reStr += c;
          break;
        }

      case "{":
        if (extended) {
          inGroup = true;
          reStr += "(";
          break;
        }

      case "}":
        if (extended) {
          inGroup = false;
          reStr += ")";
          break;
        }

      case ",":
        if (inGroup) {
          reStr += "|";
          break;
        }
        reStr += "\\" + c;
        break;

      case "*":
        var prevChar = str[i - 1];
        var starCount = 1;
        while (str[i + 1] === "*") {
          starCount++;
          i++;
        }
        var nextChar = str[i + 1];

        if (!globstar) {
          reStr += ".*";
        } else {
          var isGlobstar =
            starCount > 1 &&
            (prevChar === "/" || prevChar === undefined) &&
            (nextChar === "/" || nextChar === undefined);

          if (isGlobstar) {
            reStr += "((?:[^/]*(?:/|$))*)";
            i++;
          } else {
            reStr += "([^/]*)";
          }
        }
        break;

      default:
        reStr += c;
    }
  }

  if (!flags || !~flags.indexOf("g")) {
    reStr = "^" + reStr + "$";
  }

  return new RegExp(reStr, flags);
}


/**
 * @type {(testGlob: string, actualFilepath: string) => ReturnType<typeof GloobToRegExp>}
 */
const anymatch = (testGlob, actualFilepath) => {
  return GlobToRegExp(testGlob).test(actualFilepath);
};

function watchify(b, opts) {
  if (!opts) opts = {};
  var cache = b._options.cache;
  var pkgcache = b._options.packageCache;
  var delay = typeof opts.delay === "number" ? opts.delay : 100;
  var changingDeps = {};
  var pending = false;
  var updating = false;

  // unused atm, was a chokadir option, fs method also has this param b
  var wopts = {
    persistent: true,
  };

  var ignored = opts.ignoreWatch || "node_modules";

  if (cache) {
    b.on("reset", collect);
    collect();
  }
  function collect() {
    b.pipeline.get("deps").push(
      through.obj(function (row, enc, next) {
        var file = row.expose ? b._expose[row.id] : row.file;
        cache[file] = {
          source: row.source,
          deps: Object.assign({}, row.deps),
        };
        this.push(row);
        next();
      })
    );
  }

  b.on("file", function (file) {
    watchFile(file);
  });

  b.on("package", function (pkg) {
    var file = path.join(pkg.__dirname, "package.json");
    watchFile(file);
    if (pkgcache) pkgcache[file] = pkg;
  });

  b.on("reset", reset);
  reset();

  function reset() {
    var time = null;
    var bytes = 0;
    b.pipeline.get("record").on("end", function () {
      time = Date.now();
    });

    b.pipeline.get("wrap").push(through(write, end));
    function write(buf, enc, next) {
      bytes += buf.length;
      this.push(buf);
      next();
    }
    function end() {
      var delta = Date.now() - time;
      b.emit("time", delta);
      b.emit("bytes", bytes);
      b.emit(
        "log",
        bytes + " bytes written (" + (delta / 1000).toFixed(2) + " seconds)"
      );
      this.push(null);
    }
  }

  var fwatchers = {};
  var fwatcherFiles = {};
  var ignoredFiles = {};

  b.on("transform", function (tr, mfile) {
    tr.on("file", function (dep) {
      watchFile(mfile, dep);
    });
  });
  
  b.on("bundle", function (bundle) {
    updating = true;
    bundle.on("error", onend);
    bundle.on("end", onend);
    function onend() {
      updating = false;
    }
  });

  function watchFile(file, dep) {
    dep = dep || file;

    if (ignored) {
      if (!ignoredFiles.hasOwnProperty(file)) {
        ignoredFiles[file] = anymatch(ignored, file);
        //anymatch(ignored, file);
      }
      if (ignoredFiles[file]) return;
    }

    if (!fwatchers[file]) fwatchers[file] = [];
    if (!fwatcherFiles[file]) fwatcherFiles[file] = [];
    if (fwatcherFiles[file].indexOf(dep) >= 0) return;

    //idk how to quantify this , but adding a watcher for every dep instead of just letting the fs module do its thing seems dumb af
    //fun fact, the node docs mentioned experimental support for fs watch on urls, can finally use a socket as a virtual fs with watch support!
    //will try out later with vinyl ws server, there's some rollup plugin that does something similar to my vinyl hacks

    var w = b._watcher(dep, wopts);
    //var w = fs.watch(path.join(process.cwd(), "src"), { recursive: true });

    w.setMaxListeners(0);
    w.on("error", b.emit.bind(b, "error"));
    w.on("change", function () {
      invalidate(file);
    });
    fwatchers[file].push(w);
    fwatcherFiles[file].push(dep);
  }

  function invalidate(id) {
    if (cache) delete cache[id];
    if (pkgcache) delete pkgcache[id];
    changingDeps[id] = true;

    if (!updating && fwatchers[id]) {
      fwatchers[id].forEach(function (w) {
        w.close();
      });
      delete fwatchers[id];
      delete fwatcherFiles[id];
    }

    // wait for the disk/editor to quiet down first:
    // @ts-ignore
    if (pending) clearTimeout(pending);
    // @ts-ignore
    pending = setTimeout(notify, delay);
  }

  function notify() {
    if (updating) {
      // @ts-ignore
      pending = setTimeout(notify, delay);
    } else {
      pending = false;
      b.emit("update", Object.keys(changingDeps));
      changingDeps = {};
    }
  }

  b.close = () => {
    Object.keys(fwatchers).forEach((id) => {
      fwatchers[id].forEach((w) => {
        w.close();
      });
    });
  };

  b._watcher = (file, opts) => fs.watch(file, opts);

  return b;
}

watchify.args = {
  cache: {},
  packageCache: {},
};

module.exports = watchify;

//export default watchify
//export { watchify }
