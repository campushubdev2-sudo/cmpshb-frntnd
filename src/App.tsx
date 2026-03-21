import { useState } from "react";

const App = () => {
  const [count, setCount] = useState(0);
  return (
    <div className="m-4">
      <button className="border rounded p-2 cursor-pointer" onClick={() => setCount((count) => count + 1)}>
        Click me
      </button>
      <p>
        Count is: <span>{count}</span>
      </p>
    </div>
  );
};

export default App;
