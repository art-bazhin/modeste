const CONSOLE_PREFIX = 'modeste:';

export function warning(...output: any[]) {
  console.warn(CONSOLE_PREFIX, ...output);
}
