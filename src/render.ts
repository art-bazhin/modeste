import {
  ITemplateInstance,
  createTemplateInstance,
  updateTemplateInstance
} from './template-instance';
import { TEMPLATE_INSTANCE_KEY } from './constants';
import { ITemplateResult } from './template-result';
import { getTemplate } from './template';
import { getTemplateInstance } from './dom';

export function render(res: ITemplateResult, container: HTMLElement) {
  const template = getTemplate(res);
  const instance =
    container.firstChild && getTemplateInstance(container.firstChild);

  if (!instance || template !== instance.template) {
    container.innerHTML = '';
    container.appendChild(createTemplateInstance(res).fragment);
  } else {
    updateTemplateInstance(instance, res.values);
  }
}
