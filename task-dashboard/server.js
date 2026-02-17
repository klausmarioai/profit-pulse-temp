const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 8787;
const ROOT = __dirname;
const TASKS_FILE = path.join(ROOT, 'tasks-live.json');
const MAX_BODY_BYTES = 1024 * 1024;

function readTasks() {
  try {
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeTasks(tasks) {
  const safe = Array.isArray(tasks) ? tasks : [];
  fs.writeFileSync(TASKS_FILE, JSON.stringify(safe, null, 2));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let raw = '';
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      raw += chunk.toString('utf8');
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function normalizeTask(task) {
  const now = new Date().toISOString();
  return {
    id: String(task.id || ''),
    title: String(task.title || '').trim(),
    agent: String(task.agent || task.owner || 'main').trim() || 'main',
    status: String(task.status || 'todo').trim() || 'todo',
    createdAt: task.createdAt || now,
    updatedAt: task.updatedAt || now
  };
}

function readSessions() {
  try {
    const out = execSync('openclaw sessions --json', { cwd: path.join(ROOT, '..'), stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    const json = JSON.parse(out);
    return (json.sessions || []).slice(0, 10).map(s => ({
      key: s.key,
      kind: s.kind,
      model: s.model || '',
      updatedAt: s.updatedAt,
      ageMs: s.ageMs
    }));
  } catch {
    return [];
  }
}

function livePayload() {
  return JSON.stringify({
    updatedAt: Date.now(),
    tasks: readTasks(),
    sessions: readSessions()
  });
}

function serveFile(req, res) {
  let reqPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(ROOT, decodeURIComponent(reqPath.split('?')[0]));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    const types = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.css':'text/css' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/live')) {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    res.end(livePayload());
    return;
  }

  if (req.url.startsWith('/api/tasks') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    res.end(JSON.stringify({ tasks: readTasks() }));
    return;
  }

  if (req.url.startsWith('/api/tasks') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const incoming = Array.isArray(body.tasks) ? body.tasks : [];
      const normalized = incoming.map(normalizeTask).filter(t => t.title);
      writeTasks(normalized);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, count: normalized.length }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message || 'Invalid request' }));
    }
    return;
  }

  if (req.url.startsWith('/events')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`data: ${livePayload()}\n\n`);
    const timer = setInterval(() => {
      res.write(`data: ${livePayload()}\n\n`);
    }, 3000);
    req.on('close', () => clearInterval(timer));
    return;
  }

  serveFile(req, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Task dashboard live server: http://127.0.0.1:${PORT}`);
});
