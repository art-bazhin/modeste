import { TEMPLATE_INSTANCE_KEY } from './constants';
import { ITemplateResult, isTemplateResult } from './template-result';
import { ITemplatePart } from './template-part';
import { getTemplate } from './template';

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
    const value = values[i];
    const node = nodes[i];

    if (part.attr) {
      processAttr(part.attr, value, node);
    } else if (part.event) {
      processEvent(part.event, value, node);
    } else {
      if (value instanceof Array) {
        value.forEach(el => {
          insertBefore(el, nodes[i]);
        });
      } else {
        insertBefore(value, nodes[i]);
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

export function updateTemplateInstance(
  instance: ITemplateInstance,
  values: unknown[]
) {
  // const parts = instance.parts;
  // const nodes = instance.nodes;
  // const oldValues = instance.values;
  // values.forEach((value, i) => {
  //   if (value === oldValues[i]) return;
  //   let part = parts[i];
  //   if (part.attr) {
  //     processAttr(part, values[i], nodes[i]);
  //   } else if (part.event) {
  //     processEvent(part, values[i], nodes[i]);
  //   } else {
  //     let parent = nodes[i].parentElement as Node;
  //     let value = values[i];
  //     if (value instanceof Array) {
  //       value.forEach(el => {
  //         let node = createNode(el);
  //         node && parent.insertBefore(node, nodes[i]);
  //       });
  //     } else {
  //       let node = createNode(value);
  //       node && parent.insertBefore(node, nodes[i]);
  //     }
  //   }
  // });
}

function processAttr(attr: string, value: unknown, node: Node) {
  const target = node as HTMLElement;
  if (value === true) {
    target.setAttribute(attr, '');
  } else if (value === false) {
    target.removeAttribute(attr);
  } else {
    target.setAttribute(attr, '' + value);
  }
}

function processEvent(event: string, value: unknown, node: Node) {
  const target = node as any;
  target.removeAttribute(event);
  target[event] = value;
}

function getNodeFromPosition(
  position: number[],
  parent: Node,
  level = 0
): Node {
  const child = parent.childNodes[position[level]];

  if (position.length - 1 === level) return child;
  return getNodeFromPosition(position, child, level + 1);
}

function insertBefore(value: any, refChild: Node) {
  const parent = refChild.parentElement!;

  if (isTemplateResult(value)) {
    const instance = getTemplateInstance(value);
    parent.insertBefore(instance.fragment, refChild);
    (parent.previousSibling as any)[TEMPLATE_INSTANCE_KEY] = instance;
  } else {
    parent.insertBefore(document.createTextNode('' + value), refChild);
  }
}
