import configure from 'enzyme-adapter-react-helper';

configure({ disableLifecycleMethods: true });

const throwError = (...params) => {
  throw new Error(`A warning or error was logged to the console:\n${params.join('\n')}`);
};

console.error = throwError;
console.warn = throwError;
