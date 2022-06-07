module.exports = {
    webpack: {
        configure: (config) => {
            config.module.rules.push({
                test: /\.js$/,
                use: { loader: require.resolve('@open-wc/webpack-import-meta-loader') }
            });
            config.resolve.fallback = { "http": require.resolve("stream-http"),"https": require.resolve("https-browserify"),"path": require.resolve("path-browserify"), "stream": require.resolve("stream-browserify") , "buffer" : false ,  "url": false };
            config.resolve.alias.https = "https-browserify";
            config.resolve.alias.http = "stream-http";
            config.resolve.alias.path = "path-browserify";
            config.resolve.alias.stream = "stream-browserify";
            return config
        }
  }
}
