import hoistNonReactStatics from 'hoist-non-react-statics';

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
    // TODO: allowExtraProps,
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
          ...ComponentToWrap.propTypes,
        };

        passedProps.forEach((propName) => {
          delete copiedProps[propName];
        });

        // TODO: should have forbidExtraProps applied and an option for allowing extra props
        // Needs to strip out key for forbidExtraProps and call forbidExtraProps to regenerate it
        NewComponent.propTypes = {
          ...copiedProps,
          ...NewComponent.propTypes,
        };
      }

      return hoistNonReactStatics(NewComponent, ComponentToWrap);
    };
  }

  if (factory) {
    return hocFactory;
  }

  return hocFactory();
}
