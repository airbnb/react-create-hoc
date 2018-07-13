import React from 'react';
import PropTypes from 'prop-types';
import test from 'tape';
import { shallow } from 'enzyme';
import casual from 'casual';
import inspect from 'object-inspect';
import sloppy from 'prop-types-exact/build/sloppy';
import createHOC from '../src';
import { BasicSFC, ProplessSFC } from './fixtures';

test('createHOC', (t) => {
  const hocName = casual.word;
  const factoryOptions = {
    factory: true,
  };
  const noopComponentWrapper = Component => () => Component;

  t.test('createHOC wrapping', (st) => {
    st.test('with no-op component wrapper', (s2t) => {
      const hocFactory = createHOC(
        hocName,
        noopComponentWrapper,
        factoryOptions,
      );
      s2t.equal(typeof hocFactory, 'function', 'returns a function');

      s2t.test('when passed BasicSFC', (s3t) => {
        const WrappedComponent = hocFactory()(BasicSFC);

        s3t.ok(
          React.isValidElement(<WrappedComponent a="a" b="b" c="c" />),
          'returns a React component',
        );

        s3t.deepEqual(
          sloppy(WrappedComponent.propTypes),
          sloppy(BasicSFC.propTypes),
          'has the same propTypes as BasicSFC',
        );

        s3t.equal(WrappedComponent.displayName, `${hocName}(BasicSFC)`, 'adds a reasonable displayName to the component');

        s3t.end();
      });

      s2t.end();
    });

    st.test('with a component wrapper that passes props to the component it wraps', (s2t) => {
      const componentWrapper = (Component, param1, param2) => (
        function WithAB(props) {
          return <Component a={param1} b={param2} {...props} />;
        }
      );
      const aParam = casual.string;
      const bParam = casual.string;

      s2t.test('when passed BasicSFC', (s3t) => {
        const hocFactory = createHOC(
          hocName,
          componentWrapper,
          { ...factoryOptions, passedProps: ['a', 'b'] },
        );
        const WrappedComponent = hocFactory(aParam, bParam)(BasicSFC);

        s3t.ok(
          shallow(<WrappedComponent c="c" />).contains(<BasicSFC a={aParam} b={bParam} c="c" />),
          'returns a component that wraps the passed component',
        );

        const { a, b, ...expected } = BasicSFC.propTypes;
        s3t.deepEqual(
          sloppy(WrappedComponent.propTypes),
          sloppy(expected),
          'removes passed props from prop types of the wrapped component',
        );

        s3t.end();
      });

      s2t.end();
    });

    st.test('with a component wrapper that requires new props to be passed', (s2t) => {
      const wrapperComponentPropTypes = {
        fooBar: PropTypes.string.isRequired,
      };

      const componentWrapper = (Component) => {
        const WithDerivedAB = ({ fooBar, ...rest }) => (
          <Component {...rest} />
        );

        WithDerivedAB.propTypes = wrapperComponentPropTypes;

        return WithDerivedAB;
      };

      s2t.test('when passed BasicSFC', (s3t) => {
        const hocFactory = createHOC(
          hocName,
          componentWrapper,
          factoryOptions,
        );
        const WrappedComponent = hocFactory()(BasicSFC);

        const fooBar = casual.word;
        const wrappedComponentProps = {
          a: casual.word,
          b: casual.word,
          c: casual.word,
        };
        s3t.ok(
          shallow((
            <WrappedComponent fooBar={fooBar} {...wrappedComponentProps} />
          )).contains(<BasicSFC {...wrappedComponentProps} />),
          'passes down props as passed',
        );

        s3t.deepEqual(
          sloppy(WrappedComponent.propTypes),
          sloppy({
            ...wrapperComponentPropTypes,
            ...BasicSFC.propTypes,
          }),
          'adds additonal propTypes to the wrapped component',
        );

        s3t.end();
      });

      s2t.test('when passed ProplessSFC', (s3t) => {
        const hocFactory = createHOC(
          hocName,
          componentWrapper,
          factoryOptions,
        );
        const WrappedComponent = hocFactory()(ProplessSFC);

        const fooBar = casual.word;
        s3t.ok(
          shallow(<WrappedComponent fooBar={fooBar} />).contains(<ProplessSFC />),
          'does not pass down any props',
        );

        s3t.deepEqual(
          sloppy(WrappedComponent.propTypes),
          sloppy({ ...wrapperComponentPropTypes }),
          'only has the prop types from the component wrapper',
        );

        s3t.test('when allowExtraProps is true', (s4t) => {
          const hocFactoryWithExtraProps = createHOC(
            hocName,
            componentWrapper,
            { ...factoryOptions, allowExtraProps: true },
          );
          const WrappedComponentWithExtraProps = hocFactoryWithExtraProps()(ProplessSFC);

          s4t.deepEqual(
            WrappedComponentWithExtraProps.propTypes,
            { ...wrapperComponentPropTypes },
            'does not change the component wrapper prop types',
          );
          s4t.end();
        });

        s3t.end();
      });

      s2t.end();
    });

    st.test('with a component wrapper that requires new props to be passed and passes props to the component to be wrapped', (s2t) => {
      const wrapperComponentPropTypes = {
        fooBar: PropTypes.string.isRequired,
      };

      const componentWrapper = (Component) => {
        const WithDerivedAB = ({ fooBar, ...rest }) => ((
          <Component a={fooBar.toUpperCase()} b={fooBar.slice(0, 1)} {...rest} />
        ));

        WithDerivedAB.propTypes = wrapperComponentPropTypes;

        return WithDerivedAB;
      };

      const hocFactory = createHOC(
        hocName,
        componentWrapper,
        { ...factoryOptions, passedProps: ['a', 'b'] },
      );
      const WrappedComponent = hocFactory()(BasicSFC);

      const fooBar = casual.word;
      s2t.ok(
        shallow(<WrappedComponent fooBar={fooBar} c="c" />)
          .contains(<BasicSFC a={fooBar.toUpperCase()} b={fooBar.slice(0, 1)} c="c" />),
        'when passed BasicSFC, passes down derived props',
      );

      const { a, b, ...expected } = BasicSFC.propTypes;
      s2t.deepEqual(
        sloppy(WrappedComponent.propTypes),
        sloppy({
          ...wrapperComponentPropTypes,
          ...expected,
        }),
        'when passed BasicSFC, adds additonal propTypes to the wrapped component',
      );

      s2t.end();
    });

    st.end();
  });

  t.test('allowExtraProps', (st) => {
    const wrapperComponentPropTypes = {
      fooBar: PropTypes.string.isRequired,
    };

    const componentWrapper = (Component) => {
      const WithDerivedAB = ({ fooBar, ...rest }) => ((
        <Component a={fooBar.toUpperCase()} b={fooBar.slice(0, 1)} {...rest} />
      ));

      WithDerivedAB.propTypes = wrapperComponentPropTypes;

      return WithDerivedAB;
    };

    const hocFactory = createHOC(
      hocName,
      componentWrapper,
      { ...factoryOptions, passedProps: ['a', 'b'] },
    );
    const WrappedComponent = hocFactory()(BasicSFC);

    st.throws(
      () => shallow(<WrappedComponent fooBar="test" c="test" d="test" />),
      /unknown props found: d/,
      'when allowExtraProps is false, resulting wrapped component does not allow extra props',
    );

    const hocFactoryWithExtraProps = createHOC(
      hocName,
      componentWrapper,
      { ...factoryOptions, allowExtraProps: true },
    );
    const WrappedComponentWithExtraProps = hocFactoryWithExtraProps()(ProplessSFC);

    st.doesNotThrow(
      () => shallow(<WrappedComponentWithExtraProps fooBar="test" c="test" d="test" />),
      'when allowExtraProps is true, the resulting wrapped component allows extra props',
    );

    st.end();
  });

  t.test('param validation', (st) => {
    st.doesNotThrow(
      () => createHOC(hocName, noopComponentWrapper, factoryOptions)()(BasicSFC),
      'does not throw when a valid string is passed',
    );

    [null, undefined, '', 123, true, {}].forEach((name) => {
      st.throws(
        () => createHOC(name, noopComponentWrapper, factoryOptions)()(BasicSFC),
        /valid name/,
        `when hocName is ${inspect(name)}, throws an error`,
      );
    });

    st.test('componentAndParamsToComponent', (s2t) => {
      s2t.doesNotThrow(
        () => createHOC(hocName, noopComponentWrapper, factoryOptions)()(BasicSFC),
        'does not throw when a valid function with one param is passed',
      );

      [
        ['null', null],
        ['a string', casual.word],
        ['an object', {}],
      ].forEach(([desc, invalidFunction]) => {
        s2t.throws(
          () => createHOC(hocName, invalidFunction, factoryOptions)()(BasicSFC),
          /function needs to be passed/,
          `throws when ${desc} is passed`,
        );
      });

      s2t.throws(
        () => createHOC(hocName, () => () => null, factoryOptions)()(BasicSFC),
        /function must take at least one/,
        'throws when a component-returning function with no params is passed',
      );

      s2t.end();
    });

    st.test('options', (s2t) => {
      s2t.doesNotThrow(
        () => createHOC(hocName, noopComponentWrapper, factoryOptions)()(BasicSFC),
        'factory: true does not throw',
      );

      s2t.doesNotThrow(
        () => createHOC(hocName, noopComponentWrapper, { factory: false })(BasicSFC),
        'factory: false does not throw',
      );

      [null, undefined, '', 'foo', 123, {}].forEach((nonBoolean) => {
        s2t.throws(
          () => createHOC(hocName, noopComponentWrapper, { factory: nonBoolean })(BasicSFC),
          /`factory` option/,
          `factory: non-boolean ${inspect(nonBoolean)} throws`,
        );
      });

      s2t.end();
    });

    st.end();
  });

  t.end();
});
