import {
  ATTR_MARK,
  ATTR_PART,
  EVENT_PART,
  REF_PART,
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

export interface TemplatePart {
  name?: string;
  type: number;
  position: number[];
}

export function getTemplatePartsFromElement(
  node: HTMLElement,
  position: number[]
): TemplatePart[] {
  const parts: TemplatePart[] = [];
  const attrs = getAttributes(node);

  for (let i = 0; i < attrs.length; i++) {
    let part: TemplatePart = {
      type: ATTR_PART,
      position: position.slice()
    };

    const attrName = attrs[i].name;

    if (attrName[0] === 'o' && attrName[1] === 'n') {
      part.type = EVENT_PART;
      part.name = attrName.substr(2);
    } else if (attrName === REF_ATTR_NAME) {
      part.type = REF_PART;
    } else {
      part.name = attrName;
    }

    parts.push(part);
  }

  node.removeAttribute(ATTR_MARK);

  return parts;
}
