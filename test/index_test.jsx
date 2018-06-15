import React from 'react';
import PropTypes from 'prop-types';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import casual from 'casual';
import createHOC from '../src';
import BasicSFC from './fixtures/BasicSFC';

describe('createHOC', () => {
  let hocName;
  let componentWrapper;
  let options;
  beforeEach(() => {
    hocName = casual.word;
    options = {
      factory: true,
    };
  });

  const getHOC = () => createHOC(hocName, componentWrapper, options);

  describe('with no-op component wrapper', () => {
    beforeEach(() => {
      componentWrapper = Component => () => Component;
    });

    it('returns a function', () => {
      expect(getHOC()).to.be.a('function');
    });

    describe('when passed BasicSFC', () => {
      const getWrappedComponent = () => getHOC()()(BasicSFC);

      it('returns a React component', () => {
        const WrappedComponent = getWrappedComponent();
        expect(React.isValidElement(<WrappedComponent a="a" b="b" c="c" />)).to.equal(true);
      });

      it('properly adds propTypes to the result', () => {
        const WrappedComponent = getWrappedComponent();
        expect(WrappedComponent.propTypes).to.eql(BasicSFC.propTypes);
      });

      it('adds a reasonable displayName to the component', () => {
        const WrappedComponent = getWrappedComponent();
        expect(WrappedComponent.displayName).to.equal(`${hocName}(BasicSFC)`);
      });
    });
  });

  describe('with a component wrapper that passes props', () => {
    let aParam;
    let bParam;
    beforeEach(() => {
      componentWrapper = (Component, param1, param2) => (
        function WithAB(props) {
          return <Component a={param1} b={param2} {...props} />;
        }
      );
      options.passedProps = ['a', 'b'];
      aParam = casual.string;
      bParam = casual.string;
    });

    describe('when passed BasicSFC', () => {
      const getWrappedComponent = () => getHOC()(aParam, bParam)(BasicSFC);

      it('returns a component that wraps the passed component', () => {
        const WrappedComponent = getWrappedComponent();
        expect(shallow(<WrappedComponent c="c" />)).to.contain((
          <BasicSFC a={aParam} b={bParam} c="c" />
        ));
      });

      it('removes passed props from prop types of the wrapped component', () => {
        const WrappedComponent = getWrappedComponent();
        const { a, b, ...expected } = BasicSFC.propTypes;
        expect(WrappedComponent.propTypes).to.eql(expected);
      });
    });
  });

  describe('with a component wrapper that requires new props to be passed', () => {
    const wrapperComponentPropTypes = {
      fooBar: PropTypes.string.isRequired,
    };

    beforeEach(() => {
      componentWrapper = (Component) => {
        const WithDerivedAB = ({ fooBar, ...rest }) => ((
          <Component a={fooBar.toUpperCase()} b={fooBar.slice(0, 1)} {...rest} />
        ));

        WithDerivedAB.propTypes = wrapperComponentPropTypes;

        return WithDerivedAB;
      };
      options.passedProps = ['a', 'b'];
    });

    describe('when passed BasicSFC', () => {
      const getWrappedComponent = () => getHOC()()(BasicSFC);

      it('passes down derived props', () => {
        const WrappedComponent = getWrappedComponent();
        const fooBar = casual.word;
        expect(shallow(<WrappedComponent fooBar={fooBar} c="c" />)).to.contain((
          <BasicSFC a={fooBar.toUpperCase()} b={fooBar.slice(0, 1)} c="c" />
        ));
      });

      it('adds additonal propTypes to the wrapped component', () => {
        const WrappedComponent = getWrappedComponent();
        const { a, b, ...expected } = BasicSFC.propTypes;
        expect(WrappedComponent.propTypes).to.eql({
          ...wrapperComponentPropTypes,
          ...expected,
        });
      });
    });
  });

  describe('with a component wrapper that requires new props to be passed and has no prop types', () => {
    beforeEach(() => {
      componentWrapper = (Component) => {
        function WithDerivedAB({ fooBar, ...rest }) {
          return <Component a={fooBar.toUpperCase()} b={fooBar.slice(0, 1)} {...rest} />;
        }
        WithDerivedAB.propTypes = {
          fooBar: PropTypes.string.isRequired,
        };
        return WithDerivedAB;
      };
      options.passedProps = ['a', 'b'];
    });

    describe('when passed BasicSFC', () => {
      const getWrappedComponent = () => getHOC()()(BasicSFC);

      it('copies over props from the wrapped component', () => {
        const WrappedComponent = getWrappedComponent();
        const { a, b, ...expected } = BasicSFC.propTypes;
        expect(WrappedComponent.propTypes).to.eql({
          fooBar: PropTypes.string.isRequired,
          ...expected,
        });
      });
    });
  });
});
