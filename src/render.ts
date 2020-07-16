import {
  createTemplateInstance,
  updateTemplateInstance,
  TemplateInstance,
} from './template-instance';
import { TemplateResult } from './template-result';
import { getTemplate } from './template';
import { HookedResult, isHookedResult, getHookedTemplateResult } from './hooks';

let isRenderRequested = false;

const renderQueue: Map<
  TemplateInstance,
  HookedResult<any> | TemplateResult | undefined
> = new Map();

const creationQueue: Map<
  HTMLElement,
  TemplateResult | HookedResult<any>
> = new Map();

const renderCallbacks = new Set<() => void>();

const promise = Promise && Promise.resolve();
let nextTick: (callback: () => void) => void = () => {};

if (window) {
  if (promise) nextTick = (callback) => promise.then(callback);
  else if (requestAnimationFrame)
    nextTick = (callback) => requestAnimationFrame(callback);
  else nextTick = (callback) => setTimeout(callback);
}

const elementInstanceMap = new Map<HTMLElement, TemplateInstance>();

const elementHookedMap = new Map<
  HTMLElement,
  (...args: any[]) => TemplateResult
>();

export function render(
  result: TemplateResult | HookedResult<any>,
  container: HTMLElement,
  callback?: () => void
) {
  const instance = elementInstanceMap.get(container);
  const hooked = elementHookedMap.get(container);

  let shouldCreateInstance = false;

  requestCallback(callback);

  if (isHookedResult(result))
    shouldCreateInstance = !hooked || hooked !== result.getTemplateResult;
  else
    shouldCreateInstance =
      !instance || getTemplate(result) !== instance.template;

  if (shouldCreateInstance) requestInstanceCreation(result, container);
  else requestInstanceRender(instance!, result);
}

export function removeInstanceFromRenderQueue(instance: TemplateInstance) {
  renderQueue.delete(instance);
}

export function requestInstanceRender(
  instance: TemplateInstance,
  result?: HookedResult<any> | TemplateResult
) {
  renderQueue.set(instance, result);
  requestRender();
}

export function requestCallback(callback?: () => void) {
  if (callback) renderCallbacks.add(callback);
}

function requestRender() {
  if (!isRenderRequested) nextTick(flushRenderQueue);
  isRenderRequested = true;
}

function requestInstanceCreation(
  result: TemplateResult | HookedResult<any>,
  container: HTMLElement
) {
  creationQueue.set(container, result);
  requestRender();
}

function renderInstance(
  result: TemplateResult | HookedResult<any> | undefined,
  instance: TemplateInstance
) {
  updateTemplateInstance(instance, result);
}

function createInstance(
  result: TemplateResult | HookedResult<any>,
  container: HTMLElement
) {
  container.innerHTML = '';
  const instance = createTemplateInstance(result);
  elementInstanceMap.set(container, instance);
  container.appendChild(instance.fragment);

  if (isHookedResult(result))
    elementHookedMap.set(container, result.getTemplateResult);
  else elementHookedMap.delete(container);
}

function flushRenderQueue() {
  creationQueue.forEach(createInstance);
  creationQueue.clear();

  renderQueue.forEach(renderInstance);

  renderCallbacks.forEach((cb) => cb());
  renderCallbacks.clear();

  isRenderRequested = false;
}
