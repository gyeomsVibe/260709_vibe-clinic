module.exports = {
  id: 'task-001-runner',
  name: 'Runner Engine Smoke Test',
  layer: 'TASK',
  linkedTask: 'TASK-001',

  async run(ctx) {
    // 엔진은 backend/ 파티션 안에 있다. ctx.projectDir(저장소 루트) 기준으로
    // 해석해야 진단 파일 위치가 바뀌어도 깨지지 않는다.
    const path = require('path');
    const enginePath = (name) => path.join(ctx.projectDir, 'backend', 'src', name);
    const { discoverDiagnostics } = require(enginePath('runner'));
    const { validateDiagnosticModule, validateResult } = require(enginePath('schema'));

    const exampleDir = path.join(ctx.projectDir, 'examples', 'calculator');
    const files = discoverDiagnostics(exampleDir);

    if (files.length === 0) {
      return { status: 'ERROR', details: 'No diagnostic files discovered in examples/calculator' };
    }

    if (files.length !== 3) {
      return {
        status: 'WARNING',
        details: `Expected 3 diagnostic files, found ${files.length}`,
      };
    }

    for (const f of files) {
      const mod = require(f);
      const validation = validateDiagnosticModule(mod, f);
      if (!validation.valid) {
        return {
          status: 'ERROR',
          details: `Schema validation failed for ${path.basename(f)}: ${validation.errors.join('; ')}`,
        };
      }
    }

    const goodResult = { status: 'OK', details: 'test' };
    const badResult = { status: 'INVALID', details: 'test' };
    const nullResult = null;

    if (validateResult(goodResult, 'test') !== null) {
      return { status: 'ERROR', details: 'validateResult incorrectly rejected valid result' };
    }

    if (validateResult(badResult, 'test') === null) {
      return { status: 'ERROR', details: 'validateResult incorrectly accepted invalid status' };
    }

    if (validateResult(nullResult, 'test') === null) {
      return { status: 'ERROR', details: 'validateResult incorrectly accepted null result' };
    }

    return { status: 'OK', details: `Discovered ${files.length} files, schema validation working` };
  }
};
