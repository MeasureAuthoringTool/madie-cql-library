
import webpack from "webpack"

import singleSpaDefaults from "webpack-config-single-spa-ts";
import path from "path";
import { fileURLToPath } from 'url';
import { mergeWithRules } from 'webpack-merge';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (webpackConfigEnv, argv) => {


  const defaultConfig = singleSpaDefaults({
    orgName: "madie",
    projectName: "madie-cql-library",
    webpackConfigEnv,
    argv,
    disableHtmlGeneration: true,
    orgPackagesAsExternal: false,
  });

  const babelLoaderRule = {
    test: /\.(js|ts|jsx|tsx)$/,
    exclude: /node_modules/,
    use: "babel-loader", // relies on shared babel.config.js
  };

  const newCssRule = {
    module: {
      rules: [
        { test: /\.m?js$/, type: "javascript/auto" },
        babelLoaderRule,
       {
          test: /\.css$/i,
          include: [/node_modules/, /src/],
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                importLoaders: 1,
              },
            },
            "postcss-loader",
          ],
        },
        {
          test: /\.scss$/,
          resolve: {
            extensions: [".scss", ".sass"],
          },
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                importLoaders: 1,
              },
            },
            "postcss-loader", // tw transform
          ],
          exclude: /node_modules/,
        },
      ],
    },
  };

  const polyfillConfig = {
      resolve: {
        alias: {
          axios: path.resolve(__dirname, "node_modules/axios/dist/esm/axios.js"),
          "axios/lib/adapters/http": "axios/lib/adapters/xhr",
          'node-fetch': false,
          'buffer': false,
        },
        fallback: {
          fs: false,
          tls: false,
          net: false,
          path: false,
          zlib: false,
          http: false,
          https: false,
          stream: false,
          crypto: false,
          util: false,
          tty: false,
          "form-data": false,
          "combined-stream": false,
        },
      },
      // plugins: [
      //   new webpack.IgnorePlugin({ resourceRegExp: /^form-data$/ }),
      //   new webpack.IgnorePlugin({ resourceRegExp: /^combined-stream$/ }),
      //   new webpack.IgnorePlugin({ resourceRegExp: /^util$/ }),
      //   new webpack.IgnorePlugin({ resourceRegExp: /^follow-redirects$/ }),
      //   new webpack.NormalModuleReplacementPlugin(
      //     /axios\/lib\/adapters\/http\.js/,
      //     path.resolve(__dirname, "node_modules/axios/lib/adapters/xhr.js")
      //   )
      // ],
    };
  const watchConfig = {
    watchOptions: {
      poll: 1000,
      ignored: /node_modules/,
    },
  };

  const esmOutputConfig = {
    target: "es2022",
    experiments: {
      outputModule: true
    },
    output: {
      filename: "madie-madie-cql-library.js",
      module: true,
      library: {
        type: "module"
      }
    },
    externals: {
      react: "react",
      "react-dom": "react-dom",
      "react-dom/client": "react-dom/client",

      'react/jsx-runtime': 'react/jsx-runtime',
      'react/jsx-dev-runtime': 'react/jsx-dev-runtime',

      "@madie/madie-util": "@madie/madie-util",
      "@madie/madie-editor": "@madie/madie-editor",
    },
  };
 return mergeWithRules({
  module: {
    rules: {
      test: "match",
      use: "replace",
    },
  },
  plugins: "append",
})(
  defaultConfig,
  newCssRule,
  watchConfig,
  esmOutputConfig,
  polyfillConfig
);
};
