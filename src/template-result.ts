import {
  PLACEHOLDER_MARK,
  ATTR_MARK,
  PLACEHOLDER_COMMENT,
  ATTR_NUM_SEPARATOR,
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
  let tagProcessed = tag.replace(attrRegEx, function (attr, p1) {
    return p1 + '=' + ATTR_MARK + ATTR_NUM_SEPARATOR + num++;
  });

  if (tagProcessed !== tag) {
    tagProcessed = tagProcessed.replace(/<[^\s\n]+/, '$& ' + ATTR_MARK);
  }

  return tagProcessed;
}

export interface TemplateResult {
  strings: TemplateStringsArray;
  values: any[];
  keyed: (key: any) => this;
  isSVG?: boolean;
  key?: any;
}

export function getTemplateResultHTML(res: TemplateResult) {
  let html = res.strings.join(PLACEHOLDER_MARK).replace(tagRegEx, replaceTag);
  return html.replace(markRegEx, PLACEHOLDER_COMMENT);
}

export function isTemplateResult(res: any): res is TemplateResult {
  return res.strings;
}

export function isKeyedTemplateResult(res: any): res is TemplateResult {
  return res.strings && res.key;
}

export function createTemplateResult(
  strings: TemplateStringsArray,
  ...values: any[]
): TemplateResult {
  return { strings, values, keyed };
}

export function createSVGTemplateResult(
  strings: TemplateStringsArray,
  ...values: any[]
): TemplateResult {
  return { strings, values, isSVG: true, keyed };
}

function keyed(this: TemplateResult, key: any) {
  this.key = key;
  return this;
}
