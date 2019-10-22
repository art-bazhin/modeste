import {
  TEMPLATE_INSTANCE_KEY,
  MARK_TYPE_KEY,
  MarkTypes,
  EVENTS_KEY
} from './constants';
import { ITemplateResult, isTemplateResult } from './template-result';
import { ITemplatePart } from './template-part';
import { getTemplate, ITemplate } from './template';

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

  openMark[MARK_TYPE_KEY] = MarkTypes.Open;
  closeMark[MARK_TYPE_KEY] = MarkTypes.Close;

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

function getPreviousSibling(node: Node) {
  if (isCloseMark(node))
    return (node as any)[TEMPLATE_INSTANCE_KEY].openMark
      .previousSibling as Node;
  return node.previousSibling;
}

function valueToArray(value: any) {
  if (Array.isArray(value)) return value as any[];
  return [value];
}

function isNotNullOrUndefined(val: any) {
  return val !== null && val !== undefined;
}

function updateNode(value: any, node: Node) {
  const type = hasSameType(value, node);

  if (!type) {
    const newNode = insertBefore(value, node.nextSibling!);
    removeNode(node);
    return newNode;
  } else if (type === 'text') {
    (node as Text).textContent = value;
    return node;
  } else {
    return updateTemplateInstance(
      (node as any)[TEMPLATE_INSTANCE_KEY] as ITemplateInstance,
      value.values
    );
  }
}

function removeNode(node: Node) {
  const parent = node.parentNode!;

  if (isCloseMark(node)) {
    let instance = getTemplateInstanceFromNode(node);

    while (
      !isOpenMark(node) ||
      instance !== getTemplateInstanceFromNode(node)
    ) {
      let next = node.previousSibling!;
      parent.removeChild(node);
      node = next;
    }
  }

  parent.removeChild(node);
}

function getTemplateInstanceFromNode(node: Node) {
  return (node as any)[TEMPLATE_INSTANCE_KEY];
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

function processEvent(event: string, value: any, node: Node) {
  const target = node as any;
  const str = value.toString();

  if (!target[EVENTS_KEY]) target[EVENTS_KEY] = {};
  if (target[EVENTS_KEY][event] === str) return;

  target.removeAttribute(event);
  target[event] = value;
  target[EVENTS_KEY][event] = str;
}

function getNodeFromPosition(
  position: number[],
  parent: Node,
  level = 0
): Node {
  const child = parent.childNodes[position[level]];

  if (position.length - 1 === level) return child;
  return getNodeFromPosition(position, child, level + 1);
}

function insertBefore(value: any, refChild: Node) {
  const parent = refChild.parentElement!;

  if (isCloseMark(refChild))
    refChild = (refChild as any)[TEMPLATE_INSTANCE_KEY].openMark as Node;

  if (isTemplateResult(value)) {
    const instance = createTemplateInstance(value);
    parent.insertBefore(instance.fragment, refChild);
    return instance.closeMark;
  } else if (isNotNullOrUndefined(value)) {
    return parent.insertBefore(document.createTextNode('' + value), refChild);
  }
}

function hasSameType(value: any, node: Node) {
  if (node.nodeType === Node.TEXT_NODE && typeof value === 'string')
    return 'text';
  else if (
    isTemplateResult(value) &&
    isCloseMark(node) &&
    (node as any)[TEMPLATE_INSTANCE_KEY] &&
    (node as any)[TEMPLATE_INSTANCE_KEY].template === getTemplate(value)
  )
    return 'html';

  return false;
}

function isOpenMark(node: Node) {
  return (node as any)[MARK_TYPE_KEY] === MarkTypes.Open;
}

function isCloseMark(node: Node) {
  return (node as any)[MARK_TYPE_KEY] === MarkTypes.Close;
}
