/** @format */
const { mergeWithRules } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const webpack = require("webpack");

const merge = mergeWithRules({
  module: {
    rules: {
      test: "match",
      use: "replace",
    },
  },
  plugins: "append",
});

const contextFix = {
  module: {
    exprContextCritical: false,
  },
  ignoreWarnings: [
    /Critical dependency: the request of a dependency is an expression/,
  ],
};

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "madie",
    projectName: "madie-cql-library",
    webpackConfigEnv,
    argv,
    disableHtmlGeneration: true,
    orgPackagesAsExternal: false,
  });

  const externalsConfig = {
    externals: [
      "react",
      "react-dom",
      "@madie/madie-util",
      "@emotion/react",
      "@emotion/styled",
      "react-is",
      "styled-components",
    ],
  };

  const newCssRule = {
    module: {
      rules: [
        { test: /\.m?js/, type: "javascript/auto" },
        {
          test: /\.css$/i,
          include: [/node_modules/, /src/],
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
        {
          test: /\.scss$/,
          resolve: {
            extensions: [".scss", ".sass"],
          },
          use: [
            { loader: "style-loader" },
            {
              loader: "css-loader",
              options: { sourceMap: true, importLoaders: 2 },
            },
            {
              loader: "postcss-loader",
              options: {
                sourceMap: true,
              },
            },
            { loader: "sass-loader" },
          ],
          exclude: /node_modules/,
        },
      ],
    },
  };

  const polyfillFix = {
    resolve: {
      fallback: {
        process: require.resolve("process/browser.js"),
      },
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: "process/browser.js", // ✅ FIXED
      }),
    ],
  };

  // ✅ ADD polyfillFix HERE (last)
  return merge(
    externalsConfig,
    defaultConfig,
    newCssRule,
    polyfillFix,

    contextFix // ✅ ADD THIS
  );
};
