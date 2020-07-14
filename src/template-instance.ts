import {
  ATTR_PART,
  EVENT_PART,
  REF_PART,
  NODE_PART,
  REF_ATTR_NAME,
} from './constants';
import { TemplateResult, isKeyedTemplateResult } from './template-result';
import { TemplatePart } from './template-part';
import { getTemplate, Template } from './template';
import {
  insertBefore,
  updateChild,
  getNodeFromPosition,
  removeNodes,
} from './dom';
import { warning } from './utils';
import {
  HookedResult,
  isHookedResult,
  getHookedTemplateResult,
  removeInstanceFromRenderQueue,
} from './hooks';

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
  state: any[];
  effects: (() => void)[];
  desctructor?: () => void;
}

export function createTemplateInstance(
  result: TemplateResult | HookedResult<any>
): TemplateInstance {
  const instance = {
    state: [] as any[],
    effects: [] as any[],
  } as TemplateInstance;

  let res: TemplateResult;

  if (isHookedResult(result)) {
    res = getHookedTemplateResult(result, instance);
  } else {
    res = result;
  }

  const template = getTemplate(res);
  const parts = template.parts;
  const values = res.values;
  const fragment = template.fragment.cloneNode(true) as DocumentFragment;
  const dynamicNodes = parts.map((part) =>
    getNodeFromPosition(part.position, fragment)
  );
  const firstNode = fragment.firstChild as any;
  const lastNode = fragment.lastChild as any;

  const childrenArrays: TemplateInstanceChildrenArrays = {};
  const childrenMaps: TemplateInstanceChildrenMaps = {};

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

            if (cm.has(item.key)) {
              isKeyed = false;
              showKeyDuplicaeWarning(item);
            } else cm.set(item.key, child);
          } else isKeyed = false;
        }

        childrenArrays[i] = c;
        childrenMaps[i] = isKeyed ? cm : null;
    }
  }

  instance.template = template;
  instance.fragment = fragment;
  instance.dynamicNodes = dynamicNodes;
  instance.values = values;
  instance.parts = parts;
  instance.firstNode = firstNode;
  instance.lastNode = lastNode;
  instance.childrenArrays = childrenArrays;
  instance.childrenMaps = childrenMaps;

  firstNode.__MDST_INSTANCE__ = instance;

  return instance as TemplateInstance;
}

export function updateTemplateInstance(
  instance: TemplateInstance,
  result?: TemplateResult | HookedResult<any>
): TemplateInstance {
  let values: any[];

  if (!result) {
    values = instance.values;
  } else if (isHookedResult(result)) {
    values = getHookedTemplateResult(result, instance).values;
  } else {
    values = result.values;
  }

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
          valueArray.every((value) => {
            if (!isKeyedTemplateResult(value)) return false;

            if (childrenMap.has(value.key)) {
              showKeyDuplicaeWarning(value);
              return false;
            }

            childrenMap.set(value.key, null as any);
            return true;
          });

        if (oldChildrenMap && isKeyed) {
          console.log('KEYED RENDER', oldChildrenMap);
        } else {
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

  removeInstanceFromRenderQueue(instance);

  return instance;
}

export function runTemplateInstanceDestructors(instance: TemplateInstance) {
  if (instance.desctructor) instance.desctructor();

  const arrays = instance.childrenArrays;

  Object.keys(arrays).forEach((i: any) => {
    arrays[i].forEach((child) => {
      if (isTemplateInstance(child)) runTemplateInstanceDestructors(child);
    });
  });
}

function runTemplateInstanceEffects(instance: TemplateInstance) {}

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

function showKeyDuplicaeWarning(res: TemplateResult) {
  warning('Key duplicate was found. Switched to non-keyed render.', res);
}
