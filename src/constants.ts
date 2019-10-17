const RANDOM = Math.random()
  .toString(36)
  .substr(2, 3);

export const MARK = 'm' + RANDOM;
export const ATTR_MARK = 'a' + RANDOM;
export const MARK_COMMENT = '<!--' + MARK + '-->';

export const TEMPLATE_INSTANCE_START_VALUE = 1;
export const TEMPLATE_INSTANCE_KEY = '__mdst_' + RANDOM;
