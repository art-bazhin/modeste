import { TEMPLATE_INSTANCE_KEY } from './constants';
import { ITemplateResult, isTemplateResult } from './ITemplateResult';
import { ITemplatePart } from './ITemplatePart';
import { getTemplate } from './ITemplate';

export interface ITemplateInstance {
  fragment: DocumentFragment;
  parts: ITemplatePart[];
  values: unknown[];
  nodes: Node[];
}

export function getTemplateInstance(res: ITemplateResult): ITemplateInstance {
  const template = getTemplate(res);
  const parts = template.parts;
  const values = res.values;
  const fragment = template.fragment.cloneNode(true) as DocumentFragment;
  const nodes = parts.map(part => getNodeFromPosition(part.position, fragment));

  parts.forEach((part, i) => {
    if (part.attr) {
      let target = nodes[i].nextSibling as HTMLElement;
      if (values[i] === true) {
        target.setAttribute(part.attr, '');
      } else if (values[i] === false) {
        target.removeAttribute(part.attr);
      } else {
        target.setAttribute(part.attr, '' + values[i]);
      }
    } else if (part.event) {
      let target = nodes[i].nextSibling as any;
      target.removeAttribute(part.event);
      target[part.event] = values[i];
    } else {
      let parent = nodes[i].parentElement as Node;
      let value = values[i];

      if (value instanceof Array) {
        value.forEach(el => {
          let node = createNode(el);
          node && parent.insertBefore(node, nodes[i]);
        });
      } else {
        let node = createNode(value);
        node && parent.insertBefore(node, nodes[i]);
      }
    }
  });

  const instance = {
    fragment,
    nodes,
    values,
    parts
  };

  (fragment.lastChild as any)[TEMPLATE_INSTANCE_KEY] = instance;

  return instance;
}

export function updateTemplateInstance(instance: ITemplateInstance) {}

function getNodeFromPosition(
  position: number[],
  parent: Node,
  level = 0
): Node {
  const child = parent.childNodes[position[level]];

  if (position.length - 1 === level) return child;
  return getNodeFromPosition(position, child, level + 1);
}

function createNode(value: any) {
  return isTemplateResult(value)
    ? getTemplateInstance(value).fragment
    : document.createTextNode('' + value);
}
