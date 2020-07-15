import { TemplateResult } from './template-result';
import { HookedResult } from './hooks';

export function keyed(res: TemplateResult | HookedResult<any>, key: any) {
  res.key = key;
  return res;
}
