import React from 'react';
import PropTypes from 'prop-types';

export function BasicSFC({ a, b, c }) {
  return (
    <div>
      <div id="a">{a}</div>
      <div id="b">{b}</div>
      <div id="c">{c}</div>
    </div>
  );
}

BasicSFC.propTypes = {
  a: PropTypes.string.isRequired,
  b: PropTypes.string.isRequired,
  c: PropTypes.string.isRequired,
};


export function ProplessSFC() {
  return (
    <div>Wow!</div>
  );
}
