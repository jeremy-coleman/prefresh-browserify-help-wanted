module.exports = {
  plugins: [
    [
      "@babel/plugin-transform-typescript",
      {
        allowDeclareFields: true,
        isTSX: true,
        jsxPragma: "h",
        allExtensions: true
      }
    ],
    ["@babel/plugin-proposal-class-properties"],
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    ["@babel/plugin-syntax-object-rest-spread"],
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
};
