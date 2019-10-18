const RANDOM = Math.random()
  .toString(36)
  .substr(2, 4);

const PREFIX = 'mdst-';

export const MARK = PREFIX + 'm-' + RANDOM;
export const ATTR_MARK = PREFIX + 'a-' + RANDOM;
export const OPEN_MARK = PREFIX + 'o-' + RANDOM;
export const CLOSE_MARK = PREFIX + 'c-' + RANDOM;
export const MARK_COMMENT = '<!--' + MARK + '-->';

export const TEMPLATE_INSTANCE_KEY = '__mdst_' + RANDOM;
