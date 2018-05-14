import hoistNonReactStatics from 'hoist-non-react-statics';

export default function createHOC(
  hocName,
  componentAndParamsToComponent,
  {
    passedProps = [],
    contextTypes = {},
    addedPropTypes = {},
  } = {},
) {
  return function hocFactory(...params) {
    return function hoc(ComponentToWrap) {
      const NewComponent = componentAndParamsToComponent(ComponentToWrap, params);

      NewComponent.WrappedComponent = ComponentToWrap;
      NewComponent.displayName = `${hocName}(${ComponentToWrap.displayName || ComponentToWrap.name})`;
      NewComponent.contextTypes = {
        ...ComponentToWrap.contextTypes,
        ...contextTypes,
      };

      if (ComponentToWrap.propTypes) {
        const copiedProps = {
          ...ComponentToWrap.propTypes,
        };
        passedProps.forEach((propName) => {
          delete copiedProps[propName];
        });

        NewComponent.propTypes = {
          ...copiedProps,
          ...addedPropTypes,
        };
      }

      if (ComponentToWrap.defaultProps) {
        NewComponent.defaultProps = { ...ComponentToWrap.defaultProps };
      }

      return hoistNonReactStatics(NewComponent, ComponentToWrap);
    };
  };
}
