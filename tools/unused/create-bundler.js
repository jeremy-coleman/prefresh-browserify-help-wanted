const babelify = require("babelify");
const { hmr, tsxify, lessify } = require("./browserify-transforms");

var browserify = require("browserify");

module.exports = { createBundler };

var createBundler = ({src}) => {
  return browserify(src, {
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
        ]
      }),
    ],
  })
}
