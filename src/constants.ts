const RANDOM = Math.random()
  .toString(36)
  .substr(2, 4);

export const MARK = 'mdst-' + RANDOM;
export const PLACEHOLDER_MARK = MARK + '-ph';
export const ATTR_MARK = MARK + '-attr';
export const ATTR_NUM_SEPARATOR = '_';
export const PLACEHOLDER_COMMENT = '<!--' + PLACEHOLDER_MARK + '-->';

export const TEMPLATE_RESULT = 1;
export const STRING = 2;

export const NODE_PART = 1;
export const ATTR_PART = 2;
export const EVENT_PART = 3;
export const REF_PART = 4;

export const REF_ATTR_NAME = 'ref';
