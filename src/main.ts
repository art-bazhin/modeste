import { html } from './template-result';
import { getTemplateInstance } from './template-instance';

interface IUser {
  name: string;
  age: number;
  active: boolean;
}

let users: IUser[] = [
  {
    name: 'John',
    age: 16,
    active: true
  },
  {
    name: 'Paul',
    age: 15,
    active: true
  },
  {
    name: 'George',
    age: 17,
    active: true
  },
  {
    name: 'Ringo',
    age: 16,
    active: true
  }
];

for (let i = 0; i < 4000; i++) {
  users.push({
    name: 'test',
    age: i,
    active: true
  });
}

let button = () => html`
  <button onclick=${() => console.log('CLICK!')}>CLICK ME</button>
`;

let card = (user: IUser) => html`
  <div class=${'card'}>
    <div><input type="text" value=${user.name} /></div>
    <p>Name: ${user.name}</p>
    <p>Age: ${user.age}</p>
    <p>Test: ${users[0].name}</p>
    ${user.active
      ? html`
          <p>Active</p>
        `
      : html`
          <p>Inactive</p>
        `}
    ${button()}
  </div>
`;

let app = () => html`
  <div>
    ${users.map(user => card(user))}
  </div>
`;

let ts = performance.now();

document.body.appendChild(getTemplateInstance(app()).fragment as Node);

console.log(performance.now() - ts);

// if (fragment) document.body.appendChild(fragment);
