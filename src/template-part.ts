import {
  ATTR_MARK,
  ATTR_PART_ID,
  EVENT_PART_ID,
  REF_PART_ID,
  ATTR_NUM_SEPARATOR,
  REF_ATTR_NAME
} from './constants';

function getAttributes(node: Element) {
  const attrs = node.attributes;
  const result: Attr[] = [];

  for (let i = 0; i < attrs.length; i++) {
    const value = attrs[i].value;

    if (value.indexOf(ATTR_MARK) === 0) {
      result[+value.split(ATTR_NUM_SEPARATOR)[1]] = attrs[i];
    }
  }

  return result.filter(el => el);
}

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
  const attrs = getAttributes(node);

  for (let i = 0; i < attrs.length; i++) {
    let part: ITemplatePart = {
      type: ATTR_PART_ID,
      position: position.slice()
    };

    const attrName = attrs[i].name;

    if (attrName[0] === 'o' && attrName[1] === 'n') {
      part.type = EVENT_PART_ID;
      part.name = attrName.substr(2);
    } else if (attrName === REF_ATTR_NAME) {
      part.type = REF_PART_ID;
    } else {
      part.name = attrName;
    }

    parts.push(part);
  }

  node.removeAttribute(ATTR_MARK);

  return parts;
}
