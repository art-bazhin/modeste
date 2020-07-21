import {
  PLACEHOLDER_MARK,
  ATTR_MARK,
  PLACEHOLDER_COMMENT,
  ATTR_NUM_SEPARATOR,
  PROP_MARK,
} from './constants';

const markRegEx = new RegExp(PLACEHOLDER_MARK, 'gm');
const tagRegEx = /<[a-z][a-z\d-]*([^<>]|("[^"]*")|('[^']*'))*>/gm;

const attrRegEx = new RegExp(
  '((\\.[a-zA-Z_$][0-9a-zA-Z_$]*)|([a-z][a-z\\d-]*))[\\s\\n]*=[\\s\\n]*((' +
    PLACEHOLDER_MARK +
    '))',
  'gm'
);

function replaceTag(tag: string) {
  let num = 0;

  let tagProcessed = tag.replace(attrRegEx, function (attr, p1) {
    if (p1[0] === '.') {
      const val = '"' + p1.substr(1) + '"';
      return PROP_MARK + ATTR_NUM_SEPARATOR + num++ + '=' + val;
    }

    const val = '"' + ATTR_MARK + ATTR_NUM_SEPARATOR + num++ + '"';
    return p1 + '=' + val;
  });

  if (tagProcessed !== tag) {
    tagProcessed = tagProcessed.replace(/<[^\s\n]+/, '$& ' + ATTR_MARK);
  }

  return tagProcessed;
}

export interface TemplateResult {
  strings: TemplateStringsArray;
  values: any[];
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
  return isTemplateResult(res) && res.key;
}

export function createTemplateResult(
  strings: TemplateStringsArray,
  ...values: any[]
): TemplateResult {
  return { strings, values };
}

export function createSVGTemplateResult(
  strings: TemplateStringsArray,
  ...values: any[]
): TemplateResult {
  return { strings, values, isSVG: true };
}
