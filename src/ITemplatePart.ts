import { ATTR_MARK, ELEM_MARK } from './constants';

export interface ITemplatePart {
  attr?: string;
  event?: string;
  position: number[];
}

export function getTemplatePartsFromComment(
  comment: Comment,
  position: number[]
): ITemplatePart[] {
  const parts: ITemplatePart[] = [];

  switch (comment.textContent) {
    case ATTR_MARK:
      const node = comment.nextSibling as HTMLElement;
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

      break;

    case ELEM_MARK:
      parts.push({ position: position.slice() });

      break;
  }

  return parts;
}
