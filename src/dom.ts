const EMPTY_TEXT_NODE = document.createTextNode('');

export function isElementNode(node: any): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE;
}

export function isCommentNode(node: any): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}

export function isTextNode(node: any): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

export function createMark(key?: string, value?: any) {
  const mark: any = EMPTY_TEXT_NODE.cloneNode();
  if (key) mark[key] = value;
  return mark;
}
