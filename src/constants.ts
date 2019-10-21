const RANDOM = Math.random()
  .toString(36)
  .substr(2, 4);

export const MARK = 'mdst-' + RANDOM;
export const PLACEHOLDER_MARK = MARK + '-ph';
export const ATTR_MARK = MARK + '-attr';
export const PLACEHOLDER_COMMENT = '<!--' + PLACEHOLDER_MARK + '-->';

export const TEMPLATE_INSTANCE_KEY = '__mdstTemplateInstance';
export const EVENTS_KEY = '__mdstEvents';
export const MARK_TYPE_KEY = '__mdstMarkType';

export enum MarkTypes {
  Open = 1,
  Close = 2
}
