import React from 'react';
import Factsheet from './index';

const mockCallbackShutdown = jest.fn();
const mockCallbackScrollTo = jest.fn();
const data = {
  aum: '0.9824',
  creationDate: '24. Jul 2018 09:19',
  dataValid: false,
  expectedPrize: '0.54321',
  isCompetition: false,
  loading: false,
  managementReward: '0.0000',
  name: 'Melon Fund',
  numberOfFunds: '12',
  performanceReward: '0.0000',
  personalStake: '1.0000',
  quoteAsset: 'WETH-T',
  rank: '1',
  sharePrice: '0.9824',
  shutdown: mockCallbackShutdown,
  scrollTo: mockCallbackScrollTo,
  totalSupply: '1.0000',
  tweetHref: 'melonport',
};

describe('Factsheet', () => {
  const defaultElement = <Factsheet {...data} />;
  let customElement;

  it('should render correctly', () => {
    const wrapper = shallow(defaultElement);
    expect(wrapper).toMatchSnapshot();
  });

  it('should render correctly with loading', () => {
    customElement = <Factsheet {...data} loading />;
    const wrapper = shallow(customElement);
    expect(wrapper).toMatchSnapshot();
  });

  it('should render correctly with isCompetition', () => {
    customElement = <Factsheet {...data} isCompetition />;
    const wrapper = shallow(customElement);
    expect(wrapper).toMatchSnapshot();
  });

  it('scrollTo event', () => {
    const wrapper = shallow(defaultElement);
    wrapper
      .find('Button')
      .first()
      .simulate('click');
    expect(mockCallbackScrollTo.mock.calls.length).toBe(1);
    expect(mockCallbackScrollTo.mock.calls[0][0]).toEqual('holdings');
  });

  it('shutdown event', () => {
    const wrapper = shallow(defaultElement);
    wrapper
      .find('Button')
      .last()
      .simulate('click');
    expect(mockCallbackShutdown.mock.calls.length).toBe(1);
  });
});
