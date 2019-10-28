import { PLACEHOLDER_MARK, ATTR_MARK, PLACEHOLDER_COMMENT } from './constants';

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

export interface ITemplateResult {
  strings: TemplateStringsArray;
  values: any[];
}

export function getTemplateResultHTML(res: ITemplateResult) {
  let html = res.strings.join(PLACEHOLDER_MARK);

  html = html.replace(tagRegEx, function(tag) {
    let tagProcessed = tag.replace(attrRegEx, '$1=' + ATTR_MARK);

    if (tagProcessed !== tag) {
      tagProcessed = tagProcessed.replace(
        ATTR_MARK,
        ATTR_MARK + ' ' + ATTR_MARK
      );
    }

    return tagProcessed;
  });

  return html.replace(markRegEx, PLACEHOLDER_COMMENT);
}

export function isTemplateResult(res: any): res is ITemplateResult {
  return !!(res && res.values && res.strings);
}

export function html(
  strings: TemplateStringsArray,
  ...values: any[]
): ITemplateResult {
  return { strings, values };
}
