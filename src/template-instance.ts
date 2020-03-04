import {
  ATTR_PART_ID,
  EVENT_PART_ID,
  REF_PART_ID,
  NODE_PART_ID,
  REF_ATTR_NAME
} from './constants';
import { TemplateResult } from './template-result';
import { TemplatePart } from './template-part';
import { getTemplate, Template } from './template';
import {
  getNextSibling,
  insertBefore,
  updateNode,
  getNodeFromPosition,
  removeNodes,
  markNodeAsFirst,
  markNodeAsLast,
  setFirstNodeRef,
  getFirstNodeRef
} from './dom';

export interface TemplateInstance {
  template: Template;
  fragment: DocumentFragment;
  parts: TemplatePart[];
  values: any[];
  nodes: Node[];
  firstNode: Node;
  lastNode: Node;
}

export function createTemplateInstance(
  res: TemplateResult
): TemplateInstance {
  const template = getTemplate(res);
  const parts = template.parts;
  const values = res.values;
  const fragment = template.fragment.cloneNode(true) as DocumentFragment;
  const nodes = parts.map(part => getNodeFromPosition(part.position, fragment));
  const firstNode = fragment.firstChild as any;
  const lastNode = fragment.lastChild as any;

  const instance = {
    template,
    fragment,
    nodes,
    values,
    parts,
    firstNode,
    lastNode
  };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const value = values[i];
    const node = nodes[i] as Element;

    switch (part.type) {
      case ATTR_PART_ID:
        processAttr(part.name!, value, node);
        break;
      case EVENT_PART_ID:
        processEvent(part.name!, node, instance, i);
        break;
      case REF_PART_ID:
        processRef(value, node, true);
        break;
      default:
        const arr = valueToArray(value);

        for (let i = 0; i < arr.length; i++) {
          const n = insertBefore(arr[i], node);
          if (!i) setFirstNodeRef(node, n);
        }
    }
  }

  markNodeAsFirst(firstNode, instance);
  markNodeAsLast(lastNode, instance);

  return instance;
}

export function updateTemplateInstance(
  instance: TemplateInstance,
  values: any[]
): TemplateInstance {
  const parts = instance.template.parts;

  for (let i = 0; i < parts.length; i++) {
    const value = values[i];
    const oldValue = instance.values[i];

    if (value === oldValue) continue;

    const node = instance.nodes[i] as Element;
    const part = parts[i];

    switch (part.type) {
      case ATTR_PART_ID:
        processAttr(part.name!, value, node);
        break;
      case REF_PART_ID:
        processRef(value, node);
        break;
      case NODE_PART_ID:
        const valueArray = valueToArray(value);
        const oldValueArray = valueToArray(oldValue);

        const min = Math.min(valueArray.length, oldValueArray.length);
        const max = Math.max(valueArray.length, oldValueArray.length);
        const dif = max - min;

        let current = getFirstNodeRef(node);

        for (let i = 0; i < min; i++) {
          const n = updateNode(valueArray[i], current);
          if (!i) setFirstNodeRef(node, n);
          current = getNextSibling(n)!;
        }

        if (valueArray.length > oldValueArray.length) {
          for (let i = min; i < max; i++) {
            insertBefore(valueArray[i], node);
          }
        } else if (dif) {
          removeNodes(current, node.previousSibling!);
        }
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
