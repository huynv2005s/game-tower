const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname);
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);

  // Normalize root path request
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  // Handle legacy drive paths (e.g. /c:/Go/demo/... or /c:/Users/...)
  if (/^\/?[a-zA-Z]:/i.test(reqPath)) {
    const match = reqPath.match(/(?:css|js|assets|manifest\.json|service-worker\.js|index\.html)[\w./-]*$/i);
    if (match) {
      reqPath = '/' + match[0];
    } else {
      reqPath = '/index.html';
    }
  }

  // Handle accidental absolute or drive paths passed in url
  const normalizedRoot = ROOT_DIR.replace(/\\/g, '/');
  if (reqPath.toLowerCase().startsWith('/' + normalizedRoot.toLowerCase())) {
    reqPath = reqPath.slice(normalizedRoot.length + 1) || '/index.html';
  } else if (reqPath.toLowerCase().startsWith(normalizedRoot.toLowerCase())) {
    reqPath = reqPath.slice(normalizedRoot.length) || '/index.html';
  }

  const relativePath = reqPath.replace(/^[/\\]+/, '');
  const filePath = path.resolve(ROOT_DIR, relativePath);

  // Security check: ensure path is within ROOT_DIR
  if (!filePath.toLowerCase().startsWith(ROOT_DIR.toLowerCase())) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Service-Worker-Allowed': '/'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Root directory: ${ROOT_DIR}`);
});
