import { TemplateInstance, updateTemplateInstance } from './template-instance';
import { TemplateResult } from './template-result';
import {
  requestInstanceRender,
  requestLayoutEffect,
  requestEffect,
} from './render';

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
  return isHookedResult(res) && res.key !== undefined;
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

function useEffectBase(
  requestCallback: (cb: () => void) => void,
  callback: () => void | (() => void),
  deps?: unknown[]
) {
  const isFirstRenderIndex = currentIndex++;
  const depsIndex = currentIndex++;
  const destructorIndex = currentIndex++;
  const instance = currentInstance;

  const isFirstRender = !instance.state[isFirstRenderIndex];
  const oldDeps: unknown[] = instance.state[depsIndex];
  const hasChangedDeps = deps
    ? !deps.every((dep, i) => dep === (oldDeps && oldDeps[i]))
    : true;

  instance.state[depsIndex] = deps;
  instance.state[isFirstRenderIndex] = true;

  if (isFirstRender || hasChangedDeps) {
    const destructor = instance.state[destructorIndex];
    if (destructor) destructor();

    requestCallback(() => {
      const newDestructor = callback();

      instance.state[destructorIndex] = newDestructor;
      if (instance.destructors) instance.destructors.push(newDestructor);
    });
  }
}

export function useEffect(
  callback: () => void | (() => void),
  deps?: unknown[]
) {
  useEffectBase(requestEffect, callback, deps);
}

export function useLayoutEffect(
  callback: () => void | (() => void),
  deps?: unknown[]
) {
  useEffectBase(requestLayoutEffect, callback, deps);
}
