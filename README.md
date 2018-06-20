# react-create-hoc
Utility for creating React Higher-Order Components (HOC) using best practices for managing prop types.

## Motivation
The HOC pattern is a really important tool for code reuse when building UIs in React. [Prop types](https://reactjs.org/docs/typechecking-with-proptypes.html) are helpful for catching bugs before they reach production.

Writing HOCs that properly handle the prop types of the components that they wrap, though, is difficult and requires a lot of boilerplate code. Ideally, an engineer should not shy away from moving logic to an HOC because it is too verbose to write one.

To solve this problem, `react-create-hoc` provides a function that implements much of this boilerplate. It allows HOCs to be created with only a straightforward function that simply wraps a component in a new component.

## Usage

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import createHOC from 'react-create-hoc';

function WelcomeMessage({ name }) {
  return <div>{greeting}, {name}!</div>;
}

WelcomeMessage.propTypes = {
  greeting: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
};

const withModifiedName = createHOC(
  'withModifiedName',
  (ComponentToWrap, nameModifier) => {
    function WithModifiedName({ nameProvider, ...rest }) {
      return (
        <ComponentToWrap
          name={nameModifier(nameProvider())}
          {...rest}
        />
      );
    }

    WithModifiedName.propTypes = {
      nameProvider: PropTypes.func.isRequired,
    };

    return WithModifiedName;
  },
  {
    factory: true,
    passedProps: ['name'],
  },
);

// WrappedWelcomeMessage has the following prop types:
// {
//   greeting: PropTypes.string.isRequired,
//   nameProvider: PropTypes.func.isRequired,
// }
const WrappedWelcomeMessage = withModifiedName(
  // nameModifier param
  name => name.toUpperCase(),
)(WelcomeMessage);

// Renders a div containing, "Rise and shine, MR. FREEMAN!"
ReactDOM.render(
  <WrappedWelcomeMessage
    greeting="Rise and shine"
    nameProvider={() => 'Mr. Freeman'}
  />,
  document.getElementById('root'),
);
```

## API

```typescript
createHOC(
  hocName: string,
  componentAndParamsToComponent: (ComponentToWrap, ...params) => WrappedComponent,
  options: {
    factory: boolean,
    passedProps: string[] = [],
    allowExtraProps: boolean = false,
  },
);
```
| Param                                                             | Type                                               | Required? | Default | Description                                                       |
|-------------------------------------------------------------------|----------------------------------------------------|-----------|---------|-------------------------------------------------------------------|
| [`hocName`](#hocname)                                             | `string`                                           | Yes       |         | Name of the resulting HOC                                         |
| [`componentAndParamsToComponent`](#componentandparamstocomponent) | `(ComponentToWrap, ...params) => WrappedComponent` | Yes       |         | Function that wraps components passed to the HOC                  |
| [`options.factory`](#optionsfactory)                              | `boolean`                                          | Yes       |         | Return a "factory"-style HOC                                      |
| [`options.passedProps`](#optionspassedprops--)                    | `string[]`                                         |           | []      | List of props that are passed by the HOC to the wrapped component |
| [`options.allowExtraProps`](#optionsallowextraprops--false)       | `boolean`                                          |           | false   | Disable strict checking of extra props                            |

### `hocName`
Specifies the name of the resulting HOC. This name is added to the name of the wrapped component. For example, passing a component named `WelcomeMessage` to an HOC having the name `withModifiedName` results in a component with the name:
```
withModifiedName(WelcomeMessage)
```

### `componentAndParamsToComponent`
Function that takes a component to wrap and the params passed to the HOC and returns a new component.

#### Examples
Simple wrapper that takes no props or parameters
```jsx
const withFlexWrapper = createHOC(
  'withFlexWrapper',
  ComponentToWrap => (
    function WithFlexWrapper(props) {
      return (
        <div style={{ display: 'flex' }}>
          <ComponentToWrap {...props} />
        </div>
      );
    }
  ),
  { factory: false },
);

withFlexWrapper(SomeComponent);
```

Wrapper that takes parameters
```jsx
const withStyles = createHOC(
  'withStyles',
  (ComponentToWrap, styles) => (
    function WithStylesWrapper(props) {
      return (
        <ComponentToWrap styles={styles} {...props} />
      );
    }
  ),
  {
    factory: true,
    passedProps: ['styles'],
  },
);

withStyles({
  header: {
    position: 'fixed',
    top: 0,
  },
})(SomeComponent);
```

Wrapper that adds props
```jsx
const withFadeInOut = createHOC(
  'withFadeInOut',
  (ComponentToWrap) => {
    function WithFadeInOutWrapper({ visible, duration, ...rest}) {
      return (
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity ease-in-out',
            transitionDuration: `${duration}s`,
          }}
        >
          <ComponentToWrap {...rest} />
        </div>
      );
    }

    WithFadeInOutWrapper.propTypes = {
      visible: PropTypes.bool,
      duration: PropTypes.number.isRequired,
    };

    WithFadeInOutWrapper.defaultProps = {
      visible: false,
    };

    return WithFadeInOutWrapper;
  },
  { factory: false },
);

const FadingComponent = withFadeInOut(SomeComponent);

// Somewhere later on...

<FadingComponent visible={true} duration={0.5} />
```

### `options.factory`
Specifies the HOC "style" to use. **This option is required**.

When `factory` is `true`, the HOC takes params and returns a component-wrapping function. This is useful for cases where the HOC is reused with the same params or included in a call to Redux's `compose` function (or something similar). For example:
```jsx
withStyles({ /* style definitions */ })(ComponentToWrap);

compose(
  withStyles({ /* style definitions */ }),
  connect(mapStateToProps, mapDispatchToProps),
)(ComponentToWrap);

const withSpecificStyles = withStyles({ /* style definitions */ });
const ComponentAWithSpecificStyles = withSpecificStyles(ComponentA);
const ComponentBWithSpecificStyles = withSpecificStyles(ComponentB);
```

When `factory` is `false`, the HOC takes params and returns a component-wrapping function. This is useful for cases where the HOC takes no params (other than the component to wrap) or when it's preferable to pass the params in the same call as the component. For example:
```jsx
compose(
  withFlexWrapper,
  connect(mapStateToProps, mapDispatchToProps),
)(ComponentToWrap);

withStyles(ComponentToWrap, { /* style definitions */ });
```

### `options.passedProps = []`
Specifies which props are passed to the component-to-wrap. These props are removed from the wrapped component's prop types. By default, `passedProps` is `[]`.

### `options.allowExtraProps = false`
Specifies whether the wrapped component should tolerate extra props being passed. By default, `allowExtraProps` is `false`.

## Development
```
npm install
npm run lint
npm test
npm run build
```
