//import * as React from "preact";
import { h, render, Component, JSX } from "preact";
import { createStore, Provider, connect } from "unistore/full/preact";

//import "./style.less";

type State = {
  count: number;
}

let store = createStore<State>({ count: 0 });

let actions = (store) => ({
  increment(state: State): State {
    return { count: state.count + 1 };
  },

  decrement(state: State): State {
    return { count: state.count - 1 };
  },
});

type Actions = ReturnType<typeof actions>

type Props = State & Actions;

interface Props1 {
  count?: number;
  increment?: any;
  decrement?: any;
}

let App = connect("count",actions)((props: Props1) => {
  return (
    <div>
      <header>App Headerss</header>
      <section>
        <p>Count: {props.count}</p>
        <button onClick={props.increment}>Increment</button>
        <button onClick={props.decrement}>Decrement</button>
      </section>
    </div>
  );
});

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.body
);

// declare var module

// if (module["hot"]) {
//   module["hot"].accept();
// }

@connect('count', actions)
class App1 extends Component<Props1, any> {
  render () {
    return (
      <div>
        <header>App Header</header>
        <section>
          <p>Count: {this.props.count}</p>
          <button onClick={this.props.increment}>Increment</button>
          <button onClick={this.props.decrement}>Decrement</button>
        </section>
      </div>
    )
  }
}

// let App = connect('count', actions)(class App extends Component<Props, any> {
//   render () {
//     return (
//       <div>
//         <header>App Header</header>
//         <section>
//           <p>Count: {this.props.count}</p>
//           <button onClick={this.props.increment}>Increment</button>
//           <button onClick={this.props.decrement}>Decrement</button>
//         </section>
//       </div>
//     )
//   }
// })
