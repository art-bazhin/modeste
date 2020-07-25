import { PLACEHOLDER_MARK, ATTR_MARK, NODE_PART } from './constants';
import { TemplateResult, getTemplateResultHTML } from './template-result';
import { TemplatePart, getTemplatePartsFromElement } from './template-part';
import { isCommentNode, isElementNode } from './dom';

const templatesMap = new Map<TemplateStringsArray, Template>();

export interface Template {
  fragment: DocumentFragment;
  parts: TemplatePart[];
}

export function getTemplate(res: TemplateResult): Template {
  const { strings } = res;

  if (templatesMap.has(strings)) return templatesMap.get(strings) as Template;

  const templateElement = document.createElement('template');
  let html = getTemplateResultHTML(res);

  if (res.isSVG) html = '<svg>' + html + '</svg>';
  templateElement.innerHTML = html;

  const fragment = templateElement.content;

  if (isPlaceholder(fragment.firstChild) || !fragment.firstChild)
    fragment.insertBefore(createMarkNode(), fragment.firstChild);

  if (res.isSVG) {
    const svgRoot = fragment.firstChild!;

    while (svgRoot.firstChild) {
      fragment.appendChild(svgRoot.firstChild);
    }

    fragment.removeChild(svgRoot);
  }

  let node = fragment.firstChild as Node | null;
  let position = [0];
  let parts: TemplatePart[] = [];

  while (node) {
    let parent = node.parentNode;

    if (isPlaceholder(node)) {
      const mark = createMarkNode();

      parts.push({ type: NODE_PART, position: position.slice() });
      node.parentNode!.replaceChild(mark, node);
      node = mark.nextSibling;
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
    parts,
  };

  templatesMap.set(strings, template);

  return template;
}

function createMarkNode() {
  if ((document as any).documentMode) return document.createComment(''); // IE
  return document.createTextNode('');
}

function isPlaceholder(node: Node | null) {
  return node && isCommentNode(node) && node.textContent === PLACEHOLDER_MARK;
}
