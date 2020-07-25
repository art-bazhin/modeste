import { render, RenderResult, html, hooked } from '../src/main';

const renderPromise = (result: RenderResult, container: Element) => {
  return new Promise((resolve) => {
    render(result, container, resolve);
  });
};

describe('render function', () => {
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
      <div data-count=${count} .countProp=${count}>${count}</div>
      <button onclick=${handleClick}>Click</button>
    `;
  };

  const hookedApp = hooked(() => {
    return app();
  });

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
      expect(+counter.getAttribute('data-count')!).toBe(count);
      expect((counter as any).countProp!).toBe(count);
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
        expect(+counter.getAttribute('data-count')!).toBe(count);
        expect((counter as any).countProp!).toBe(count);
      });
    });
  });

  it('renders hooked template result in target node', () => {
    return renderPromise(hookedApp(), container).then(() => {
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

  it('correctly update dom on events in hooked functions', () => {
    return renderPromise(hookedApp(), container).then(() => {
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
    return renderPromise(
      html`
        <div
          data-no-quotes=${'no'}
          data-single-quotes="${'single'}"
          data-double-quotes="${'double'}"
          .noQuotesProp=${'no'}
          .singleQuotesProp="${'single'}"
          .doubleQuotesProp="${'double'}"
        ></div>
      `,
      container
    ).then(() => {
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

  it('correctly handles boolean atributes', () => {
    return renderPromise(
      html`
        <div
          data-true=${true}
          data-false=${false}
          data-null=${null}
          data-undefined=${undefined}
          data-zero=${0}
          data-one=${1}
          data-empty-string=${''}
        ></div>
      `,
      container
    ).then(() => {
      const el = container.children[0] as HTMLElement;

      expect(el).toBeTruthy();

      expect(el.getAttribute('data-true')).toBe('');
      expect(el.getAttribute('data-empty-string')).toBe('');

      expect(el.getAttribute('data-false')).toBeNull();
      expect(el.getAttribute('data-null')).toBeNull();
      expect(el.getAttribute('data-undefined')).toBeNull();

      expect(el.getAttribute('data-zero')).toBe('0');
      expect(el.getAttribute('data-one')).toBe('1');
    });
  });

  it('correctly renders falsy values', () => {
    return renderPromise(
      html`
        <div>${''}</div>
        <div>${undefined}</div>
        <div>${false}</div>
        <div>${null}</div>
        <div>${0}</div>
      `,
      container
    ).then(() => {
      const divs = container.children;

      expect(divs[0].textContent).toBe('');
      expect(divs[1].textContent).toBe('');
      expect(divs[2].textContent).toBe('');
      expect(divs[3].textContent).toBe('');
      expect(divs[4].textContent).toBe('0');
    });
  });

  it('can render domNodes as values', () => {
    const testNode = document.createElement('div');

    return renderPromise(html` <div>${testNode}</div> `, container).then(() => {
      const el = container.children[0].children[0] as HTMLElement;

      expect(el).toBeTruthy();
      expect(el).toBe(testNode);
    });
  });
});
