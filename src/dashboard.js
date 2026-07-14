const http = require('http');
const fs = require('fs');
const path = require('path');
const { runDiagnostics, discoverDiagnostics } = require('./runner');
const { validateDiagnosticModule } = require('./schema');
const { getByokConfig, saveByokConfig } = require('./config-manager');
const { repairDiagnostic } = require('./repairer');
const { listProviders } = require('./ai-provider');

const HTML_PATH = path.join(__dirname, 'dashboard.html');

function listDiagnosticMeta(projectDir) {
  const files = discoverDiagnostics(projectDir);
  const result = [];

  for (const filePath of files) {
    try {
      delete require.cache[require.resolve(filePath)];
      const mod = require(filePath);
      const validation = validateDiagnosticModule(mod, filePath);
      result.push({
        file: path.basename(filePath),
        id: mod.id || path.basename(filePath, '.clinic.js'),
        name: mod.name || 'Unknown',
        layer: mod.layer || 'UNKNOWN',
        linkedTask: mod.linkedTask || null,
        valid: validation.valid,
      });
    } catch (err) {
      result.push({
        file: path.basename(filePath),
        id: path.basename(filePath, '.clinic.js'),
        name: 'Failed to load',
        layer: 'UNKNOWN',
        valid: false,
      });
    }
  }

  return result;
}

function listErrorPatterns(projectDir) {
  const patternsDir = path.join(projectDir, '.vibe-clinic', 'error-patterns');
  if (!fs.existsSync(patternsDir)) return [];
  return fs.readdirSync(patternsDir).filter(f => f.endsWith('.md'));
}

