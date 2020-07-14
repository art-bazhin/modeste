import { TemplateInstance, updateTemplateInstance } from './template-instance';
import { TemplateResult } from './template-result';

let currentHookedResult: HookedResult<any>;
let currentInstance: TemplateInstance;
let currentIndex = 0;

export interface HookedResult<T extends unknown[]> {
  getTemplateResult: (...args: T) => TemplateResult;
  args: T;
}

export function hooked<T extends unknown[]>(
  getTemplateResult: (...args: T) => TemplateResult
) {
  return (...args: T) => ({
    getTemplateResult,
    args,
  });
}

export function isHookedResult(obj: any): obj is HookedResult<any> {
  return obj.getTemplateResult;
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
    updateTemplateInstance(
      instance,
      getHookedTemplateResult(hookedResult, instance)
    );
  };

  return [value, setValue] as [T, (newValue: T) => void];
}
