import {
  TEMPLATE_INSTANCE_KEY,
  MARK_TYPE_KEY,
  OPEN_MARK_ID,
  CLOSE_MARK_ID,
  NODE_REF_KEY
} from './constants';
import { ITemplateResult } from './template-result';
import {
  ITemplatePart,
  isNodePart,
  isAttrPart,
  isEventPart
} from './template-part';
import { getTemplate, ITemplate } from './template';
import {
  getNextSibling,
  insertBefore,
  removeNode,
  updateNode,
  getNodeFromPosition
} from './dom';

export interface ITemplateInstance {
  template: ITemplate;
  fragment: DocumentFragment;
  parts: ITemplatePart[];
  values: any[];
  nodes: Node[];
  openMark: any;
  closeMark: any;
}

export function createTemplateInstance(
  res: ITemplateResult
): ITemplateInstance {
  const template = getTemplate(res);
  const parts = template.parts;
  const values = res.values;
  const fragment = template.fragment.cloneNode(true) as DocumentFragment;
  const nodes = parts.map(part => getNodeFromPosition(part.position, fragment));
  const openMark = fragment.firstChild as any;
  const closeMark = fragment.lastChild as any;

  const instance = {
    template,
    fragment,
    nodes,
    values,
    parts,
    openMark,
    closeMark
  };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const value = values[i];
    const node = nodes[i];

    if (isAttrPart(part)) {
      processAttr(part.name!, value, node);
    } else if (isEventPart(part)) {
      processEvent(part.name!, node, instance, i);
    } else {
      const arr = valueToArray(value);

      for (let i = 0; i < arr.length; i++) {
        const n = insertBefore(arr[i], node);
        if (!i) (node as any)[NODE_REF_KEY] = n;
      }
    }
  }

  openMark[TEMPLATE_INSTANCE_KEY] = instance;
  closeMark[TEMPLATE_INSTANCE_KEY] = instance;

  openMark[MARK_TYPE_KEY] = OPEN_MARK_ID;
  closeMark[MARK_TYPE_KEY] = CLOSE_MARK_ID;

  return instance;
}

export function updateTemplateInstance(
  instance: ITemplateInstance,
  values: any[]
): ITemplateInstance {
  const parts = instance.template.parts;

  for (let i = 0; i < parts.length; i++) {
    const value = values[i];
    const oldValue = instance.values[i];

    if (value === oldValue) continue;

    const node = instance.nodes[i];
    const part = parts[i];

    if (isAttrPart(part)) {
      processAttr(part.name!, value, node);
    } else if (isNodePart(part)) {
      const valueArray = valueToArray(value);
      const oldValueArray = valueToArray(oldValue);

      const min = Math.min(valueArray.length, oldValueArray.length);
      const max = Math.max(valueArray.length, oldValueArray.length);
      const dif = max - min;

      let current = (node as any)[NODE_REF_KEY] as Node;

      for (let i = 0; i < min; i++) {
        const n = updateNode(valueArray[i], current);
        if (!i) (node as any)[NODE_REF_KEY] = n;
        current = getNextSibling(n)!;
      }

      if (valueArray.length > oldValueArray.length) {
        for (let i = min; i < max; i++) {
          insertBefore(valueArray[i], node);
        }
      } else {
        let next: Node;

        for (let i = 0; i < dif; i++) {
          next = getNextSibling(current)!;
          removeNode(current);
          current = next;
        }
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

function processAttr(attr: string, value: any, node: Node) {
  const target = node as HTMLElement;
  if (value === true) {
    target.setAttribute(attr, '');
  } else if (value === false) {
    target.removeAttribute(attr);
  } else {
    target.setAttribute(attr, value as string);
  }
}

function processEvent(
  event: string,
  node: Node,
  instance: ITemplateInstance,
  index: number
) {
  node.addEventListener(event, (e: any) => {
    if (instance.values[index]) instance.values[index](e);
  });
}
