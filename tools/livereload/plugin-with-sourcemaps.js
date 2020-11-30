//@ts-check

//"source-map": "0.6.1",
//"convert-source-map": "1.7.0",

var convertSourceMaps = require('convert-source-map')
var { readFileSync } = require("fs")
var https = require('https')
//var _ = require("lodash")
var sourceMap = require('source-map');
var path = require("path");
const { Server } = require("./ws");
var through = require("through2");
const { createHash } = require("crypto");


const colors = {
  reset: "\x1b[0m",
  underline: "\x1b[4m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  crimson: "\x1b[38m",
};

const clc = {
  green: (v) => colors.green + `${v}` + colors.reset,
  cyan: (v) => colors.cyan + `${v}` + colors.reset,
  yellow: (v) => colors.yellow + `${v}` + colors.reset,
};

function log(msg, ...data) {
  // const t = /T([0-9:.]+)Z/g.exec(new Date().toISOString())[1];
  // console.log(clc.green(`[${t}] ReactHMR`), "::", clc.cyan(msg));
  console.log(clc.green(`[LiveReloadPlugin]:`), clc.cyan(msg));
  data.forEach((d) => console.log(clc.yellow("  >"), clc.yellow(d)));
}

function logError(error) {
  if (error) {
    log(error)
  }
}

function startServer({port, sslKey, sslCert}) {
  if ((sslCert && !sslKey) || (!sslCert && sslKey)) {
    throw new Error('You need both a certificate AND key in order to use SSL');
  }

  let wss;
  if (sslCert && sslKey) {
    const key = readFileSync(sslKey, 'utf8');
    const cert = readFileSync(sslCert, 'utf8');
    const credentials = {key, cert};
    const server = https.createServer(credentials);
    server.listen(port);
    wss = new Server({server});
  } else {
    wss = new Server({port});
  }


  log("Reload server up and listening in port " + port + "...")

  const server = {
    notifyReload(metadata) {
      if (wss.clients.length) {
        log("Notify clients about bundle change...")
      }
      wss.clients.forEach(client => {
        client.send(JSON.stringify({
          type: "change",
          data: metadata
        }), logError)
      })
    },
    notifyBundleError(error) {
      if (wss.clients.length) {
        log("Notify clients about bundle error...")
      }
      wss.clients.forEach(client => {
        client.send(JSON.stringify({
          type: "bundle_error",
          data: { error: error.toString() }
        }), logError)
      })
    }
  }

  wss.on("connection", client => {
    log("New client connected")
  })

  return server
}



function LiveReactloadPlugin(b, opts = {}) {
  const {
    port = 4474,
    host = null,
    babel = true,
    client = true,
    dedupe = true,
    debug = false,
    basedir = process.cwd(),
    'ssl-cert': sslCert = null,
    'ssl-key': sslKey = null,
    } = opts

  // server is alive as long as watchify is running
  const server = opts.server !== false ? startServer({port: Number(port), sslCert, sslKey}) : null

  let clientRequires = [];
  try {
    const RHLPatchModule = 'react-hot-loader/patch';
    require.resolve(RHLPatchModule)
    clientRequires.push(RHLPatchModule)
  } catch (e) {}

  const clientOpts = {
    // assuming that livereload package is in global mdule directory (node_modules)
    // and this file is in ./lib/babel-plugin folder
    //nodeModulesRoot: resolve(__dirname, "../../.."),
    nodeModulesRoot: path.resolve(process.cwd(), "node_modules"),
    port: Number(port),
    host: host,
    clientEnabled: client,
    debug: debug,
    babel: babel,
    clientRequires: clientRequires
  }

  clientRequires.forEach(file => b.require(file, opts))

  b.on("reset", addHooks)
  addHooks()

  function addHooks() {
    // this cache object is preserved over single bundling
    // pipeline so when next bundling occurs, this cache
    // object is thrown away
    const mappings = {}, pathById = {}, pathByIdx = {}
    const entries = []
    let standalone = null

    const idToPath = id =>
      pathById[id] || (isString(id) && id) || throws("Full path not found for id: " + id)

    const idxToPath = idx =>
      pathByIdx[idx] || (isString(idx) && idx) || throws("Full path not found for index: " + idx)

    if (server) {
      b.pipeline.on("error", server.notifyBundleError)
    }

    b.pipeline.get("record").push(through.obj(
      function transform(row, enc, next) {
        // const s = _.get(row, "options._flags.standalone")
        // if (s) {
        //   standalone = s
        // }
        next(null, row)
      }
    ))

    b.pipeline.get("sort").push(through.obj(
      function transform(row, enc, next) {
        const {id, index, file} = row
        pathById[id] = file
        pathByIdx[index] = file
        next(null, row)
      }
    ))

    if (!dedupe) {
      b.pipeline.splice("dedupe", 1, through.obj())
      if (b.pipeline.get("dedupe")) {
        log("Other plugins have added de-duplicate transformations. --no-dedupe is not effective")
      }
    } else {
      b.pipeline.splice("dedupe", 0, through.obj(
        function transform(row, enc, next) {
          const cloned = Object.assign({}, row)
          if (row.dedupeIndex) {
            cloned.dedupeIndex = idxToPath(row.dedupeIndex)
          }
          if (row.dedupe) {
            cloned.dedupe = idToPath(row.dedupe)
          }
          next(null, cloned)
        }
      ))
    }

    b.pipeline.get("label").push(through.obj(
      function transform(row, enc, next) {
        const {id, file, source, deps, entry} = row
        const converter = convertSourceMaps.fromSource(source)
        let sourceWithoutMaps = source
        let adjustedSourcemap = ''
        let hash;

        if (converter) {
          const sources = converter.getProperty("sources") || [];
          sourceWithoutMaps = convertSourceMaps.removeComments(source)
          hash = getHash(sourceWithoutMaps)
          converter.setProperty("sources", sources.map(source => source += "?version=" + hash))
          adjustedSourcemap = convertSourceMaps.fromObject(offsetLines(converter.toObject(), 1)).toComment()
        } else {
          hash = getHash(source)
        }

        if (entry) {
          entries.push(file)
        }
        mappings[file] = [sourceWithoutMaps, deps, {id: file, hash: hash, browserifyId: id, sourcemap: adjustedSourcemap}]
        next(null, row)
      },
      function flush(next) {
        next()
      }
    ))

    b.pipeline.get("wrap").push(
      through.obj(
        (row, enc, next) => {
          next(null);
        },
        function flush(next) {
          //@ts-ignore - absurd sry
          const pathById = Object.fromEntries(
            Object.entries(
              mappings
            ).map(([file, [s, d, { browserifyId: id }]]) => [id, file])
          );
          const idToPath = (id) => pathById[id] || String(id);
          const depsToPaths = (deps) => {
            let obj = {};
            for (let [k, v] of Object.entries(deps)) {
              obj[k] = idToPath(v);
            }
            return obj;
          };
          const withFixedDepsIds = mapValues(mappings, ([src, deps, meta]) => {
            return [src, depsToPaths(deps), meta];
          });
          const args = [withFixedDepsIds, entries, clientOpts];
          
          let bundleSrc = `(${loader.toString()})(${args
            .map((a) => JSON.stringify(a, null, 2))
            .join(", ")});`;

          this.push(Buffer.from(bundleSrc, "utf8"));
          server.notifyReload(withFixedDepsIds);
          next();
        }
      )
    )

    // b.pipeline.get("wrap").push(through.obj(
    //   function transform(row, enc, next) {
    //     next(null)
    //   },
    //   function flush(next) {
    //     const pathById = _.fromPairs(_.toPairs(mappings).map(([file, [s, d, {browserifyId: id}]]) => [id, file]))
    //     const idToPath = id =>
    //       pathById[id] || (_.isString(id) && id)

    //     const depsToPaths = deps =>
    //       _.reduce(deps, (m, v, k) => {
    //         let id = idToPath(v);
    //         if (id) {
    //           m[k] = id;
    //         }
    //         return m;
    //       }, {})

    //       //@ts-ignore
    //     const withFixedDepsIds = _.mapValues(mappings, ([src, deps, meta]) => [
    //       src,
    //       depsToPaths(deps),
    //       meta
    //     ])
    //     const args = [
    //       withFixedDepsIds,
    //       entries,
    //       clientOpts
    //     ]
    //     let bundleSrc =
    //       `(${loader.toString()})(${args.map(a => JSON.stringify(a, null, 2)).join(", ")});`

    //     // if (standalone) {
    //     //   bundleSrc = umd(standalone, `return ${bundleSrc}`)
    //     // }

    //     this.push(new Buffer(bundleSrc, "utf8"))
    //     if (server) {
    //       server.notifyReload(withFixedDepsIds)
    //     }
    //     next()
    //   }
    // ))

  }

  function throws(msg) {
    throw new Error(msg)
  }

  function getHash(str) {
    return createHash("sha1").update(str).digest("hex");
  }

  
}


/*eslint semi: "error"*/

/**
 * This is modified version of Browserify's original module loader function,
 * made to support LiveReactLoad's reloading functionality.
 *
 *
 * @param mappings
 *    An object containing modules and their metadata, created by
 *    LiveReactLoad plugin. The structure of the mappings object is:
 *    {
 *      [module_id]: [
 *        "...module_source...",
 *        {
 *          "module": target_id,
 *          "./another/module": target_id,
 *          ...
 *        },
 *        {
 *          hash: "32bit_hash_from_source",
 *          isEntry: true|false
 *        }
 *      ],
 *      ...
 *    }
 *
 * @param entryPoints
 *    List of bundle's entry point ids. At the moment, only one entry point
 *    is supported by LiveReactLoad
 * @param options
 *    LiveReactLoad options passed = require(the CLI/plugin params
 */
function loader(mappings, entryPoints, options) {

  if (entryPoints.length > 1) {
    throw new Error(
      "LiveReactLoad supports only one entry point at the moment"
    )
  }

  var entryId = entryPoints[0];

  var scope = {
    mappings: mappings,
    cache: {},
    reloadHooks: {}
  };


  function startClient() {
    if (!options.clientEnabled) {
      return;
    }
    if (typeof window.WebSocket === "undefined") {
      warn("WebSocket API not available, reloading is disabled");
      return;
    }
    var protocol = window.location.protocol === "https:" ? "wss" : "ws";
    var url = protocol + "://" + (options.host || window.location.hostname);
    if (options.port != 80) {
      url = url + ":" + options.port;
    }
    var ws = new WebSocket(url);
    ws.onopen = function () {
      info("WebSocket client listening for changes...");
    };
    ws.onmessage = function (m) {
      var msg = JSON.parse(m.data);
      if (msg.type === "change") {
        handleBundleChange(msg.data);
      } else if (msg.type === "bundle_error") {
        handleBundleError(msg.data);
      }
    }
  }

  function compile(mapping) {
    var body = mapping[0];
    if (typeof body !== "function") {
      debug("Compiling module", mapping[2])
      var compiled = compileModule(body, mapping[2].sourcemap);
      mapping[0] = compiled;
      mapping[2].source = body;
    }
  }

  function compileModule(source, sourcemap) {
    var toModule = new Function(
      "__livereactload_source", "__livereactload_sourcemap",
      "return eval('function __livereactload_module(require, module, exports){\\n' + __livereactload_source + '\\n}; __livereactload_module;' + (__livereactload_sourcemap || ''));"
    );
    return toModule(source, sourcemap)
  }

  function unknownUseCase() {
    throw new Error(
      "Unknown use-case encountered! Please raise an issue: " +
      "https://github.com/milankinen/livereactload/issues"
    )
  }

  // returns loaded module = require(cache or if not found, then
  // loads it = require(the source and caches it
  function load(id, recur) {
    var mappings = scope.mappings;
    var cache = scope.cache;

    if (!cache[id]) {
      if (!mappings[id]) {
        var req = typeof require == "function" && require;
        if (req) return req(id);
        var error = new Error("Cannot find module '" + id + "'");
        //@ts-ignore
        error.code = "MODULE_NOT_FOUND";
        throw error;
      }

      var module = cache[id] = {
        exports: {},
        hot: {
          onUpdate: function (maybe, hook) {
            var realHook = hook;
            if (!realHook) {
              realHook = maybe;
            } else {
              console.warn("LiveReactload: You are providing two arguments to the module.hot.onUpdate hook, and we are" +
                "ignoring the first argument. You may have copied and pasted a webpack hook. For compatibility, we are" +
                "accepting this, and it will probably work, but please remove the first argument to avoid confusion.")
            }
            scope.reloadHooks[id] = realHook;
          }
        }
      };

      mappings[id][0].call(module.exports, function require(path) {
        var targetId = mappings[id][1][path];
        return load(targetId ? targetId : path);
      }, module, module.exports, unknownUseCase, mappings, cache, entryPoints);

    }
    return cache[id].exports;
  }

  /**
   * Patches the existing modules with new sources and returns a list of changes
   * (module id and old mapping. ATTENTION: This function does not do any reloading yet.
   *
   * @param mappings
   *    New mappings
   * @returns {Array}
   *    List of changes
   */
  function patch(mappings) {
    var changes = [];

    keys(mappings).forEach(function (id) {
      var old = scope.mappings[id];
      var mapping = mappings[id];
      var meta = mapping[2];
      if (!old || old[2].hash !== meta.hash) {
        compile(mapping);
        scope.mappings[id] = mapping;
        changes.push([id, old]);
      }
    });
    return changes;
  }

  /**
   * Reloads modules based on the given changes. If reloading fails, this function
   * tries to restore old implementation.
   *
   * @param changes
   *    Changes array received = require("patch" function
   */
  function reload(changes) {
    var changedModules = changes.map(function (c) {
      return c[0];
    });
    var newMods = changes.filter(function (c) {
      return !c[1];
    }).map(function (c) {
      return c[0];
    });

    try {
      info("Applying changes...");
      debug("Changed modules", changedModules);
      debug("New modules", newMods);
      evaluate(entryId, {});
      info("Reload complete!");
    } catch (e) {
      error("Error occurred while reloading changes. Restoring old implementation...");
      console.error(e);
      console.error(e.stack);
      try {
        restore();
        evaluate(entryId, {});
        info("Restored!");
      } catch (re) {
        error("Restore failed. You may need to refresh your browser... :-/");
        console.error(re);
        console.error(re.stack);
      }
    }


    function evaluate(id, changeCache) {
      if (id in changeCache) {
        debug("Circular dependency detected for module", id, "not traversing any further...");
        return changeCache[id];
      }
      if (isExternalModule(id)) {
        debug("Module", id, "is an external module. Do not reload");
        return false;
      }

      // initially mark change status to follow module's change status
      // TODO: how to propagate change status = require(children to this without causing infinite recursion?
      var meChanged = contains(changedModules, id);
      changeCache[id] = meChanged;

      var originalCache = scope.cache[id];
      if (id in scope.cache) {
        delete scope.cache[id];
      }

      var deps = vals(scope.mappings[id][1]).filter(isLocalModule);
      var depsChanged = deps.map(function (dep) {
        return evaluate(dep, changeCache);
      });

      // In the case of circular dependencies, the module evaluation stops because of the
      // changeCache check above. Also module cache should be clear. However, if some circular
      // dependency (or its descendant) gets reloaded, it (re)loads new version of this
      // module back to cache. That's why we need to ensure that we're not
      //    1) reloading module twice (so that we don't break cross-refs)
      //    2) reload any new version if there is no need for reloading
      //
      // Hence the complex "scope.cache" stuff...
      //
      var isReloaded = originalCache !== undefined && id in scope.cache;
      var depChanged = any(depsChanged);

      if (isReloaded || depChanged || meChanged) {
        debug("Module changed", id, isReloaded, depChanged, meChanged);
        if (!isReloaded) {
          var hook = scope.reloadHooks[id];
          if (typeof hook === "function" && hook()) {
            console.log(" > Manually accepted", id);
            scope.cache[id] = originalCache;
            changeCache[id] = false;
          } else {
            var msg = contains(newMods, id) ? " > Add new module   ::" : " > Reload module    ::";
            console.log(msg, id);
            load(id);
            changeCache[id] = true;
          }
        } else {
          console.log(" > Already reloaded ::", id);
        }

        return changeCache[id];
      } else {
        // restore old version of the module
        if (originalCache !== undefined) {
          scope.cache[id] = originalCache;
        }
        return false;
      }
    }

    function restore() {
      changes.forEach(function (c) {
        var id = c[0], mapping = c[1];
        if (mapping) {
          debug("Restore old mapping", id);
          scope.mappings[id] = mapping;
        } else {
          debug("Delete new mapping", id);
          delete scope.mappings[id];
        }
      })
    }
  }

  function handleBundleChange(newMappings) {
    info("Bundle changed");
    var changes = patch(newMappings);
    if (changes.length > 0) {
      reload(changes);
    } else {
      info("Nothing to reload");
    }
  }

  function handleBundleError(data) {
    error("Bundling error occurred");
    error(data.error);
  }


  // prepare mappings before starting the app
  forEachValue(scope.mappings, compile);

  debug("Options:", options);
  debug("Entries:", entryPoints, entryId);

  startClient();

  if (options.clientRequires && options.clientRequires.length) {
    options.clientRequires.forEach(load);
  }
  // standalone bundles may need the exports = require(entry module
  return load(entryId);

  function isLocalModule(id) {
    return id.indexOf(options.nodeModulesRoot) === -1
  }

  function isExternalModule(id) {
    return !(id in scope.mappings);
  }

  function keys(obj) {
    return obj ? Object.keys(obj) : [];
  }

  function vals(obj) {
    return keys(obj).map(function (key) {
      return obj[key];
    });
  }

  function contains(col, val) {
    for (var i = 0; i < col.length; i++) {
      if (col[i] === val) return true;
    }
    return false;
  }

  function all(col, f) {
    if (!f) {
      f = function (x) {
        return x;
      };
    }
    for (var i = 0; i < col.length; i++) {
      if (!f(col[i])) return false;
    }
    return true;
  }

  function any(col, f) {
    if (!f) {
      f = function (x) {
        return x;
      };
    }
    for (var i = 0; i < col.length; i++) {
      if (f(col[i])) return true;
    }
    return false;
  }

  function forEachValue(obj, fn) {
    keys(obj).forEach(function (key) {
      if (obj.hasOwnProperty(key)) {
        fn(obj[key]);
      }
    });
  }

  function debug() {
    if (options.debug) {
      console.log.apply(console, ["LiveReactload [DEBUG] ::"].concat(Array.prototype.slice.call(arguments)));
    }
  }

  function info(msg) {
    console.info("LiveReactload ::", msg);
  }

  function warn(msg) {
    console.warn("LiveReactload ::", msg);
  }

  function error(msg) {
    console.error("LiveReactload ::", msg);
  }
}



module.exports = LiveReactloadPlugin


//https://github.com/twada/offset-sourcemap-lines/blob/master/index.js
function offsetLines (incomingSourceMap, lineOffset) {
  var consumer = new sourceMap.SourceMapConsumer(incomingSourceMap);
  var generator = new sourceMap.SourceMapGenerator({
      file: incomingSourceMap.file,
      sourceRoot: incomingSourceMap.sourceRoot
  });
  consumer.eachMapping(function (m) {
      // skip invalid (not-connected) mapping
      // refs: https://github.com/mozilla/source-map/blob/182f4459415de309667845af2b05716fcf9c59ad/lib/source-map-generator.js#L268-L275
      if (typeof m.originalLine === 'number' && 0 < m.originalLine &&
          typeof m.originalColumn === 'number' && 0 <= m.originalColumn &&
          m.source) {
          generator.addMapping({
              source: m.source,
              name: m.name,
              original: { line: m.originalLine, column: m.originalColumn },
              generated: { line: m.generatedLine + lineOffset, column: m.generatedColumn }
          });
      }
  });
  var outgoingSourceMap = JSON.parse(generator.toString());
  if (typeof incomingSourceMap.sourcesContent !== 'undefined') {
      outgoingSourceMap.sourcesContent = incomingSourceMap.sourcesContent;
  }
  return outgoingSourceMap;
};

function mapValues(object, iteratee) {
  var result = {};
  Object.entries(object).forEach(([key, value]) => {
    return (result[key] = iteratee(value, key, object));
  });
  return result;
}

function isString(v) {
  return v === typeof "string"
}