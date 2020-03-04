import {
  TemplateInstance,
  TemplateInstanceChild,
  updateTemplateInstance,
  createTemplateInstance,
  isTemplateInstance
} from './template-instance';
import {
  TEMPLATE_INSTANCE_NODE,
  TEXT_NODE,
  ELEMENT_NODE,
  COMMENT_NODE
} from './constants';
import { isTemplateResult } from './template-result';
import { getTemplate } from './template';

function prepareNodeValue(value: any) {
  if (value === undefined || value === false || value === null) return '';
  return value;
}

export function isElementNode(node: any): node is HTMLElement {
  return node.nodeType === ELEMENT_NODE;
}

export function isCommentNode(node: any): node is Comment {
  return node.nodeType === COMMENT_NODE;
}

export function isTextNode(node: any): node is Text {
  return node.nodeType === TEXT_NODE;
}

export function updateChild(value: any, child: TemplateInstanceChild) {
  value = prepareNodeValue(value);

  switch (hasSameType(value, child)) {
    case TEXT_NODE:
      (child as Text).textContent = value;
      return child;
    case ELEMENT_NODE:
      return child;
    case TEMPLATE_INSTANCE_NODE:
      return updateTemplateInstance(child as TemplateInstance, value.values);
    default:
      const newNode = insertBefore(value, child);
      removeChild(child);
      return newNode;
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

export function removeChild(child: TemplateInstanceChild) {
  if (isTemplateInstance(child)) removeNodes(child.firstNode, child.lastNode);
  else removeNodes(child, child);
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

export function insertBefore(value: any, refChild: Node | TemplateInstance) {
  value = prepareNodeValue(value);
  const refNode = isTemplateInstance(refChild) ? refChild.firstNode : refChild;
  const parent = refNode.parentNode!;

  if (isTemplateResult(value)) {
    const instance = createTemplateInstance(value);
    parent.insertBefore(instance.fragment, refNode);
    return instance;
  }

  if (isElementNode(value)) {
    parent.insertBefore(value as HTMLElement, refNode);
    return value;
  }

  return parent.insertBefore(document.createTextNode(value), refNode);
}

export function hasSameType(value: any, child: TemplateInstanceChild) {
  const isResult = isTemplateResult(value);
  const isElement = isElementNode(value);
  const isInstance = isTemplateInstance(child);

  if (isElement && value === child) return ELEMENT_NODE;
  else if (isTextNode(child) && !isResult && !isInstance && !isElement)
    return TEXT_NODE;
  else if (
    isResult &&
    isInstance &&
    (child as TemplateInstance).template === getTemplate(value)
  )
    return TEMPLATE_INSTANCE_NODE;

  return false;
}
