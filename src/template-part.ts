import {
  ATTR_MARK,
  NODE_PART_ID,
  ATTR_PART_ID,
  EVENT_PART_ID,
  REF_PART_ID
} from './constants';

export interface ITemplatePart {
  name?: string;
  type: number;
  position: number[];
}

export function getTemplatePartsFromElement(
  node: HTMLElement,
  position: number[]
): ITemplatePart[] {
  const parts: ITemplatePart[] = [];
  const attrs = node.attributes;

  for (let i = 0; i < attrs.length; i++) {
    if (attrs[i].textContent === ATTR_MARK) {
      let part: ITemplatePart = {
        type: ATTR_PART_ID,
        position: position.slice()
      };

      const attrName = attrs[i].name;

      if (attrName[0] === 'o' && attrName[1] === 'n') {
        part.type = EVENT_PART_ID;
        part.name = attrName.substr(2);
      } else if (attrName === 'mdst-ref') {
        part.type = REF_PART_ID;
      } else {
        part.name = attrName;
      }

      node.removeAttribute(attrName);
      i--;

      parts.push(part);
    }
  }

  node.removeAttribute(ATTR_MARK);

  return parts;
}
