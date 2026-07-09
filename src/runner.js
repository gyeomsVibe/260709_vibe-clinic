const fs = require('fs');
const path = require('path');
const { validateDiagnosticModule, validateResult } = require('./schema');

const DIAG_DIR = '.vibe-diagnosis/diagnostics';
const DIAG_PATTERN = /\.diag\.js$/;
const DEFAULT_TIMEOUT_MS = 30000;

function withTimeout(promise, ms, diagId) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Diagnostic "${diagId}" timed out after ${ms}ms`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function discoverDiagnostics(projectDir) {
  const diagPath = path.join(projectDir, DIAG_DIR);

  if (!fs.existsSync(diagPath)) {
    return [];
  }

  return fs.readdirSync(diagPath)
    .filter(f => DIAG_PATTERN.test(f))
    .sort()
    .map(f => path.join(diagPath, f));
}

async function runDiagnostics(projectDir) {
  const files = discoverDiagnostics(projectDir);
  const results = [];

  if (files.length === 0) {
    return [{
      id: '_no_diagnostics',
      name: 'No Diagnostics Found',
      layer: 'SYSTEM',
      status: 'WARNING',
      details: `No .diag.js files found in ${DIAG_DIR}/`,
      duration: 0,
    }];
  }

  for (const filePath of files) {
    const startTime = Date.now();
    let mod;

    try {
      delete require.cache[require.resolve(filePath)];
      mod = require(filePath);
    } catch (err) {
      results.push({
        id: path.basename(filePath, '.diag.js'),
        name: path.basename(filePath),
        layer: 'UNKNOWN',
        status: 'ERROR',
        details: `Failed to load: ${err.message}`,
        duration: Date.now() - startTime,
      });
      continue;
    }

    const validation = validateDiagnosticModule(mod, filePath);
    if (!validation.valid) {
      results.push({
        id: mod.id || path.basename(filePath, '.diag.js'),
        name: mod.name || path.basename(filePath),
        layer: mod.layer || 'UNKNOWN',
        status: 'ERROR',
        details: `Schema violation: ${validation.errors.join('; ')}`,
        duration: Date.now() - startTime,
      });
      continue;
    }

    try {
      const result = await withTimeout(
        Promise.resolve().then(() => mod.run({ projectDir })),
        mod.timeout || DEFAULT_TIMEOUT_MS,
        mod.id
      );
      const resultError = validateResult(result, mod.id);

      if (resultError) {
        results.push({
          id: mod.id,
          name: mod.name,
          layer: mod.layer,
          ...resultError,
          duration: Date.now() - startTime,
        });
      } else {
        results.push({
          id: mod.id,
          name: mod.name,
          layer: mod.layer,
          linkedTask: mod.linkedTask || null,
          status: result.status,
          details: result.details || '',
          duration: Date.now() - startTime,
        });
      }
    } catch (err) {
      results.push({
        id: mod.id,
        name: mod.name,
        layer: mod.layer,
        status: 'ERROR',
        details: `Runtime error: ${err.message}`,
        duration: Date.now() - startTime,
      });
    }
  }

  return results;
}

module.exports = { runDiagnostics, discoverDiagnostics };
