import {
  TemplateInstance,
  TemplateInstanceChild,
  updateTemplateInstance,
  createTemplateInstance,
  isTemplateInstance,
  runTemplateInstanceDestructors,
} from './template-instance';
import { TEMPLATE_RESULT, STRING, HOOKED } from './constants';
import { isTemplateResult } from './template-result';
import { isHookedResult } from './hooks';

export function isDOMNode(value: any): value is HTMLElement | Text {
  return value.nodeType;
}

export function isElementNode(node: any): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE;
}

export function isCommentNode(node: any): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}

export function updateChild(
  value: any,
  oldValue: any,
  child: TemplateInstanceChild
) {
  value = prepareNodeValue(value);
  oldValue = prepareNodeValue(oldValue);

  if (value === oldValue) return child;

  switch (hasSameType(value, oldValue)) {
    case STRING:
      (child as Text).textContent = value;
      return child;
    case TEMPLATE_RESULT:
    case HOOKED:
      return updateTemplateInstance(child as TemplateInstance, value);
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
    const instance = (node as any).__MDST_INSTANCE__;
    if (instance) runTemplateInstanceDestructors(instance);

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

  if (isTemplateResult(value) || isHookedResult(value)) {
    const instance = createTemplateInstance(value);
    parent.insertBefore(instance.fragment, refNode);
    return instance;
  }

  if (isDOMNode(value)) {
    parent.insertBefore(value as HTMLElement, refNode);
    return value;
  }

  return parent.insertBefore(document.createTextNode(value), refNode);
}

function prepareNodeValue(value: any) {
  if ((!value && value === undefined) || value === null || value === false)
    return '';
  return value;
}

function hasSameType(value: any, oldValue: any) {
  const valueIsTemplateResult = isTemplateResult(value);
  const oldValueIsTemplateResult = isTemplateResult(oldValue);

  const valueIsHookedResult = isHookedResult(value);
  const oldValueIsHookedResult = isHookedResult(oldValue);

  if (
    valueIsHookedResult &&
    oldValueIsHookedResult &&
    value.getTemplateResult === oldValue.getTemplateResult
  )
    return HOOKED;

  if (
    valueIsTemplateResult &&
    oldValueIsTemplateResult &&
    value.strings === oldValue.strings
  )
    return TEMPLATE_RESULT;

  if (
    !valueIsHookedResult &&
    !oldValueIsHookedResult &&
    !valueIsTemplateResult &&
    !oldValueIsTemplateResult &&
    !isDOMNode(value) &&
    !isDOMNode(oldValue)
  )
    return STRING;

  return false;
}
