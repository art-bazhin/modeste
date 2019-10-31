import {
  ATTR_MARK,
  NODE_PART_ID,
  ATTR_PART_ID,
  EVENT_PART_ID
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
    let part: ITemplatePart = {
      type: ATTR_PART_ID,
      position: position.slice()
    };

    if (attrs[i].textContent === ATTR_MARK) {
      const attrName = attrs[i].name;

      if (attrName[0] === 'o' && attrName[1] === 'n') {
        part.type = EVENT_PART_ID;
        part.name = attrName.substr(2);
        node.removeAttribute(attrName);
      } else {
        part.name = attrName;
      }

      parts.push(part);
    }
  }

  node.removeAttribute(ATTR_MARK);

  return parts;
}

export function isNodePart(part: ITemplatePart) {
  return part.type === NODE_PART_ID;
}

export function isAttrPart(part: ITemplatePart) {
  return part.type === ATTR_PART_ID;
}

export function isEventPart(part: ITemplatePart) {
  return part.type === EVENT_PART_ID;
}
