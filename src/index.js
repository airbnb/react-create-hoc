import hoistNonReactStatics from 'hoist-non-react-statics';
import exact from 'prop-types-exact';
import sloppy from 'prop-types-exact/build/sloppy';

const getFactoryParamErrorMessage =
  componentName => `The \`factory\` option must be \`true\` or \`false\`.

Use \`factory: true\` when you want a HOC factory function that takes params:

${componentName}(param1, param2)(WrappedComponent);

Use \`factory: false\` when you want a HOC that takes params along with the wrapped component:

${componentName}(WrappedComponent, param1, param2);`;

export default function createHOC(
  hocName,
  componentAndParamsToComponent,
  {
    passedProps = [],
    factory,
    allowExtraProps,
  } = {},
) {
  if (!hocName || typeof hocName !== 'string') {
    throw new Error('A valid name for this HOC must be passed.');
  }

  if (typeof componentAndParamsToComponent !== 'function') {
    throw new Error('A component wrapping function needs to be passed.');
  }

  if (componentAndParamsToComponent.length < 1) {
    throw new Error('The component wrapping function must take at least one parameter.');
  }

  if (typeof factory !== 'boolean') {
    throw new Error(getFactoryParamErrorMessage(hocName));
  }

  function hocFactory(...factoryParams) {
    return function hoc(ComponentToWrap, ...hocParams) {
      const NewComponent = componentAndParamsToComponent(
        ComponentToWrap,
        ...(factory ? factoryParams : hocParams),
      );

      NewComponent.WrappedComponent = ComponentToWrap;
      NewComponent.displayName =
        `${hocName}(${ComponentToWrap.displayName || ComponentToWrap.name})`;

      if (ComponentToWrap.propTypes) {
        const copiedProps = {
          ...sloppy(ComponentToWrap.propTypes),
        };

        passedProps.forEach((propName) => {
          delete copiedProps[propName];
        });

        const newPropTypes = {
          ...copiedProps,
          ...NewComponent.propTypes,
        };

        if (allowExtraProps) {
          NewComponent.propTypes = newPropTypes;
        } else {
          NewComponent.propTypes = exact(newPropTypes);
        }
      }

      return hoistNonReactStatics(NewComponent, ComponentToWrap);
    };
  }

  if (factory) {
    return hocFactory;
  }

  return hocFactory();
}
