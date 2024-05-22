import debug from 'debug';

export class Logger {
  readonly info: debug.Debugger;
  readonly warn: debug.Debugger;
  readonly error: debug.Debugger;

  constructor(name: string) {
    this.info = debug(`${name}:info`);
    this.warn = debug(`${name}:warn`);
    this.error = debug(`${name}:error`);
  }
}
