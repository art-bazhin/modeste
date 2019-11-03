import { html } from '../src/template-result';
import { render } from '../src/render';

const modeste = {
  html,
  render
};

export default modeste;

// let measures: {
//   [key: string]: { count: number; total: number; last: number };
// } = {};

// function startMeasure(key: string) {
//   if (!measures[key]) measures[key] = { count: 0, total: 0, last: 0 };

//   measures[key].last = performance.now();
// }

// function endMeasure(key: string) {
//   measures[key].last = performance.now() - measures[key].last;
//   measures[key].total += measures[key].last;
//   measures[key].count++;

//   console.log(
//     `---${key} measure---\nLast: ${measures[key].last}\nMean: ${measures[key]
//       .total / measures[key].count}\n`
//   );
// }

// interface IUser {
//   name: string;
//   age: number;
//   active: boolean;
//   x?: number;
//   y?: number;
// }

// let users: IUser[] = [
//   {
//     name: 'John',
//     age: 16,
//     active: true
//   },
//   {
//     name: 'Paul',
//     age: 15,
//     active: true
//   },
//   {
//     name: 'George',
//     age: 17,
//     active: true
//   },
//   {
//     name: 'Ringo',
//     age: 16,
//     active: true
//   }
// ];

// function fill() {
//   for (let i = 0; i < 400; i++) {
//     users.push({
//       name: 'test',
//       age: i,
//       active: true
//     });
//   }

//   r('fill');
// }

// function toggleUser(user: IUser) {
//   user.active = !user.active;
//   r('toggle');
// }

// function reverse() {
//   users.reverse();
//   r('reverse');
// }

// function clean() {
//   users = [];
//   r('clean');
// }

// function setUserName(user: IUser, name: string) {
//   user.name = name;
//   r();
// }

// function move(user: IUser, x: number, y: number) {
//   user.x = x;
//   user.y = y;
//   r();
// }

// let button = (props: { onclick: (...args: any[]) => any }) => html`
//   <button onclick=${props.onclick}>Toggle active</button>
// `;

// let card = (user: IUser) => {
//   function toggle() {
//     for (let i = 0; i < 4; i++) toggleUser(user);
//   }

//   return html`
//     <div
//       onmousemove=${(e: any) => move(user, e.clientX, e.clientY)}
//       class=${'card' + (user.active ? '' : ' inactive')}
//     >
//       <div>
//         <input
//           type="text"
//           value=${user.name}
//           oninput=${(e: InputEvent) =>
//             setUserName(user, (e.target as HTMLInputElement).value)}
//         />
//       </div>
//       <p>Name: ${user.name}</p>
//       <p>Age: ${user.age}</p>
//       <p>Test: ${users[0].name}</p>
//       <p>${user.active ? 'Active' : 'Inactive'}</p>
//       <p>X: ${user.x}, Y: ${user.y}</p>
//       ${button({ onclick: toggle })}
//     </div>
//   `;
// };

// let app = () => {
//   const cards = users.map(user => card(user));

//   return html`
//     <div>
//       <button onclick=${fill}>Fill</button>
//       <button onclick=${reverse}>Reverse</button>
//       <button onclick=${clean}>Clean</button>
//     </div>
//     <div>
//       ${cards}
//     </div>
//   `;
// };

// let shouldRender = false;

// function r(key?: string) {
//   shouldRender = true;

//   return requestAnimationFrame(() => {
//     if (!shouldRender) return;

//     if (key) startMeasure(key);
//     render(app(), document.body);
//     if (key) endMeasure(key);

//     shouldRender = false;
//   });
// }

// r();
