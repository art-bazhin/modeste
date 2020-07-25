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
      expect(paragraph!.getAttribute('id')).toBe('test_');
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
});
