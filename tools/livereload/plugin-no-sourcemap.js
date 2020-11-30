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
    log(error);
  }
}

function startServer({ port }) {
  var wss = new Server({ port });
  log(`[HMR]:Listening@port:${port}`);
  const server = {
    notifyReload(metadata) {
      log("Notify clients about bundle change");
      wss.clients.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "change",
            data: metadata,
          }),
          logError
        );
      });
    },
    notifyBundleError(error) {
      log("Notify clients about bundle error");
      wss.clients.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "bundle_error",
            data: { error: error.toString() },
          }),
          logError
        );
      });
    },
  };
  wss.on("connection", (client) => {
    log("New client connected");
  });
  return server;
}


function LiveReloadPlugin(b, opts = {}) {
  const { port = 4474, host = null, runtimeDependencies = [] } = opts;
  const server = startServer({ port: Number(port) });
  const clientOpts = {
    nodeModulesRoot: path.resolve(process.cwd(), "node_modules"),
    port: Number(port),
    host: host,
    runtimeDependencies: runtimeDependencies,
  };
  runtimeDependencies.forEach((file) => b.require(file));
  b.on("reset", addHooks);
  addHooks();
  function addHooks() {
    var mappings = {};
    var entries = [];
    b.pipeline.on("error", server.notifyBundleError);
    b.pipeline.get("label").push(
      through.obj(
        (row, enc, next) => {
          const { id, file, source, deps, entry } = row;
          if (entry) {
            entries.push(file);
          }
          mappings[file] = [
            source,
            deps,
            {
              id: file,
              hash: getHash(source),
              browserifyId: id,
              sourcemap: "",
            },
          ];
          next(null, row);
        },
        function flush(next) {
          next();
        }
      )
    );

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
    
  }
}

function loader(mappings, entryPoints, options) {
  const { host = "localhost", protocol = "ws", port = 3000 } = options;
  if (entryPoints.length > 1) {
    throw new Error("[BHOT]Please use only one entry point");
  }
  var entryId = entryPoints[0];
  var scope = {
    mappings: mappings,
    cache: {},
    reloadHooks: {},
  };
  function startClient() {
    var ws = new WebSocket(`ws://localhost:${port}`);
    ws.onopen = () => {
      info("[HMR]:Listening for changes");
    };
    ws.onmessage = (m) => {
      var msg = JSON.parse(m.data);
      switch (msg.type) {
        case "change":
          handleBundleChange(msg.data);
          break;
        case "bundle_error":
          handleBundleError(msg.data);
          break;
        default:
          return void 0;
      }
    };
  }

  function compile(mapping) {
    var body = mapping[0];
    if (typeof body !== "function") {
      debug("Compiling module", mapping[2]);
      var compiled = compileModule(body, mapping[2].sourcemap);
      mapping[0] = compiled;
      mapping[2].source = body;
    }
  }

  function compileModule(source, sourcemap) {
    var toModule = new Function(
      "__livereactload_source",
      "__livereactload_sourcemap",
      "return eval('function __livereactload_module(require, module, exports){\\n' + __livereactload_source + '\\n}; __livereactload_module;' + (__livereactload_sourcemap || ''));"
    );
    return toModule(source, sourcemap);
  }


  // returns module from cache or the source then caches it
  function load(id, recur) {
    var mappings = scope.mappings;
    var cache = scope.cache;
    if (!cache[id]) {
      if (!mappings[id]) {
        var req = typeof require == "function" && require;
        if (req) return req(id);
        var error = new Error("Cannot find module '" + id + "'");
        error["code"] = "MODULE_NOT_FOUND";
        throw error;
      }
      var module = (cache[id] = {
        exports: {},
        hot: {
          onUpdate: (maybe, hook) => {
            scope.reloadHooks[id] = hook || maybe;
          },
        },
      });
      //(require, module, exports) => body
      const _moduleRequire = (path) => {
        var targetId = mappings[id][1][path];
        return load(targetId ? targetId : path);
      };
      mappings[id][0].call(
        module.exports,
        _moduleRequire,
        module,
        module.exports
      );
    }
    return cache[id].exports;
  }

  /**
   * Patches the existing modules with new sources and returns a list of changes
   * (module id and old mapping). This function does not do any reloading yet.
   */
  function patch(mappings) {
    var changes = [];
    Object.keys(mappings).forEach((id) => {
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

  /** Reloads modules based on the given changes or tries to restore previous code.
      changes are an array received from "patch" function */

  function reload(changes) {
    var changedModules = changes.map((c) => c[0]);
    var newMods = changes.filter((c) => !c[1]).map((c) => c[0]);

    try {
      info("Applying changes...");
      debug("Changed modules", changedModules);
      debug("New modules", newMods);
      evaluate(entryId, {});
      info("Reload complete!");
    } 
    catch (e) {
      error(
        "Error occurred while reloading changes. Restoring old implementation..."
      );
      console.error(e);
      console.error(e.stack);
      try {
        restore();
        evaluate(entryId, {});
        info("Restored!");
      } catch (re) {
        error("Restore failed. You may need to refresh your browser");
        console.error(re);
        console.error(re.stack);
      }
    }

    function evaluate(id, changeCache) {
      if (id in changeCache) {
        debug(
          "Circular dependency detected for module",
          id,
          "not traversing any further"
        );
        return changeCache[id];
      }
      if (isExternalModule(id)) {
        debug("Module", id, "is an external module. Do not reload");
        return false;
      }
      var meChanged = contains(changedModules, id);
      changeCache[id] = meChanged;
      var originalCache = scope.cache[id];
      //idk about this
      if (id in scope.cache) {
        delete scope.cache[id];
      }
      var deps = vals(scope.mappings[id][1]).filter(isLocalModule);
      var depsChanged = deps.map((dep) => evaluate(dep, changeCache));
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
            contains(newMods, id)
              ? console.log(" > New module::", id)
              : console.log(" > Reloading::", id);
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
        var id = c[0]
        var mapping = c[1];

        if (mapping) {
          debug("Restore old mapping", id);
          scope.mappings[id] = mapping;
        } 
        else {
          debug("Delete new mapping", id);
          delete scope.mappings[id];
        }

      });
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

  if (options.runtimeDependencies && options.runtimeDependencies.length) {
    options.runtimeDependencies.forEach(load);
  }


  // standalone bundles may need the exports from entry module
  return load(entryId);


  function isLocalModule(id) {
    return id.indexOf(options.nodeModulesRoot) === -1;
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
    keys(obj).forEach((key) => {
      if (obj.hasOwnProperty(key)) {
        fn(obj[key]);
      }
    });
  }


  function debug(...args) {
    if (options.debug) {
      console.log.apply(
        console,
        ["LiveReactload [DEBUG] ::"].concat(Array.prototype.slice.call(args))
      );
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
function mapValues(object, iteratee) {
  var result = {};
  Object.entries(object).forEach(([key, value]) => {
    return (result[key] = iteratee(value, key, object));
  });
  return result;
}

function getHash(str) {
  return createHash("sha1").update(str).digest("hex");
}

module.exports = LiveReloadPlugin;
