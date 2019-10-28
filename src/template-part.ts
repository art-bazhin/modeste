import { ATTR_MARK } from './constants';

export interface ITemplatePart {
  attr?: string;
  event?: string;
  position: number[];
}

export function getTemplatePartsFromElement(
  node: HTMLElement,
  position: number[]
): ITemplatePart[] {
  const parts: ITemplatePart[] = [];
  const attrs = node.attributes;

  for (let i = 0; i < attrs.length; i++) {
    let part: ITemplatePart = { position: position.slice() };

    if (attrs[i].textContent === ATTR_MARK) {
      const attrName = attrs[i].name;

      if (attrName.substr(0, 2) === 'on') {
        part.event = attrName;
      } else {
        part.attr = attrName;
      }

      parts.push(part);
    }
  }

  node.removeAttribute(ATTR_MARK);

  return parts;
}
