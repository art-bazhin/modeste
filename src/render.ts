import {
  createTemplateInstance,
  updateTemplateInstance,
  TemplateInstance,
  runTemplateInstanceDestructors,
} from './template-instance';
import { TemplateResult } from './template-result';
import { getTemplate } from './template';
import { HookedResult, isHookedResult } from './hooks';

let isRenderRequested = false;
let isEffectsRequested = false;

const renderQueue = new Map<
  TemplateInstance,
  HookedResult<any> | TemplateResult | undefined
>();

const creationQueue = new Map<Element, TemplateResult | HookedResult<any>>();

const effects = new Set<() => void>();
const layoutEffects = new Set<() => void>();

const promise = Promise && Promise.resolve();

const elementInstanceMap = new Map<Element, TemplateInstance>();
const elementHookedMap = new Map<Element, (...args: any[]) => TemplateResult>();

const shouldBeDestructed = new Set<TemplateInstance>();

// This macrotask queue method is not stable in Firefox.

// const channel = MessageChannel && new MessageChannel();
// if (channel) channel.port1.onmessage = flushEffects;

function queueMicrotask(callback: () => void) {
  promise.then(callback);
}

function queueTask(callback: () => void) {
  setTimeout(() => callback(), 15); // 0 ms timeout is not stable in Firefox
}

function asyncFlushEffects() {
  if (!effects.size) return;
  // if (channel) channel.port2.postMessage('RUN_FX');
  // else queueTask(flushEffects);
  queueTask(flushEffects);
}

export function render(
  result: TemplateResult | HookedResult<any>,
  container: Element,
  callback?: () => void
) {
  const instance = elementInstanceMap.get(container);
  const hooked = elementHookedMap.get(container);

  let shouldCreateInstance = false;

  requestLayoutEffect(callback);

  if (isHookedResult(result))
    shouldCreateInstance = !hooked || hooked !== result.getTemplateResult;
  else
    shouldCreateInstance =
      !instance || getTemplate(result) !== instance.template;

  if (shouldCreateInstance) {
    if (instance) shouldBeDestructed.add(instance);
    requestInstanceCreation(result, container);
  } else requestInstanceRender(instance!, result);
}

export function removeInstanceFromRenderQueue(instance: TemplateInstance) {
  renderQueue.delete(instance);
}

export function requestInstanceRender(
  instance: TemplateInstance,
  result?: HookedResult<any> | TemplateResult
) {
  renderQueue.set(instance, result);
  requestRender(result);
}

export function requestEffect(callback?: () => void) {
  if (callback) effects.add(callback);
}

export function requestLayoutEffect(callback?: () => void) {
  if (callback) layoutEffects.add(callback);
}

function requestRender(result?: any) {
  if (!isRenderRequested) queueMicrotask(runRenderCycle);
  isRenderRequested = true;
}

function runRenderCycle() {
  flushEffects();
  flushDestructions();
  flushCreationQueue();
  flushRenderQueue();
  flushLayoutEffects();

  isEffectsRequested = true;
  isRenderRequested = false;

  asyncFlushEffects();
}

function requestInstanceCreation(
  result: TemplateResult | HookedResult<any>,
  container: Element
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
  container: Element
) {
  container.innerHTML = '';
  const instance = createTemplateInstance(result);
  elementInstanceMap.set(container, instance);
  container.appendChild(instance.fragment);

  if (isHookedResult(result))
    elementHookedMap.set(container, result.getTemplateResult);
  else elementHookedMap.delete(container);
}

function flushCreationQueue() {
  creationQueue.forEach(createInstance);
  creationQueue.clear();
}

function flushRenderQueue() {
  renderQueue.forEach(renderInstance);
  console.log('RENDER');
}

function flushLayoutEffects() {
  layoutEffects.forEach((cb) => cb());
  layoutEffects.clear();
}

function flushEffects() {
  if (!isEffectsRequested) return;

  effects.forEach((cb) => cb());
  effects.clear();
  isEffectsRequested = false;
}

function flushDestructions() {
  shouldBeDestructed.forEach((i) => runTemplateInstanceDestructors(i));
}
