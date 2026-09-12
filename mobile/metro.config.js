const { getDefaultConfig } = require("expo/metro-config");
const http = require("http");

const config = getDefaultConfig(__dirname);

const BACKEND_HOST = process.env.GYMFLOW_BACKEND_HOST || "127.0.0.1";
const BACKEND_PORT = process.env.GYMFLOW_BACKEND_PORT || "8080";
const PROXY_PREFIXES = ["/api", "/uploads"];

function proxyToBackend(req, res) {
  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${BACKEND_HOST}:${BACKEND_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (error) => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
    }

    res.end(
      JSON.stringify({
        message: "No se pudo conectar con el backend local.",
        detail: error.message,
      }),
    );
  });

  req.pipe(proxyReq);
}

const previousEnhanceMiddleware = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const enhancedMiddleware = previousEnhanceMiddleware
      ? previousEnhanceMiddleware(middleware, server)
      : middleware;

    return (req, res, next) => {
      if (
        req.url &&
        PROXY_PREFIXES.some((prefix) => req.url.startsWith(prefix))
      ) {
        proxyToBackend(req, res);
        return;
      }

      enhancedMiddleware(req, res, next);
    };
  },
};

module.exports = config;
