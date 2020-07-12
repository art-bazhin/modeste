import { TemplateInstance, updateTemplateInstance } from './template-instance';
import { TemplateResult } from './template-result';

let currentComponent: Component<any>;
let currentInstance: TemplateInstance;
let currentIndex = 0;

export interface Component<T> {
  fn: (props: T) => TemplateResult;
  props: T;
}

export function component<T>(fn: (props: T) => TemplateResult) {
  return (props: T) => ({
    fn,
    props,
  });
}

export function isComponent(obj: any): obj is Component<any> {
  return obj.props && obj.fn;
}

export function getComponentTemplateResult(
  component: Component<any>,
  instance: TemplateInstance
) {
  currentComponent = component;
  currentInstance = instance;
  currentIndex = 0;

  return component.fn(component.props);
}

export function useState<T>(initialValue: T) {
  const index = currentIndex++;
  const instance = currentInstance;
  const component = currentComponent;

  if (instance.state[index] === undefined) instance.state[index] = initialValue;

  const value = instance.state[index];
  const setValue = (newValue: T) => {
    instance.state[index] = newValue;
    updateTemplateInstance(
      instance,
      getComponentTemplateResult(component, instance)
    );
  };

  return [value, setValue] as [T, (newValue: T) => void];
}
