import {
  PLACEHOLDER_MARK,
  ATTR_MARK,
  PLACEHOLDER_COMMENT,
  ATTR_NUM_SEPARATOR
} from './constants';

const markRegEx = new RegExp(PLACEHOLDER_MARK, 'gm');
const tagRegEx = /<[a-z][a-z\d-]*([^<>]|("[^"]*")|('[^']*'))*>/gm;
const attrRegEx = new RegExp(
  '([a-z][a-z\\d-]*)=((' +
    PLACEHOLDER_MARK +
    ')|("' +
    PLACEHOLDER_MARK +
    '")|(\'' +
    PLACEHOLDER_MARK +
    "'))",
  'gm'
);

function replaceTag(tag: string) {
  let num = 0;
  let tagProcessed = tag.replace(attrRegEx, function(attr, p1) {
    return p1 + '=' + ATTR_MARK + ATTR_NUM_SEPARATOR + num++;
  });

  if (tagProcessed !== tag) {
    tagProcessed = tagProcessed.replace(/<[^\s\n]+/, '$& ' + ATTR_MARK);
  }

  return tagProcessed;
}

export interface ITemplateResult {
  strings: TemplateStringsArray;
  values: any[];
  isSVG?: boolean;
}

export function getTemplateResultHTML(res: ITemplateResult) {
  let html = res.strings.join(PLACEHOLDER_MARK).replace(tagRegEx, replaceTag);
  return html.replace(markRegEx, PLACEHOLDER_COMMENT);
}

export function isTemplateResult(res: any): res is ITemplateResult {
  return !!(res && res.values && res.strings);
}

export function createTemplateResult(
  strings: TemplateStringsArray,
  ...values: any[]
): ITemplateResult {
  return { strings, values };
}

export function createSVGTemplateResult(
  strings: TemplateStringsArray,
  ...values: any[]
): ITemplateResult {
  return { strings, values, isSVG: true };
}