function readErrorPattern(projectDir, filename) {
  const safeName = path.basename(filename);
  if (safeName !== filename || !safeName.endsWith('.md')) return null;
  const filePath = path.join(projectDir, '.vibe-clinic', 'error-patterns', safeName);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendText(res, text, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

function sendHtml(res, html) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function startDashboard(projectDir, port = 7700) {
  let currentProjectDir = path.resolve(projectDir);
  let lastRunResults = [];

  const server = http.createServer(async (req, res) => {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'OPTIONS') {
      sendJson(res, {});
      return;
    }

    if (req.method === 'GET' && url.pathname === '/') {
      const html = fs.readFileSync(HTML_PATH, 'utf-8');
      sendHtml(res, html);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/list') {
      const diagnostics = listDiagnosticMeta(currentProjectDir);
      sendJson(res, diagnostics);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/errors') {
      const errors = listErrorPatterns(currentProjectDir);
      sendJson(res, errors);
      return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/api/errors/')) {
      const filename = decodeURIComponent(url.pathname.slice('/api/errors/'.length));
      const content = readErrorPattern(currentProjectDir, filename);
      if (content === null) {
        sendText(res, 'Not found', 404);
      } else {
        sendText(res, content);
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/run') {
      try {
        const results = await runDiagnostics(currentProjectDir);
        lastRunResults = results;
        const summary = {
          total: results.length,
          ok: results.filter(r => r.status === 'OK').length,
          warning: results.filter(r => r.status === 'WARNING').length,
          error: results.filter(r => r.status === 'ERROR').length,
        };
        const overallStatus = summary.error > 0 ? 'ERROR' : summary.warning > 0 ? 'WARNING' : 'OK';
        const healthPercent = summary.total > 0 ? Math.round((summary.ok / summary.total) * 100) : 100;
        sendJson(res, { results, summary, overallStatus, healthPercent });
      } catch (err) {
        sendJson(res, { error: err.message }, 500);
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/byok/config') {
      const byok = getByokConfig(currentProjectDir, { maskKey: true });
      const providers = listProviders();
      sendJson(res, { byok, providers });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/byok/save') {
      try {
        const body = await readBody(req);
        const { provider, apiKey, model } = body;
        saveByokConfig(currentProjectDir, { provider: provider || '', apiKey: apiKey || '', model: model || '' });
        const byok = getByokConfig(currentProjectDir, { maskKey: true });
        sendJson(res, { success: true, byok });
      } catch (err) {
        sendJson(res, { error: err.message }, 400);
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/repair') {
      try {
        const body = await readBody(req);
        const { diagId } = body;
        if (!diagId) {
          sendJson(res, { error: 'diagId is required' }, 400);
          return;
        }

        const diagResult = lastRunResults.find(r => r.id === diagId);
        if (!diagResult) {
          sendJson(res, { error: `No recent result found for "${diagId}". Run diagnostics first.` }, 404);
          return;
        }

        if (diagResult.status === 'OK') {
          sendJson(res, { error: `Diagnostic "${diagId}" is already OK.` }, 400);
          return;
        }

        const result = await repairDiagnostic(currentProjectDir, diagResult);

        if (result.rerunResult) {
          const idx = lastRunResults.findIndex(r => r.id === diagId);
          if (idx !== -1) lastRunResults[idx] = result.rerunResult;
        }

        sendJson(res, result);
      } catch (err) {
        sendJson(res, { error: err.message }, 500);
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/project/list') {
      try {
        const coreRoot = path.resolve(__dirname, '..');
        const projectOptions = [
          { name: 'Vibe Clinic 본체', path: coreRoot }
        ];

        const examplesDir = path.join(coreRoot, 'examples');
        if (fs.existsSync(examplesDir)) {
          const subdirs = fs.readdirSync(examplesDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => ({
              name: `예제: ${d.name}`,
              path: path.join(examplesDir, d.name)
            }));
          projectOptions.push(...subdirs);
        }

        sendJson(res, { currentProjectDir, projectOptions });
      } catch (err) {
        sendJson(res, { error: err.message }, 500);
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/project/select') {
      try {
        const { execFile } = require('child_process');
        // Compile-free IFileOpenDialog picker (FOS_PICKFOLDERS via reflection).
        // Shipped as a standalone .ps1 so no Base64/encoding issues; -STA is
        // required for the dialog, and the script guarantees foreground focus.
        const pickerScript = path.join(__dirname, 'folder-picker.ps1');

        execFile(
          'powershell',
          ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', pickerScript],
          { windowsHide: true, timeout: 300000 },
          (err, stdout, stderr) => {
            const match = String(stdout || '').match(/^SELECTED:(.+)$/m);
            if (match) {
              sendJson(res, { success: true, selectedPath: match[1].trim() });
              return;
            }
            if (err) {
              const detail = (stderr || err.message || '').toString().trim().slice(0, 300);
              sendJson(res, { error: `폴더 선택 창을 여는데 실패했습니다: ${detail}` }, 500);
              return;
            }
            sendJson(res, { success: false, cancelled: true });
          }
        );
      } catch (err) {
        sendJson(res, { error: err.message }, 500);
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/project/change') {
      try {
        const body = await readBody(req);
        if (!body.projectDir) {
          sendJson(res, { error: 'projectDir is required' }, 400);
          return;
        }

        const targetPath = path.resolve(body.projectDir);
        if (!fs.existsSync(targetPath)) {
          sendJson(res, { error: `지정한 경로가 존재하지 않습니다: ${body.projectDir}` }, 400);
          return;
        }

        currentProjectDir = targetPath;
        lastRunResults = [];
        sendJson(res, { success: true, currentProjectDir });
      } catch (err) {
        sendJson(res, { error: err.message }, 500);
      }
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${port}`;
    console.log(`\n  \x1b[36m🩺 Vibe Clinic Dashboard\x1b[0m`);
    console.log(`  \x1b[90m${'─'.repeat(40)}\x1b[0m`);
    console.log(`  Running at: \x1b[32m${url}\x1b[0m`);
    console.log(`  Project:    ${currentProjectDir}`);
    console.log(`  \x1b[90m${'─'.repeat(40)}\x1b[0m`);
    console.log(`  Press \x1b[33mCtrl+C\x1b[0m to stop\n`);

    openBrowser(url);
  });

  return server;
}

function openBrowser(url) {
  const { exec } = require('child_process');
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, { windowsHide: true });
}

module.exports = { startDashboard };
