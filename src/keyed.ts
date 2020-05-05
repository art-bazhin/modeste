import { TemplateResult } from './template-result';

export function keyed(res: TemplateResult, key: any) {
  res.key = key;
  return res;
}
