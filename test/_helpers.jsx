import chai from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon-sandbox';
import chaiEnzyme from 'chai-enzyme';

import configure from 'enzyme-adapter-react-helper';

configure({ disableLifecycleMethods: true });

chai.use(sinonChai);
chai.use(chaiEnzyme());

const throwError = (...params) => {
  throw new Error(`A warning or error was logged to the console:\n${params.join('\n')}`);
};

/* eslint-disable no-console */
const consoleWarn = console.warn;
const consoleError = console.error;

beforeEach(() => {
  console.error = throwError;
  console.warn = throwError;
});

afterEach(() => {
  sinon.restore();
  console.warn = consoleWarn;
  console.error = consoleError;
});
/* eslint-enable no-console */
