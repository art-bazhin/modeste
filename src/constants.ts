const RANDOM = Math.random()
  .toString(36)
  .substr(2, 4);

export const MARK = 'm' + RANDOM;
export const ATTR_MARK = 'a' + RANDOM;
export const MARK_COMMENT = '<!--' + MARK + '-->';
export const OPEN_MARK = 'o' + RANDOM;
export const CLOSE_MARK = 'c' + RANDOM;

export const TEMPLATE_INSTANCE_KEY = '__mdstTemplateInstance';
