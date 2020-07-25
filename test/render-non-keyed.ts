import { render, RenderResult, html, hooked } from '../src/main';

const renderPromise = (result: RenderResult, container: Element) => {
  return new Promise((resolve) => {
    render(result, container, resolve);
  });
};

const renderFn = (arr: any[]) => html`${arr}`;
const mapFn = (el: any) => html`<div id=${'el' + el}>${el}</div>`;

describe('render function', () => {
  let container: Element;

  beforeAll(() => {
    document.body.innerHTML = '<div id="app"></div>';
    container = document.querySelector('#app')!;
  });

  it('renders array of strings and numbers', () => {
    let array = ['first', 'second', 123, 'fourth', 567];

    return renderPromise(renderFn(array), container).then(() => {
      expect(container.textContent).toBe(array.join(''));
    });
  });

  it('renders array of RenderResult items', () => {
    let array = [
      html`<div>first</div>`,
      html`<div>second</div>`,
      hooked(() => html`<p>third</p>`)(),
      html`<span>fourth</span>`,
    ];

    return renderPromise(renderFn(array), container).then(() => {
      const children = container.children;

      expect(children[0].tagName).toBe('DIV');
      expect(children[0].textContent).toBe('first');

      expect(children[1].tagName).toBe('DIV');
      expect(children[1].textContent).toBe('second');

      expect(children[2].tagName).toBe('P');
      expect(children[2].textContent).toBe('third');

      expect(children[3].tagName).toBe('SPAN');
      expect(children[3].textContent).toBe('fourth');
    });
  });

  it('renders array of items of different types', () => {
    let array = [
      'first',
      html`<div>second</div>`,
      true,
      false,
      hooked(() => html`<p>third</p>`)(),
      4,
    ];

    return renderPromise(renderFn(array), container).then(() => {
      const children = container.children;

      expect(children[0].tagName).toBe('DIV');
      expect(children[0].textContent).toBe('second');

      expect(children[1].tagName).toBe('P');
      expect(children[1].textContent).toBe('third');

      expect(container.textContent).toBe('firstsecondtruethird4');
    });
  });

  it('renders mapped array of values', () => {
    const array = [0, 1, 2, 3, 4];

    return renderPromise(renderFn(array.map(mapFn)), container).then(() => {
      const children = container.children;

      expect(children[0].tagName).toBe('DIV');
      expect(children[0].textContent).toBe('0');

      expect(children[1].tagName).toBe('DIV');
      expect(children[1].textContent).toBe('1');

      expect(children[0].tagName).toBe('DIV');
      expect(children[2].textContent).toBe('2');

      expect(children[3].tagName).toBe('DIV');
      expect(children[3].textContent).toBe('3');

      expect(children[4].tagName).toBe('DIV');
      expect(children[4].textContent).toBe('4');
    });
  });

  it('correctly updates and reuse existed nodes', () => {
    const oldFirst = document.querySelector('#el0')!;
    const array = [5, 4, 3];

    return renderPromise(renderFn(array.map(mapFn)), container).then(() => {
      const newFirst = document.querySelector('#el5')!;

      expect(newFirst.tagName).toBe('DIV');
      expect(newFirst.textContent).toBe('5');
      expect(newFirst).toBe(oldFirst);
    });
  });

  it('properly cleans rendered array of values', () => {
    let array: any[] = [];

    return renderPromise(renderFn(array), container).then(() => {
      expect(container.innerHTML.trim()).toBe('');
    });
  });
});
