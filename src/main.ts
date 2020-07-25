import { TemplateResult } from './template-result';
import { HookedResult } from './hooks';

export { createTemplateResult as html } from '../src/template-result';
export { createSVGTemplateResult as svg } from '../src/template-result';
export { render } from '../src/render';
export { keyed } from '../src/keyed';
export { hooked } from './hooks';
export { useState } from './hooks';
export { useEffect } from './hooks';
export { useLayoutEffect } from './hooks';

export type RenderResult = TemplateResult | HookedResult<any>;
