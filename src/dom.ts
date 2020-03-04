import {
  TemplateInstance,
  updateTemplateInstance,
  createTemplateInstance
} from './template-instance';
import {
  TEMPLATE_INSTANCE_KEY,
  TEMPLATE_NODE_ID,
  TEXT_NODE_ID,
  ELEMENT_NODE_ID,
  FIRST_NODE_KEY,
  LAST_NODE_KEY,
  NODE_REF_KEY
} from './constants';
import { isTemplateResult } from './template-result';
import { getTemplate } from './template';

function prepareNodeValue(value: any) {
  if (value === undefined || value === false || value === null) return '';
  return value;
}

export function isElementNode(node: any): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE;
}

export function isCommentNode(node: any): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}

export function isTextNode(node: any): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

export function isOpenMark(node: Node): boolean {
  return (node as any)[FIRST_NODE_KEY];
}

export function markNodeAsFirst(node: Node, instance: TemplateInstance) {
  (node as any)[FIRST_NODE_KEY] = true;
  setTemplateInstance(node, instance);
}

export function isCloseMark(node: Node): boolean {
  return (node as any)[LAST_NODE_KEY];
}

export function markNodeAsLast(node: Node, instance: TemplateInstance) {
  (node as any)[LAST_NODE_KEY] = true;
  setTemplateInstance(node, instance);
}

export function updateNode(value: any, node: Node) {
  value = prepareNodeValue(value);
  const type = hasSameType(value, node);

  if (!type) {
    const newNode = insertBefore(value, node);
    const end = isOpenMark(node) ? getTemplateInstance(node).lastNode : node;

    removeNodes(node, end);
    return newNode;
  } else if (type === TEXT_NODE_ID) {
    (node as Text).textContent = value;
    return node;
  } else if (type === ELEMENT_NODE_ID) {
    return node;
  } else {
    return updateTemplateInstance(getTemplateInstance(node), value.values)
      .firstNode as Node;
  }
}

export function removeNodes(start: Node, end: Node) {
  const parent = start.parentNode!;
  let node = start;

  while (node !== end) {
    const next = node.nextSibling!;
    parent.removeChild(node);
    node = next;
  }

  parent.removeChild(node);
}

export function getNextSibling(node: Node) {
  if (isOpenMark(node)) return getTemplateInstance(node).lastNode.nextSibling;
  return node.nextSibling;
}

export function getTemplateInstance(node: Node): TemplateInstance {
  return (node as any)[TEMPLATE_INSTANCE_KEY];
}

function setTemplateInstance(node: Node, instance: TemplateInstance) {
  return ((node as any)[TEMPLATE_INSTANCE_KEY] = instance);
}

export function getNodeFromPosition(
  position: number[],
  parent: Node,
  level = 0
): Node {
  const child = parent.childNodes[position[level]];

  if (position.length - 1 === level) return child;
  return getNodeFromPosition(position, child, level + 1);
}

export function insertBefore(value: any, refChild: Node): Node {
  value = prepareNodeValue(value);
  const parent = refChild.parentNode!;

  if (isTemplateResult(value)) {
    const instance = createTemplateInstance(value);
    parent.insertBefore(instance.fragment, refChild);
    return instance.firstNode;
  }

  if (isElementNode(value)) {
    parent.insertBefore(value as HTMLElement, refChild);
    return value;
  }

  return parent.insertBefore(document.createTextNode(value), refChild);
}

export function hasSameType(value: any, node: Node) {
  const isRes = isTemplateResult(value);
  const isMark = isOpenMark(node);
  const isEl = isElementNode(value);

  if (isEl && value === node) return ELEMENT_NODE_ID;
  else if (node.nodeType === Node.TEXT_NODE && !isRes && !isMark && !isEl)
    return TEXT_NODE_ID;
  else if (
    isRes &&
    isMark &&
    getTemplateInstance(node).template === getTemplate(value)
  )
    return TEMPLATE_NODE_ID;

  return false;
}

export function setFirstNodeRef(markNode: Node, refNode: Node) {
  (markNode as any)[NODE_REF_KEY] = refNode;
}

export function getFirstNodeRef(markNode: Node): Node {
  return (markNode as any)[NODE_REF_KEY];
}
