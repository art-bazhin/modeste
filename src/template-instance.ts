import {
  TEMPLATE_INSTANCE_KEY,
  MARK_TYPE_KEY,
  OPEN_MARK_ID,
  CLOSE_MARK_ID
} from './constants';
import { ITemplateResult } from './template-result';
import { ITemplatePart } from './template-part';
import { getTemplate, ITemplate } from './template';
import {
  getPreviousSibling,
  insertBefore,
  processEvent,
  processAttr,
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

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const value = values[i];
    const node = nodes[i];

    if (part.attr) {
      processAttr(part.attr, value, node);
    } else if (part.event) {
      processEvent(part.event, value, node);
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        insertBefore(value[i], node);
      }
    } else {
      insertBefore(value, node);
    }
  }

  const instance = {
    template,
    fragment,
    nodes,
    values,
    parts,
    openMark,
    closeMark
  };

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

    if (part.attr) {
      processAttr(part.attr, value, node);
    } else if (part.event) {
      processEvent(part.event, value, node);
    } else {
      const valueArray = valueToArray(value);
      const oldValueArray = valueToArray(oldValue);

      const min = Math.min(valueArray.length, oldValueArray.length);
      const dif = Math.abs(valueArray.length - oldValueArray.length);

      let current = node;

      for (let i = min - 1; i >= 0; i--) {
        current = getPreviousSibling(current)!;
        current = updateNode(valueArray[i], current);
      }

      if (valueArray.length > oldValueArray.length) {
        for (let i = 0; i < dif; i++) {
          insertBefore(valueArray[i], current);
        }
      } else {
        for (let i = 0; i < dif; i++) {
          removeNode(getPreviousSibling(current)!);
        }
      }
    }
  }

  instance.values = values;

  return instance.closeMark;
}

function valueToArray(value: any) {
  if (Array.isArray(value)) return value as any[];
  return [value];
}
