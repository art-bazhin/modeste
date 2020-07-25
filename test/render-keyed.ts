import { render, RenderResult, html, keyed } from '../src/main';

const renderPromise = (result: RenderResult, container: Element) => {
  return new Promise((resolve) => {
    render(result, container, resolve);
  });
};

const renderFn = (arr: any[]) => html`${arr}`;
const mapFn = (el: any) => keyed(html`<div id=${'el' + el}>${el}</div>`, el);

describe('render function', () => {
  let container: Element;

  beforeAll(() => {
    document.body.innerHTML = '<div id="app"></div>';
    container = document.querySelector('#app')!;
  });

  it('renders keyed array of template results', () => {
    const array = [0, 1, 2, 3, 4];

    return renderPromise(renderFn(array.map(mapFn)), container).then(() => {
      const children = container.children;

      expect(children[0].textContent).toBe('0');
      expect(children[1].textContent).toBe('1');
      expect(children[2].textContent).toBe('2');
      expect(children[3].textContent).toBe('3');
      expect(children[4].textContent).toBe('4');
    });
  });

  it('correctly updates and reorder existed keyed nodes', () => {
    const old0 = document.querySelector('#el0')!;
    const old1 = document.querySelector('#el1')!;
    const old2 = document.querySelector('#el2')!;
    const old3 = document.querySelector('#el3')!;
    const old4 = document.querySelector('#el4')!;
    const array = [4, 3, 5, 1, 2, 0];

    return renderPromise(renderFn(array.map(mapFn)), container).then(() => {
      const children = container.children;

      const new0 = document.querySelector('#el0')!;
      const new1 = document.querySelector('#el1')!;
      const new2 = document.querySelector('#el2')!;
      const new3 = document.querySelector('#el3')!;
      const new4 = document.querySelector('#el4')!;

      expect(children[0].textContent).toBe('4');
      expect(children[1].textContent).toBe('3');
      expect(children[2].textContent).toBe('5');
      expect(children[3].textContent).toBe('1');
      expect(children[4].textContent).toBe('2');
      expect(children[5].textContent).toBe('0');

      expect(new0).toBe(old0);
      expect(new1).toBe(old1);
      expect(new2).toBe(old2);
      expect(new3).toBe(old3);
      expect(new4).toBe(old4);
    });
  });

  it('properly cleans rendered array of values', () => {
    let array: any[] = [];

    return renderPromise(renderFn(array), container).then(() => {
      expect(container.innerHTML.trim()).toBe('');
    });
  });
});
