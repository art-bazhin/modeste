const RANDOM = Math.random()
  .toString(36)
  .substr(2, 4);

export const MARK = 'mdst-' + RANDOM;
export const PLACEHOLDER_MARK = MARK + '-ph';
export const ATTR_MARK = MARK + '-attr';
export const ATTR_NUM_SEPARATOR = '_';
export const PLACEHOLDER_COMMENT = '<!--' + PLACEHOLDER_MARK + '-->';

export const TEMPLATE_INSTANCE_KEY = '__mdstTemplateInstance';
export const EVENTS_KEY = '__mdstEvents';
export const MARK_TYPE_KEY = '__mdstMarkType';
export const NODE_REF_KEY = '__mdstNodeRef';

export const OPEN_MARK_ID = 1;
export const CLOSE_MARK_ID = 2;

export const TEXT_NODE_ID = 1;
export const TEMPLATE_NODE_ID = 2;

export const NODE_PART_ID = 1;
export const ATTR_PART_ID = 2;
export const EVENT_PART_ID = 3;
export const REF_PART_ID = 4;

export const REF_ATTR_NAME = 'mdst-ref';
