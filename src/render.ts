import {
  createTemplateInstance,
  updateTemplateInstance,
  TemplateInstance
} from './template-instance';
import { TemplateResult } from './template-result';
import { getTemplate } from './template';

const instances = new Map<HTMLElement, TemplateInstance>();

export function render(res: TemplateResult, container: HTMLElement) {
  const template = getTemplate(res);
  const instance = instances.get(container);

  if (!instance || template !== instance.template) {
    container.innerHTML = '';
    const instance = createTemplateInstance(res);
    instances.set(container, instance);
    container.appendChild(instance.fragment);
  } else {
    updateTemplateInstance(instance, res.values);
  }
}
