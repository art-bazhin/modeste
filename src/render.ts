import {
  createTemplateInstance,
  updateTemplateInstance,
  TemplateInstance,
} from './template-instance';
import { TemplateResult } from './template-result';
import { getTemplate } from './template';
import { HookedResult, isHookedResult } from './hooks';

const instances = new Map<HTMLElement, TemplateInstance>();
const hookedFunctions = new Map<HTMLElement, (p: any) => TemplateResult>();

export function render(
  result: TemplateResult | HookedResult<any>,
  container: HTMLElement
) {
  const instance = instances.get(container);

  let shouldCreateInstance = false;
  let hookedRender = false;

  if (isHookedResult(result)) {
    shouldCreateInstance =
      !instance || hookedFunctions.get(container) !== result.getTemplateResult;
    hookedRender = true;
  } else {
    shouldCreateInstance =
      !instance || getTemplate(result) !== instance.template;
  }

  if (shouldCreateInstance) {
    container.innerHTML = '';
    const instance = createTemplateInstance(result);
    instances.set(container, instance);
    container.appendChild(instance.fragment);

    if (hookedRender)
      hookedFunctions.set(
        container,
        (result as HookedResult<any>).getTemplateResult
      );
    else hookedFunctions.delete(container);
  } else {
    updateTemplateInstance(instance!, result);
  }
}
