import { TemplateInstance, updateTemplateInstance } from './template-instance';
import { TemplateResult } from './template-result';

export const renderQueue: Map<TemplateInstance, HookedResult<any>> = new Map();

const promise = Promise && Promise.resolve();
let nextTick: (callback: () => void) => void = () => {};

if (window) {
  if (promise) nextTick = (callback) => promise.then(callback);
  else if (requestAnimationFrame)
    nextTick = (callback) => requestAnimationFrame(callback);
  else nextTick = (callback) => callback();
}

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
    render(instance, hookedResult);
  };

  return [value, setValue] as [T, (newValue: T) => void];
}

export function useEffect(
  callback: () => void | (() => void),
  deps: unknown[]
) {
  const index = currentIndex++;
  const instance = currentInstance;
  const hookedResult = currentHookedResult;
}

export function removeInstanceFromRenderQueue(instance: TemplateInstance) {
  renderQueue.delete(instance);
}

function render(instance: TemplateInstance, hookedResult: HookedResult<any>) {
  renderQueue.set(instance, hookedResult);

  nextTick(flushRenderQueue);
}

function renderInstance(
  hookedResult: HookedResult<any>,
  instance: TemplateInstance
) {
  updateTemplateInstance(
    instance,
    getHookedTemplateResult(hookedResult, instance)
  );
}

function flushRenderQueue() {
  renderQueue.forEach(renderInstance);
}
