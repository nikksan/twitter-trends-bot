

class Logger {
  constructor(private prefix: string) {}

  info(...args: Array<any>) {
    console.log(`[${this.getCurrentDateAsString()}][${this.prefix}][INFO]`, ...args);
  }

  error(...args: Array<any>) {
    console.error(`[${this.getCurrentDateAsString()}][${this.prefix}][ERROR]`, ...args);
  }

  private getCurrentDateAsString() {
    return new Date().toISOString();
  }
}

export default Logger;
