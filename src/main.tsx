import { useObserver } from "iaktta.preact";
import { h, render } from "preact";
import { model } from "./model";

import "./style.less";

//this will already hot reload and keep state, moving the model into this file will cause it to lose state on reload. hopefully @prefresh/core can help!

const Test = () =>
  useObserver(() => {
    return (
      <div>
        <header>App Header</header>
        <h1 style={{ textAlign: "center" }}>Count: {model.counter}</h1>
        <input
          type="range"
          min={0}
          max={1000}
          value={model.counter}
          onInput={(evt) => (model.counter = Number((evt as any).target.value))}
          style={{ width: "100%" }}
        />
      </div>
    );
  });

render(<Test />, document.body);
