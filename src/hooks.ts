import { TemplateInstance, updateTemplateInstance } from './template-instance';
import { TemplateResult } from './template-result';
import { requestInstanceRender, requestCallback } from './render';

let currentHookedResult: HookedResult<any>;
let currentInstance: TemplateInstance;
let currentIndex = 0;

export interface HookedResult<T extends unknown[]> {
  getTemplateResult: (...args: T) => TemplateResult;
  args: T;
  key?: any;
}

export function hooked<T extends unknown[]>(
  getTemplateResult: (...args: T) => TemplateResult
) {
  return (...args: T) => ({
    getTemplateResult,
    args,
  });
}

export function isHookedResult(res: any): res is HookedResult<any> {
  return res.getTemplateResult;
}

export function isKeyedHookedResult(res: any): res is HookedResult<any> {
  return isHookedResult(res) && res.key;
}

export function getHookedTemplateResult(
  hookedResult: HookedResult<any>,
  instance: TemplateInstance
) {
  currentHookedResult = hookedResult;
  currentInstance = instance;
  currentIndex = 0;

  return hookedResult.getTemplateResult(...hookedResult.args);
}

export function useState<T>(initialValue: T) {
  const index = currentIndex++;
  const instance = currentInstance;
  const hookedResult = currentHookedResult;

  if (instance.state[index] === undefined) instance.state[index] = initialValue;

  const value = instance.state[index];
  const setValue = (newValue: T) => {
    instance.state[index] = newValue;
    requestInstanceRender(instance, hookedResult);
  };

  return [value, setValue] as [T, (newValue: T) => void];
}

export function useEffect(
  callback: () => void | (() => void),
  deps?: unknown[]
) {
  const index = currentIndex++;
  const instance = currentInstance;

  const oldDeps: unknown[] = instance.state[index];
  const hasChangedDeps = deps
    ? !deps.every((dep, i) => dep === (oldDeps && oldDeps[i]))
    : true;

  if (hasChangedDeps) requestCallback(callback);
}
