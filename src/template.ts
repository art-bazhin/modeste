import { MARK, ATTR_MARK, CLOSE_MARK, OPEN_MARK } from './constants';
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

  fragment.appendChild(document.createComment(CLOSE_MARK));
  fragment.insertBefore(document.createComment(OPEN_MARK), fragment.firstChild);

  let node = fragment.firstChild as Node | null;
  let position = [0];
  let parts: ITemplatePart[] = [];

  while (node) {
    let parent = node.parentNode;

    if (isCommentNode(node) && node.textContent === MARK) {
      // const placeholder = document.createTextNode('');

      // node.parentNode!.replaceChild(placeholder, node);
      // node = placeholder.nextSibling;

      parts.push({ position: position.slice() });
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

    if (!node && parent && parent.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      node = parent.nextSibling;
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
