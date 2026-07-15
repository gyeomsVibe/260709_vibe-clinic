module.exports = {
  id: 'task-001-arithmetic',
  name: 'Basic Arithmetic Operations',
  layer: 'TASK',
  linkedTask: 'TASK-001',

  async run(ctx) {
    const calc = require('../../calculator');

    const tests = [
      { fn: 'add',      args: [2, 3],   expected: 5  },
      { fn: 'subtract', args: [10, 4],  expected: 6  },
      { fn: 'multiply', args: [3, 7],   expected: 21 },
      { fn: 'divide',   args: [20, 4],  expected: 5  },
    ];

    for (const t of tests) {
      const result = calc[t.fn](...t.args);
      if (result !== t.expected) {
        return { status: 'ERROR', details: `${t.fn}(${t.args}) = ${result}, 기대값 ${t.expected} (expected)` };
      }
    }

    return { status: 'OK', details: '사칙연산 4종 모두 검증 통과 (all 4 operations verified)' };
  }
};
