import { render, RenderResult, html } from '../src/main';

const renderPromise = (result: RenderResult, container: Element) => {
  return new Promise((resolve) => {
    render(result, container, resolve);
  });
};

let container: Element;
let count = 0;

const mockClick = jest.fn(() => renderPromise(app(), container));

const app = () => {
  const handleClick = () => {
    count++;
    mockClick();
  };

  return html`
    <p id="test" class=${'test class'} .someProp=${'prop assign test'}>
      Test ${'string'}
    </p>
    <div>${count}</div>
    <button onclick=${handleClick}>Click</button>
  `;
};

const quotesTest = () => {
  return html`
    <div
      data-no-quotes=${'no'}
      data-single-quotes="${'single'}"
      data-double-quotes="${'double'}"
      .noQuotesProp=${'no'}
      .singleQuotesProp="${'single'}"
      .doubleQuotesProp="${'double'}"
    ></div>
  `;
};

describe('render function', () => {
  beforeAll(() => {
    document.body.innerHTML = '<div id="app"></div>';
    container = document.querySelector('#app')!;
  });

  it('renders template result in target node', () => {
    return renderPromise(app(), container).then(() => {
      const paragraph = container.children[0] as HTMLElement;
      const counter = container.children[1];

      expect(paragraph).toBeTruthy();
      expect(paragraph!.tagName).toBe('P');
      expect(paragraph!.getAttribute('id')).toBe('test');
      expect(paragraph!.className).toBe('test class');
      expect((paragraph as any).someProp).toBe('prop assign test');
      expect(paragraph!.textContent?.trim()).toBe('Test string');

      expect(+counter.textContent!).toBe(count);
    });
  });

  it('correctly update dom on events', () => {
    return renderPromise(app(), container).then(() => {
      const button = container.children[2] as HTMLElement;
      const counter = container.children[1];

      button.click();

      expect(mockClick).toBeCalled();

      return mockClick.mock.results[0].value.then(() => {
        expect(+counter.textContent!).toBe(count);
      });
    });
  });

  it('correctly handles attrs and props with quotes', () => {
    return renderPromise(quotesTest(), container).then(() => {
      const el = container.children[0] as HTMLElement;

      expect(el).toBeTruthy();
      expect(el.getAttribute('data-no-quotes')).toBe('no');
      expect(el.getAttribute('data-single-quotes')).toBe('single');
      expect(el.getAttribute('data-double-quotes')).toBe('double');
      expect((el as any).noQuotesProp).toBe('no');
      expect((el as any).singleQuotesProp).toBe('single');
      expect((el as any).doubleQuotesProp).toBe('double');
    });
  });
});
