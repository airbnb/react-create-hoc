import { expect } from 'chai';
import createHOC from '../src';

describe('createHOC', () => {
  it('is truthy', () => {
    expect(!!createHOC).to.equal(true);
  });
});
