const fs = require("fs");
const browserify = require("browserify");
const babelify = require("babelify");
const { lessify } = require("./tools/transforms/lessify");
const tinyify = require("tinyify")
const defaultIndex = require("./tools/simple-html-index");

var bundler = browserify("src/index.tsx", {
  cache: {},
  packageCache: {},
  debug: false,
  sourceMaps: false,
  extensions: [".ts", ".tsx", ".js", ".jsx"],
  plugin: [tinyify],
  transform: [
    lessify,
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
  ],
});

async function bundle() {
  await fs.promises.mkdir("build", {recursive: true}).catch(console.warn)
  await Promise.all([
    defaultIndex({ entry: "main.js" }).pipe(fs.createWriteStream("build/index.html")),
    bundler
    .bundle()
    .on("error", console.error)
    .pipe(fs.createWriteStream("build/main.js"))
  ])
  //.on("close", launch);
  //console.log(`wrote ${PATHS.OUT_FILE}`);
}

bundle().catch(console.error);
