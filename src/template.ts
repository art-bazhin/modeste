import { PLACEHOLDER_MARK, ATTR_MARK, MARK, NODE_PART_ID } from './constants';
import { ITemplateResult, getTemplateResultHTML } from './template-result';
import { ITemplatePart, getTemplatePartsFromElement } from './template-part';
import { isCommentNode, isElementNode } from './dom';

const templatesMap = new Map<TemplateStringsArray, ITemplate>();

export interface ITemplate {
  fragment: DocumentFragment;
  parts: ITemplatePart[];
}

export function getTemplate(res: ITemplateResult): ITemplate {
  const { strings } = res;

  if (templatesMap.has(strings)) return templatesMap.get(strings) as ITemplate;

  const templateElement = document.createElement('template');
  templateElement.innerHTML = getTemplateResultHTML(res);

  const fragment = templateElement.content;

  fragment.appendChild(document.createComment(MARK));
  fragment.insertBefore(document.createComment(MARK), fragment.firstChild);

  let node = fragment.firstChild as Node | null;
  let position = [0];
  let parts: ITemplatePart[] = [];

  while (node) {
    let parent = node.parentNode;

    if (isCommentNode(node) && node.textContent === PLACEHOLDER_MARK) {
      parts.push({ type: NODE_PART_ID, position: position.slice() });
      node = node.nextSibling;
    } else if (isElementNode(node)) {
      if (node.hasAttribute(ATTR_MARK)) {
        parts = parts.concat(getTemplatePartsFromElement(node, position));
      }

      if (node.childNodes.length) {
        node = node.childNodes[0];
        position.push(-1);
      } else {
        node = node.nextSibling;
      }
    } else {
      node = node.nextSibling;
    }

    while (!node && parent && parent.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      node = parent.nextSibling;
      parent = parent.parentNode;
      position = position.slice(0, position.length - 1);
    }

    position[position.length - 1]++;
  }

  const template = {
    fragment,
    parts
  };

  templatesMap.set(strings, template);

  return template;
}
