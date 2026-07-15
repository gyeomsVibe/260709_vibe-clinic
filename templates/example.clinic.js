module.exports = {
  id: 'example-diagnostic',
  name: 'Example Diagnostic',
  layer: 'TASK',
  linkedTask: 'TASK-000',

  async run(ctx) {
    const isWorking = true;

    if (!isWorking) {
      return { status: 'ERROR', details: '문제가 발견되었습니다 (Something is broken)' };
    }

    return { status: 'OK', details: '모든 기능이 정상 동작합니다 (Everything is working correctly)' };
  }
};
