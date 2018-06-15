import React from 'react';
import PropTypes from 'prop-types';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import casual from 'casual';
import sloppy from 'prop-types-exact/build/sloppy';
import createHOC from '../src';
import { BasicSFC, ProplessSFC } from './fixtures';

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

  describe('createHOC wrapping', () => {
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

        it('has the same propTypes as BasicSFC', () => {
          const WrappedComponent = getWrappedComponent();
          expect(sloppy(WrappedComponent.propTypes)).to.eql(sloppy(BasicSFC.propTypes));
        });

        it('adds a reasonable displayName to the component', () => {
          const WrappedComponent = getWrappedComponent();
          expect(WrappedComponent.displayName).to.equal(`${hocName}(BasicSFC)`);
        });
      });
    });

    describe('with a component wrapper that passes props to the component it wraps', () => {
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
          expect(sloppy(WrappedComponent.propTypes)).to.eql(sloppy(expected));
        });
      });
    });

    describe('with a component wrapper that requires new props to be passed', () => {
      const wrapperComponentPropTypes = {
        fooBar: PropTypes.string.isRequired,
      };

      beforeEach(() => {
        componentWrapper = (Component) => {
          const WithDerivedAB = ({ fooBar, ...rest }) => (
            <Component {...rest} />
          );

          WithDerivedAB.propTypes = wrapperComponentPropTypes;

          return WithDerivedAB;
        };
      });

      describe('when passed BasicSFC', () => {
        const getWrappedComponent = () => getHOC()()(BasicSFC);

        it('passes down props as passed', () => {
          const WrappedComponent = getWrappedComponent();
          const fooBar = casual.word;
          const wrappedComponentProps = {
            a: casual.word,
            b: casual.word,
            c: casual.word,
          };
          expect(shallow((
            <WrappedComponent fooBar={fooBar} {...wrappedComponentProps} />
          ))).to.contain((
            <BasicSFC {...wrappedComponentProps} />
          ));
        });

        it('adds additonal propTypes to the wrapped component', () => {
          const WrappedComponent = getWrappedComponent();
          expect(sloppy(WrappedComponent.propTypes)).to.eql(sloppy({
            ...wrapperComponentPropTypes,
            ...BasicSFC.propTypes,
          }));
        });
      });

      describe('when passed ProplessSFC', () => {
        const getWrappedComponent = () => getHOC()()(ProplessSFC);

        it('does not pass down any props', () => {
          const WrappedComponent = getWrappedComponent();
          const fooBar = casual.word;
          expect(shallow((
            <WrappedComponent fooBar={fooBar} />
          ))).to.contain((
            <ProplessSFC />
          ));
        });

        it('only has the prop types from the component wrapper', () => {
          const WrappedComponent = getWrappedComponent();
          expect(sloppy(WrappedComponent.propTypes)).to.eql(sloppy({
            ...wrapperComponentPropTypes,
          }));
        });

        describe('when allowExtraProps is true', () => {
          beforeEach(() => { options.allowExtraProps = true; });

          it('does not change the component wrapper prop types', () => {
            const WrappedComponent = getWrappedComponent();
            expect(WrappedComponent.propTypes).to.eql({
              ...wrapperComponentPropTypes,
            });
          });
        });
      });
    });

    describe('with a component wrapper that requires new props to be passed and passes props to the component to be wrapped', () => {
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
          expect(sloppy(WrappedComponent.propTypes)).to.eql(sloppy({
            ...wrapperComponentPropTypes,
            ...expected,
          }));
        });
      });
    });
  });

  describe('allowExtraProps', () => {
    const getWrappedComponent = () => getHOC()()(BasicSFC);
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

    describe('when allowExtraProps is false', () => {
      it('the resulting wrapped component does not allow extra props', () => {
        const WrappedComponent = getWrappedComponent();
        expect(() => shallow(<WrappedComponent fooBar="test" c="test" d="test" />)).to.throw(/unknown props found: d/);
      });
    });

    describe('when allowExtraProps is true', () => {
      beforeEach(() => {
        options.allowExtraProps = true;
      });

      it('the resulting wrapped component allows extra props', () => {
        const WrappedComponent = getWrappedComponent();
        expect(() => shallow(<WrappedComponent fooBar="test" c="test" d="test" />)).to.not.throw();
      });
    });
  });

  describe('param validation', () => {
    beforeEach(() => {
      componentWrapper = Component => () => Component;
    });

    describe('hocName', () => {
      it('does not throw when a valid string is passed', () => {
        expect(() => getHOC()()(BasicSFC)).to.not.throw();
      });

      describe.each([null, undefined, '', 123, true, {}])(
        'when hocName is `%j`',
        (name) => {
          beforeEach(() => {
            hocName = name;
          });

          it('Throws an error', () => {
            expect(() => getHOC()()(BasicSFC)).to.throw(/valid name/);
          });
        },
      );
    });

    describe('componentAndParamsToComponent', () => {
      describe('when a valid function with one param', () => {
        it('does not throw', () => {
          expect(() => getHOC()()(BasicSFC)).to.not.throw();
        });
      });

      describe.each([
        ['null', null],
        ['a string', casual.word],
        ['an object', {}],
      ])(
        'when %s',
        (_, fn) => {
          beforeEach(() => { componentWrapper = fn; });

          it('Throws an error', () => {
            expect(() => getHOC()()(BasicSFC)).to.throw(/function needs to be passed/);
          });
        },
      );

      describe('when a component-returning function with no params', () => {
        beforeEach(() => { componentWrapper = () => () => null; });
        it('Throws an error', () => {
          expect(() => getHOC()()(BasicSFC)).to.throw(/function must take at least one/);
        });
      });
    });

    describe('options', () => {
      describe('.factory', () => {
        describe('when true', () => {
          it('does not throw', () => {
            expect(() => getHOC()()(BasicSFC)).to.not.throw();
          });
        });

        describe('when false', () => {
          beforeEach(() => { options.factory = false; });

          it('does not throw', () => {
            expect(() => getHOC()(BasicSFC)).to.not.throw();
          });
        });

        describe.each([null, undefined, '', 'foo', 123, {}])(
          'when `%j`',
          (factory) => {
            beforeEach(() => { options.factory = factory; });

            it('Throws an error', () => {
              expect(() => getHOC()()(BasicSFC)).to.throw(/`factory` option/);
            });
          },
        );
      });
    });
  });
});
