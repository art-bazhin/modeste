import {
  ITemplateInstance,
  createTemplateInstance,
  updateTemplateInstance
} from './template-instance';
import { TEMPLATE_INSTANCE_KEY } from './constants';
import { ITemplateResult } from './template-result';
import { getTemplate } from './template';

export function render(res: ITemplateResult, container: HTMLElement) {
  const template = getTemplate(res);
  const instance: ITemplateInstance =
    container.firstChild &&
    (container.firstChild as any)[TEMPLATE_INSTANCE_KEY];

  if (!instance || template !== instance.template) {
    container.innerHTML = '';
    container.appendChild(createTemplateInstance(res).fragment);
  } else {
    updateTemplateInstance(instance, res.values);
  }
}
