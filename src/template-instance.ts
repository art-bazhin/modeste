import {
  ATTR_PART,
  EVENT_PART,
  REF_PART,
  NODE_PART,
  REF_ATTR_NAME
} from './constants';
import { TemplateResult, isKeyedTemplateResult } from './template-result';
import { TemplatePart } from './template-part';
import { getTemplate, Template } from './template';
import {
  insertBefore,
  updateChild,
  getNodeFromPosition,
  removeNodes
} from './dom';

export type TemplateInstanceChild = TemplateInstance | HTMLElement | Text;

type ChildrenMap = Map<any, TemplateInstanceChild>;
type ChildrenArray = TemplateInstanceChild[];

interface TemplateInstanceChildrenArrays {
  [key: number]: ChildrenArray;
}

interface TemplateInstanceChildrenMaps {
  [key: number]: ChildrenMap | null;
}

export function isTemplateInstance(value: any): value is TemplateInstance {
  return value.dynamicNodes;
}

export interface TemplateInstance {
  template: Template;
  fragment: DocumentFragment;
  parts: TemplatePart[];
  values: any[];
  dynamicNodes: Node[];
  firstNode: Node;
  lastNode: Node;
  childrenArrays: TemplateInstanceChildrenArrays;
  childrenMaps: TemplateInstanceChildrenMaps;
}

export function createTemplateInstance(res: TemplateResult): TemplateInstance {
  const template = getTemplate(res);
  const parts = template.parts;
  const values = res.values;
  const fragment = template.fragment.cloneNode(true) as DocumentFragment;
  const dynamicNodes = parts.map(part =>
    getNodeFromPosition(part.position, fragment)
  );
  const firstNode = fragment.firstChild as any;
  const lastNode = fragment.lastChild as any;

  const childrenArrays: TemplateInstanceChildrenArrays = {};
  const childrenMaps: TemplateInstanceChildrenMaps = {};

  const instance = {
    template,
    fragment,
    dynamicNodes,
    values,
    parts,
    firstNode,
    lastNode,
    childrenArrays,
    childrenMaps
  };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const value = values[i];
    const node = dynamicNodes[i] as Element;

    switch (part.type) {
      case ATTR_PART:
        processAttr(part.name!, value, node);
        break;
      case EVENT_PART:
        processEvent(part.name!, node, instance, i);
        break;
      case REF_PART:
        processRef(value, node, true);
        break;
      default:
        const arr = valueToArray(value);

        const c: TemplateInstanceChild[] = [];
        let cm: ChildrenMap | null = null;

        let isKeyed = arr[0]?.key;

        for (let i = 0; i < arr.length; i++) {
          const item = arr[i];
          const child = insertBefore(item, node);

          c.push(child);

          if (isKeyed && isKeyedTemplateResult(item)) {
            if (!cm) cm = new Map<any, TemplateInstanceChild>();
            if (cm.has(item.key)) isKeyed = false;
            else cm.set(item.key, child);
          } else isKeyed = false;
        }

        childrenArrays[i] = c;
        childrenMaps[i] = isKeyed ? cm : null;
    }
  }

  return instance;
}

export function updateTemplateInstance(
  instance: TemplateInstance,
  values: any[]
): TemplateInstance {
  const parts = instance.template.parts;
  const instanceChildrenArrays = instance.childrenArrays;
  const instanceChildrenMaps = instance.childrenMaps;

  for (let i = 0; i < parts.length; i++) {
    const value = values[i];
    const oldValue = instance.values[i];

    if (value === oldValue) continue;

    const node = instance.dynamicNodes[i] as Element;
    const part = parts[i];

    switch (part.type) {
      case ATTR_PART:
        processAttr(part.name!, value, node);
        break;
      case REF_PART:
        processRef(value, node);
        break;
      case NODE_PART:
        const valueArray = valueToArray(value);
        const oldValueArray = valueToArray(oldValue);

        const childrenArray: ChildrenArray = [];
        let childrenMap: ChildrenMap = new Map();

        const oldChildrenArray = instanceChildrenArrays[i];
        const oldChildrenMap = instanceChildrenMaps[i];

        let isKeyed =
          valueArray.length &&
          valueArray.every(value => {
            if (!isKeyedTemplateResult(value)) return false;
            if (childrenMap.has(value.key)) return false;
            childrenMap.set(value.key, null as any);
            return true;
          });

        if (!oldChildrenMap || !isKeyed) {
          const min = Math.min(valueArray.length, oldValueArray.length);
          const max = Math.max(valueArray.length, oldValueArray.length);
          const dif = max - min;

          const newArrayIsBigger = valueArray.length > oldValueArray.length;
          const newArrayIsSmaller = dif && !newArrayIsBigger;

          for (let i = 0; i < max; i++) {
            const item = valueArray[i];
            let child: TemplateInstanceChild;

            if (i < min)
              child = updateChild(
                valueArray[i],
                oldValueArray[i],
                oldChildrenArray[i]
              );
            else if (newArrayIsBigger)
              child = insertBefore(valueArray[i], node);
            else break;

            childrenArray.push(child);

            if (isKeyed) childrenMap.set(item.key, child);
          }

          if (newArrayIsSmaller) {
            const start = oldChildrenArray[min];
            removeNodes(
              isTemplateInstance(start) ? start.firstNode : start,
              node.previousSibling!
            );
          }

          instanceChildrenArrays[i] = childrenArray;
          instanceChildrenMaps[i] = isKeyed ? childrenMap : null;
        }
    }
  }

  instance.values = values;

  console.log(instance);
  return instance;
}

function valueToArray(value: any) {
  if (Array.isArray(value)) return value.length ? (value as any[]) : [''];
  return [value];
}

function processAttr(attr: string, value: any, node: Element) {
  switch (value) {
    case true:
      return node.setAttribute(attr, '');
    case false:
    case null:
    case undefined:
      return node.removeAttribute(attr);
    default:
      if (attr === 'value') (node as any).value = value;
      node.setAttribute(attr, value as string);
  }
}

function processEvent(
  event: string,
  node: Node,
  instance: TemplateInstance,
  index: number
) {
  node.addEventListener(event, (e: any) => {
    if (instance.values[index]) instance.values[index].bind(node)(e);
  });

  (node as Element).removeAttribute('on' + event);
}

function processRef(value: any, node: Element, isFirstRender?: boolean) {
  if (value) value(node);
  if (isFirstRender) node.removeAttribute(REF_ATTR_NAME);
}
