import {
  createTemplateInstance,
  updateTemplateInstance,
  TemplateInstance,
} from './template-instance';
import { TemplateResult } from './template-result';
import { getTemplate } from './template';
import { Component, isComponent } from './component';

const instances = new Map<HTMLElement, TemplateInstance>();
const componentFunctions = new Map<HTMLElement, (p: any) => TemplateResult>();

export function render(resultOrComponent: TemplateResult | Component<any>, container: HTMLElement) {
  const instance = instances.get(container);

  let shouldCreateInstance = false;
  let componentRender = false;

  if (isComponent(resultOrComponent)) {
    shouldCreateInstance = !instance || (componentFunctions.get(container) !== resultOrComponent.fn);
    componentRender = true;
  } else {
    shouldCreateInstance = !instance || (getTemplate(resultOrComponent) !== instance.template);
  };


  if (shouldCreateInstance) {
    container.innerHTML = '';
    const instance = createTemplateInstance(resultOrComponent);
    instances.set(container, instance);
    container.appendChild(instance.fragment);

    if (componentRender) componentFunctions.set(container, (resultOrComponent as Component<any>).fn);
    else componentFunctions.delete(container);
  } else {
    updateTemplateInstance(instance!, resultOrComponent);
  }
}
