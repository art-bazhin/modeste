import {
  ATTR_PART,
  EVENT_PART,
  REF_PART,
  NODE_PART,
  REF_ATTR_NAME,
  TEMPLATE_INSTANCE_NODE
} from './constants';
import { TemplateResult } from './template-result';
import { TemplatePart } from './template-part';
import { getTemplate, Template } from './template';
import {
  insertBefore,
  updateChild,
  getNodeFromPosition,
  removeNodes
} from './dom';

export type TemplateInstanceChild = TemplateInstance | HTMLElement | Text;

interface TemplateInstanceChildren {
  [key: number]: TemplateInstanceChild[];
}

export function isTemplateInstance(value: any): value is TemplateInstance {
  return value.nodeType === TEMPLATE_INSTANCE_NODE;
}

export interface TemplateInstance {
  template: Template;
  fragment: DocumentFragment;
  parts: TemplatePart[];
  values: any[];
  dynamicNodes: Node[];
  firstNode: Node;
  lastNode: Node;
  children: TemplateInstanceChildren;
  nodeType: number;
}

export function createTemplateInstance(res: TemplateResult): TemplateInstance {
  const template = getTemplate(res);
  const parts = template.parts;
  const values = res.values;
  const fragment = template.fragment.cloneNode(true) as DocumentFragment;
  const dynamicNodes = parts.map(part =>
    getNodeFromPosition(part.position, fragment)
  );
  const firstNode = fragment.firstChild as any;
  const lastNode = fragment.lastChild as any;
  const children: TemplateInstanceChildren = {};

  const instance = {
    template,
    fragment,
    dynamicNodes,
    values,
    parts,
    firstNode,
    lastNode,
    children,
    nodeType: TEMPLATE_INSTANCE_NODE
  };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const value = values[i];
    const node = dynamicNodes[i] as Element;

    switch (part.type) {
      case ATTR_PART:
        processAttr(part.name!, value, node);
        break;
      case EVENT_PART:
        processEvent(part.name!, node, instance, i);
        break;
      case REF_PART:
        processRef(value, node, true);
        break;
      default:
        const arr = valueToArray(value);
        const c: TemplateInstanceChild[] = [];

        for (let i = 0; i < arr.length; i++) c.push(insertBefore(arr[i], node));
        children[i] = c;
    }
  }

  return instance;
}

export function updateTemplateInstance(
  instance: TemplateInstance,
  values: any[]
): TemplateInstance {
  const parts = instance.template.parts;
  const instanceChildren = instance.children;

  for (let i = 0; i < parts.length; i++) {
    const value = values[i];
    const oldValue = instance.values[i];

    if (value === oldValue) continue;

    const node = instance.dynamicNodes[i] as Element;
    const part = parts[i];

    switch (part.type) {
      case ATTR_PART:
        processAttr(part.name!, value, node);
        break;
      case REF_PART:
        processRef(value, node);
        break;
      case NODE_PART:
        const valueArray = valueToArray(value);
        const oldValueArray = valueToArray(oldValue);

        const children: TemplateInstanceChild[] = [];
        const oldChildren = instanceChildren[i];

        const min = Math.min(valueArray.length, oldValueArray.length);
        const max = Math.max(valueArray.length, oldValueArray.length);
        const dif = max - min;

        for (let i = 0; i < min; i++) {
          if (valueArray[i] !== oldValueArray[i])
            children.push(updateChild(valueArray[i], oldChildren[i]));
        }

        if (valueArray.length > oldValueArray.length) {
          for (let i = min; i < max; i++) {
            children.push(insertBefore(valueArray[i], node));
          }
        } else if (dif) {
          const start = oldChildren[min];
          removeNodes(
            isTemplateInstance(start) ? start.firstNode : start,
            node.previousSibling!
          );
        }

        instanceChildren[i] = children;
    }
  }

  instance.values = values;

  return instance;
}

function valueToArray(value: any) {
  if (Array.isArray(value)) return value.length ? (value as any[]) : [''];
  return [value];
}

function processAttr(attr: string, value: any, node: Element) {
  switch (value) {
    case true:
      return node.setAttribute(attr, '');
    case false:
    case null:
    case undefined:
      return node.removeAttribute(attr);
    default:
      if (attr === 'value') (node as any).value = value;
      node.setAttribute(attr, value as string);
  }
}

function processEvent(
  event: string,
  node: Node,
  instance: TemplateInstance,
  index: number
) {
  node.addEventListener(event, (e: any) => {
    if (instance.values[index]) instance.values[index].bind(node)(e);
  });

  (node as Element).removeAttribute('on' + event);
}

function processRef(value: any, node: Element, isFirstRender?: boolean) {
  if (value) value(node);
  if (isFirstRender) node.removeAttribute(REF_ATTR_NAME);
}
