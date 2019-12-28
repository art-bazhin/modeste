import {
  ITemplateInstance,
  updateTemplateInstance,
  createTemplateInstance
} from './template-instance';
import {
  TEMPLATE_INSTANCE_KEY,
  MARK_TYPE_KEY,
  TEMPLATE_NODE_ID,
  CLOSE_MARK_ID,
  TEXT_NODE_ID,
  OPEN_MARK_ID,
  ELEMENT_NODE_ID
} from './constants';
import { isTemplateResult } from './template-result';
import { getTemplate } from './template';

export function isElementNode(node: any): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE;
}

export function isCommentNode(node: any): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}

export function isTextNode(node: any): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

export function isOpenMark(node: Node) {
  return (node as any)[MARK_TYPE_KEY] === OPEN_MARK_ID;
}

export function isCloseMark(node: Node) {
  return (node as any)[MARK_TYPE_KEY] === CLOSE_MARK_ID;
}

export function updateNode(value: any, node: Node) {
  const type = hasSameType(value, node);

  if (!type) {
    const newNode = insertBefore(value, node);
    const end = isOpenMark(node)
      ? getTemplateInstanceFromNode(node).closeMark
      : node;

    removeNodes(node, end);
    return newNode;
  } else if (type === TEXT_NODE_ID) {
    (node as Text).textContent = value + '';
    return node;
  } else if (type === ELEMENT_NODE_ID) {
    return node;
  } else {
    return updateTemplateInstance(
      (node as any)[TEMPLATE_INSTANCE_KEY] as ITemplateInstance,
      value.values
    ).openMark as Node;
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
  if (isOpenMark(node))
    return (node as any)[TEMPLATE_INSTANCE_KEY].closeMark.nextSibling as Node;
  return node.nextSibling;
}

export function getTemplateInstanceFromNode(node: Node): ITemplateInstance {
  return (node as any)[TEMPLATE_INSTANCE_KEY];
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
  const parent = refChild.parentNode!;

  if (isTemplateResult(value)) {
    const instance = createTemplateInstance(value);
    parent.insertBefore(instance.fragment, refChild);
    return instance.openMark;
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
    (node as any)[TEMPLATE_INSTANCE_KEY].template === getTemplate(value)
  )
    return TEMPLATE_NODE_ID;

  return false;
}
