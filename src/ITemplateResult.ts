import { MARK, ATTR_COMMENT, ATTR_MARK, ELEM_COMMENT } from './constants';

const markRegEx = new RegExp(MARK, 'gm');
const tagRegEx = /<[a-z][a-z\d-]*([^<>]|("[^"]*")|('[^']*'))*>/gm;
const attrRegEx = new RegExp(
  '([a-z][a-z\\d-]*)=((' + MARK + ')|("' + MARK + '")|(\'' + MARK + "'))",
  'gm'
);

export interface ITemplateResult {
  strings: TemplateStringsArray;
  values: unknown[];
}

export function getTemplateResultHTML(res: ITemplateResult) {
  let html = res.strings.join(MARK);

  html = html.replace(tagRegEx, function(tag) {
    let tagProcessed = tag.replace(attrRegEx, '$1=' + ATTR_MARK);
    if (tagProcessed !== tag) tagProcessed = ATTR_COMMENT + tagProcessed;

    return tagProcessed;
  });

  return html.replace(markRegEx, ELEM_COMMENT);
}

export function isTemplateResult(res: any): res is ITemplateResult {
  return !!(res.values && res.strings);
}

export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): ITemplateResult {
  return { strings, values };
}
