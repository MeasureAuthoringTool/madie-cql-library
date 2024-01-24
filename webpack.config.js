/** @format */
const { mergeWithRules } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");

const merge = mergeWithRules({
  module: {
    rules: {
      test: "match",
      use: "replace",
    },
  },
  plugins: "append",
});

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
      "@madie/madie-components",
      "@madie/madie-editor",
      "@madie/madie-util",
    ],
  };

  // We need to override the css loading rule from the parent configuration
  // so that we can add postcss-loader to the chain
  const newCssRule = {
    module: {
      rules: [
        { test: /\.m?js/, type: "javascript/auto" },
        {
          test: /\.css$/i,
          include: [/node_modules/, /src/],
          use: [
            "style-loader",
            "css-loader", // uses modules: true, which I think we want. Parent does not
            "postcss-loader",
          ],
        },
        {
          test: /\.scss$/,
          resolve: {
            extensions: [".scss", ".sass"],
          },
          use: [
            {
              loader: "style-loader",
            },
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
            {
              loader: "sass-loader",
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
  };

  return merge(externalsConfig, defaultConfig, newCssRule);
};
