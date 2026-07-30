import { EventEmitter } from 'node:events';

export const emailEvent = new EventEmitter();

emailEvent.on('sendEmail', (fn) => {
  void (async () => {
    try {
      await fn();
    } catch (error) {
      console.log(`fail in email event >>> ${error}`);
    }
  })();
});
