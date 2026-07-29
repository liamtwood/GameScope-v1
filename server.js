// GameScope frontend host.
// Serves the prebuilt Angular app and reverse-proxies API/GraphQL/video calls to
// the (HTTP-only) backends server-side, so the browser only ever talks HTTPS to us
// (no mixed-content blocking). The Angular app is built to call these same-origin
// prefixes: /gsapi, /gsgql, /gsvideo.

const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8080;

const API_TARGET = process.env.API_TARGET
  || 'http://gamesc-games-ztjlntvk4x02-674627566.eu-west-2.elb.amazonaws.com';
const VIDEO_TARGET = process.env.VIDEO_TARGET
  || 'http://52.213.190.143:8000';

const proxyLog = (msg) => console.log(`[proxy] ${msg}`);

// REST API: /gsapi/api/... -> {API_TARGET}/api/...
app.use('/gsapi', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  pathRewrite: { '^/gsapi': '' },
  onError: (err, req, res) => { proxyLog(`API error: ${err.message}`); res.status(502).json({ message: 'Upstream API error' }); },
}));

// GraphQL: /gsgql -> {API_TARGET}/graphql
app.use('/gsgql', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  pathRewrite: { '^/gsgql': '/graphql' },
  onError: (err, req, res) => { proxyLog(`GraphQL error: ${err.message}`); res.status(502).json({ message: 'Upstream GraphQL error' }); },
}));

// Video processing: /gsvideo/... -> {VIDEO_TARGET}/...
app.use('/gsvideo', createProxyMiddleware({
  target: VIDEO_TARGET,
  changeOrigin: true,
  pathRewrite: { '^/gsvideo': '' },
  onError: (err, req, res) => { proxyLog(`Video error: ${err.message}`); res.status(502).json({ message: 'Upstream video error' }); },
}));

// Static built assets.
const browserDir = path.join(__dirname, 'browser');
app.use(express.static(browserDir));

// SPA fallback: any other route -> index.html (Angular router handles it client-side).
app.get('*', (_req, res) => {
  res.sendFile(path.join(browserDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GameScope frontend serving on ${PORT}`);
  console.log(`  API proxy   /gsapi   -> ${API_TARGET}`);
  console.log(`  GraphQL     /gsgql   -> ${API_TARGET}/graphql`);
  console.log(`  Video proxy /gsvideo -> ${VIDEO_TARGET}`);
});
