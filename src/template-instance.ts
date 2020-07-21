import {
  ATTR_PART,
  EVENT_PART,
  REF_PART,
  NODE_PART,
  REF_ATTR_NAME,
  PROP_PART,
} from './constants';
import { TemplateResult, isKeyedTemplateResult } from './template-result';
import { TemplatePart } from './template-part';
import { getTemplate, Template } from './template';
import {
  insertBefore,
  updateChild,
  getNodeFromPosition,
  removeNodes,
  insertTemplateInstanceBefore,
} from './dom';
import { warning } from './utils';
import {
  HookedResult,
  isHookedResult,
  getHookedTemplateResult,
  isKeyedHookedResult,
} from './hooks';
import { removeInstanceFromRenderQueue } from './render';

export type TemplateInstanceChild = TemplateInstance | HTMLElement | Text;

type ChildrenMap = Map<any, TemplateInstance>;
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
  destructors: ((() => void) | void)[] | null;
}

export function createTemplateInstance(
  result: TemplateResult | HookedResult<any>
): TemplateInstance {
  const instance = {
    state: [] as any[],
    destructors: [] as any[],
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
      case PROP_PART:
        processProp(part.name!, value, node);
        break;
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
        const firstValue = values[0];

        const childrenArray: TemplateInstanceChild[] = [];
        let childrenMap: ChildrenMap | null = null;

        let isKeyed = firstValue?.key;

        for (let i = 0; i < arr.length; i++) {
          const item = arr[i];
          const child = insertBefore(item, node);

          childrenArray.push(child);

          if (
            isKeyed &&
            ((isKeyedTemplateResult(item) &&
              item.strings === firstValue.strings) ||
              (isKeyedHookedResult(item) &&
                item.getTemplateResult === firstValue.getTemplateResult))
          ) {
            if (!childrenMap) childrenMap = new Map<any, TemplateInstance>();

            if (childrenMap.has(item.key)) {
              isKeyed = false;
              showKeyDuplicateWarning(item);
            } else childrenMap.set(item.key, child as TemplateInstance);
          } else isKeyed = false;
        }

        childrenArrays[i] = childrenArray;
        childrenMaps[i] = isKeyed ? childrenMap : null;
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
  instance.destructors = [];

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
      case PROP_PART:
        processProp(part.name!, value, node);
        break;
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

        const oldFirstValue = oldValueArray[0];
        const firstValue = valueArray[0];

        let hasSameStart = true;

        let isKeyed =
          valueArray.length &&
          valueArray.every((value, i) => {
            const oldValue = oldValueArray[i];
            const isTemplateResult = isKeyedTemplateResult(value);
            const isHookedResult = isKeyedHookedResult(value);

            if (!isTemplateResult && !isHookedResult) return false;

            if (
              isTemplateResult &&
              (value as TemplateResult).strings !==
                (firstValue as TemplateResult).strings
            )
              return false;

            if (
              isHookedResult &&
              (value as HookedResult<any>).getTemplateResult !==
                (firstValue as HookedResult<any>).getTemplateResult
            )
              return false;

            if (childrenMap.has(value.key)) {
              showKeyDuplicateWarning(value);
              return false;
            }

            if (hasSameStart && oldValue && oldValue.key !== value.key)
              hasSameStart = false;

            childrenMap.set(value.key, null as any);
            return true;
          });

        const isTemplateChanged =
          isKeyed &&
          ((firstValue as TemplateResult).strings !==
            (oldFirstValue as TemplateResult).strings ||
            (firstValue as HookedResult<any>).getTemplateResult !==
              (oldFirstValue as HookedResult<any>).getTemplateResult);

        if (oldChildrenMap && isKeyed && !isTemplateChanged && !hasSameStart) {
          // Remove redundant nodes
          let removeStart: Node | null = null;
          let removeEnd: Node | null = null;

          oldChildrenMap.forEach((child, key) => {
            if (!childrenMap.has(key)) {
              if (!removeStart) removeStart = child.firstNode;
              removeEnd = child.lastNode;

              oldChildrenMap.delete(key);
            } else {
              if (removeStart && removeEnd) removeNodes(removeStart, removeEnd);
              removeStart = null;
              removeEnd = null;
            }
          });

          if (removeStart && removeEnd) removeNodes(removeStart, removeEnd);

          // Insert new nodes and replace old
          let w = 1;
          const weights = new Map<any, number>();
          oldChildrenMap.forEach((value, key) => weights.set(key, w++));

          const lis = getLISSet(Array.from(childrenMap.keys()), weights);
          let currentNode: Node = node;

          for (let i = valueArray.length - 1; i >= 0; i--) {
            const value: TemplateResult = valueArray[i];
            const key = value.key;
            let instance = oldChildrenMap.get(key);

            if (instance) updateTemplateInstance(instance, value);
            else instance = createTemplateInstance(value);

            if (!lis.has(key))
              insertTemplateInstanceBefore(instance, currentNode);
            currentNode = instance.firstNode;

            childrenArray.unshift(instance);
            childrenMap.set(key, instance);
          }
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

            if (isKeyed) childrenMap.set(item.key, child as TemplateInstance);
          }

          if (newArrayIsSmaller) {
            const start = oldChildrenArray[min];
            removeNodes(
              isTemplateInstance(start) ? start.firstNode : start,
              node.previousSibling!
            );
          }
        }

        instanceChildrenArrays[i] = childrenArray;
        instanceChildrenMaps[i] = isKeyed ? childrenMap : null;
    }
  }

  instance.values = values;

  removeInstanceFromRenderQueue(instance);

  return instance;
}

export function runTemplateInstanceDestructors(instance: TemplateInstance) {
  if (!instance.destructors) return;

  instance.destructors.forEach((destructor) => destructor && destructor());
  instance.destructors = null;

  const arrays = instance.childrenArrays;

  for (let key in arrays) {
    arrays[key].forEach((child) => {
      if (isTemplateInstance(child)) runTemplateInstanceDestructors(child);
    });
  }
}

// Get set of items from longest increasing subsequence
function getLISSet(arr: any[], weights: Map<any, number>) {
  const indexes: number[] = []; // indexes[i] is the index of last number of i-length IS
  const predecessors: number[] = []; // predecessors[i] is the index of element before indexes[i] in LIS

  let lisLength = 0;

  for (let i = 0; i < arr.length; i++) {
    // Binary search for the max length of IS with last number <= arr[i]
    let left = 1;
    let right = lisLength;
    let mid: number;

    const weight = weights.get(arr[i]);
    if (!weight) continue;

    while (left <= right) {
      mid = Math.ceil((left + right) / 2);

      if (weights.get(arr[indexes[mid]])! < weight) left = mid + 1;
      else right = mid - 1;
    }

    // After searching left is new length
    const newLength = left;

    predecessors[i] = indexes[newLength - 1];
    indexes[newLength] = i;

    if (newLength > lisLength) lisLength = newLength;
  }

  // Reconstruct the longest increasing subsequence
  const res = new Set<any>();
  let k = indexes[lisLength];

  for (let i = lisLength - 1; i >= 0; i--) {
    res.add(arr[k]);
    k = predecessors[k];
  }

  return res;
}

function valueToArray(value: any) {
  if (Array.isArray(value)) return value.length ? (value as any[]) : [''];
  return [value];
}

function processProp(name: string, value: any, node: Element) {
  (node as any)[name] = value;
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

function showKeyDuplicateWarning(res: TemplateResult | HookedResult<any>) {
  warning('Key duplicate was found. Switched to non-keyed render.', res);
}
