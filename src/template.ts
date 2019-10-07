import { OPEN_MARK, CLOSE_MARK, ATTR_MARK, ELEM_MARK } from './constants';
import { ITemplateResult, getTemplateResultHTML } from './template-result';
import { ITemplatePart, getTemplatePartsFromComment } from './template-part';

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

    switch (node.nodeType) {
      case Node.COMMENT_NODE:
        parts = parts.concat(
          getTemplatePartsFromComment(node as Comment, position)
        );

        if (node.textContent === ELEM_MARK || node.textContent === ATTR_MARK) {
          let placeholder = document.createTextNode('');
          (node.parentNode as Node).replaceChild(placeholder, node);
          node = placeholder;
        }

        node = node.nextSibling;
        break;
      case Node.ELEMENT_NODE:
        if (node.childNodes.length) {
          node = node.childNodes[0];
          position.push(-1);
        } else {
          node = node.nextSibling;
        }
        break;
      default:
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
