var watchifyMiddleware = require("./tools/watchify-middleware");
var http = require("http");
var defaultIndex = require("./tools/simple-html-index");
const babelify = require("babelify");
const { hmr, tsxify, lessify } = require("./tools/browserify-transforms");

var browserify = require("browserify");

var staticUrl = "main.js";

var bundler = browserify("src/index.tsx", {
  cache: {},
  packageCache: {},
  debug: true,
  sourceMaps: false,
  extensions: [".ts", ".tsx", ".js", ".jsx"],
  plugin: [hmr],
  transform: [
    lessify,
    //tsxify,
    babelify.configure({
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"],
      plugins: [
        ["@babel/plugin-transform-typescript", { isTSX: true }],
        ["@babel/plugin-proposal-decorators", { legacy: true }],
        ["@babel/plugin-syntax-object-rest-spread"],
        ["@babel/plugin-proposal-class-properties", { loose: true }],
        [
          "@babel/transform-react-jsx",
          {
            useBuiltIns: true,
            runtime: "automatic",
            useSpread: true,
            importSource: "preact",
          },
        ],
        ["@babel/plugin-transform-modules-commonjs"],
        [
          "babel-plugin-module-resolver",
          {
            root: ["./src"],
            extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"],
          },
        ],
      ],
      sourceMaps: false,
    }),

    // [
    //   aliasify.configure({
    //     aliases: {
    //       "react": "react/cjs/react.production.min.js",
    //       "react-dom": "react-dom/cjs/react-dom.production.min.js"
    //     },
    //     appliesTo: { includeExtensions: [".js", ".jsx", ".tsx", ".ts"] }
    //   }),
    //   { global: true }
    // ]
  ],
});

var watcher = watchifyMiddleware.emitter(bundler, {
  errorHandler: true,
});

// watcher.on('pending', function () {
//   console.log('pending request')
// })

// watcher.on('update', function () {
//   console.log('update request')
// })

watcher.on("log", function (ev) {
  if (ev.elapsed) {
    ev.elapsed = ev.elapsed + "ms";
    ev.url = staticUrl;
  }
  ev.name = "server";

  //console.log(JSON.stringify(ev))
});

var middleware = watcher.middleware;

var server = http.createServer(function (req, res) {
  if (req.url === "/") {
    defaultIndex({ entry: staticUrl }).pipe(res);
  } else if (req.url === "/" + staticUrl) {
    middleware(req, res);
  }
});

server.listen(8000, "localhost", function () {
  console.log("Listening on http://localhost:8000/");
});
