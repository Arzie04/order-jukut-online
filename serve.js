#!/usr/bin/env node

/**
 * Simple HTTP Server untuk develop
 * Usage: node serve.js
 * Buka: http://localhost:8000/API_TESTER.html
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Default to index.html if root
  if (pathname === '/') {
    pathname = '/API_TESTER.html';
  }

  const filePath = path.join(PUBLIC_DIR, pathname);

  // Prevent directory traversal
  const realPath = path.resolve(filePath);
  if (!realPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      console.log(`❌ 404: ${pathname}`);
      return;
    }

    // Get MIME type
    const ext = path.extname(filePath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
        console.log(`❌ Error reading ${pathname}:`, err);
        return;
      }

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': data.length,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
      console.log(`✅ 200: ${pathname} (${mimeType})`);
    });
  });
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 Server running!                    ║
╟────────────────────────────────────────╢
║                                        ║
║  📍 http://localhost:${PORT}              ║
║                                        ║
║  🧪 API Tester:                        ║
║     http://localhost:${PORT}/API_TESTER.html  ║
║                                        ║
║  ⌨️  Press Ctrl+C to stop              ║
║                                        ║
╚════════════════════════════════════════╝
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} sudah dipakai!`);
    console.error(`   Solusi: Ganti PORT di script ini atau tutup aplikasi lain`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
