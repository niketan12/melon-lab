import React from 'react';
import Composer from 'react-composer';
import * as R from 'ramda';
import { AccountConsumer } from '+/components/AccountContext';
import { BalanceConsumer } from '+/components/BalanceContext';
import { NetworkConsumer } from '+/components/NetworkContext';
import { CapabilityConsumer } from '+/components/CapabilityContext';
import { ConfigurationConsumer } from '+/components/ConfigurationContext';
import { FundManagerConsumer } from '+/components/FundManagerContext';
import Template from '~/templates/FundTemplate';
import FactSheet from '+/components/FactSheet';
import OrderBook from '+/components/OrderBook';
import OpenOrders from '+/components/OpenOrders';
import OrderForm from '+/components/OrderForm';
import Holdings from '+/components/Holdings';
import RecentTrades from '+/components/RecentTrades';
import OrderBookQuery from './data/orderbook';
import FundQuery from './data/fund';
import HoldingsQuery from './data/holdings';
import isSameAddress from '~/utils/isSameAddress';
import availableExchanges from '~/utils/availableExchanges';

const Context = ({ exchanges, address, quoteAsset, baseAsset, children }) => (
  <Composer
    components={[
      <AccountConsumer />,
      <BalanceConsumer />,
      <NetworkConsumer />,
      <CapabilityConsumer />,
      <ConfigurationConsumer />,
      <FundManagerConsumer />,
      <HoldingsQuery address={address} />,
      <OrderBookQuery
        exchanges={exchanges}
        baseAsset={baseAsset}
        quoteAsset={quoteAsset}
      />,
      ({ results: [account], render }) => (
        <FundQuery address={address} account={account} children={render} />
      ),
    ]}
  >
    {children}
  </Composer>
);

export default class FundTemplateContainer extends React.Component {
  state = {
    exchanges: availableExchanges.map(exchange => exchange.value),
    order: {
      price: '',
      orderType: 'Buy',
      strategy: 'Market',
      quantity: '',
      total: '',
      exchange: '',
    },
  };

  setExchanges = exchanges => {
    this.setState({
      exchanges,
    });
  };

  setOrder = order => {
    this.setState({
      order,
    });
  };

  render() {
    const { exchanges } = this.state;
    const { address, quoteAsset, baseAsset } = this.props;

    return (
      <Context
        exchanges={exchanges}
        address={address}
        quoteAsset={quoteAsset}
        baseAsset={baseAsset}
      >
        {([
          account,
          balances,
          network,
          capabibility,
          configuration,
          associatedFund,
          holdingsProps,
          orderBookProps,
          fundProps,
        ]) => {
          const holdingsData = R.pathOr([], ['data', 'fund', 'holdings'])(
            holdingsProps,
          );
          const fundData = R.pathOr({}, ['data', 'fund'])(fundProps);
          const orderBookData = R.pathOr({}, ['data', 'orderbook'])(
            orderBookProps,
          );
          const totalFunds = R.pathOr(0, ['data', 'totalFunds'])(fundProps);
          const isManager =
            !!associatedFund && isSameAddress(associatedFund, address);

          return (
            <Template
              HeaderProps={{
                ethBalance: balances && balances.eth,
                canInvest: capabibility && capabibility.canInvest,
                canInteract: capabibility && capabibility.canInteract,
                canonicalPriceFeedAddress:
                  configuration && configuration.canonicalPriceFeedAddress,
                network: network && network.network,
                currentBlock: network && network.currentBlock,
                blockOverdue: network && network.blockOverdue,
                nodeSynced: network && network.nodeSynced,
                priceFeedUp: network && network.priceFeedUp,
                address: account,
              }}
              FundHeadlineProps={{
                ...fundData,
                totalFunds,
                address,
                quoteAsset,
                loading: fundProps.loading,
              }}
              FactSheet={FactSheet}
              FactSheetProps={{
                fund: fundData,
                quoteAsset,
                address,
                totalFunds,
                loading: fundProps.loading,
                isManager,
              }}
              Holdings={Holdings}
              HoldingsProps={{
                address,
                quoteAsset,
                baseAsset,
                holdings: holdingsData,
                loading: fundProps.loading || holdingsProps.loading,
                nav: fundData && fundData.nav,
              }}
              OrderForm={OrderForm}
              OrderFormProps={{
                address,
                quoteAsset,
                baseAsset,
                holdings: holdingsData,
                formValues: this.state.order,
              }}
              OrderBook={OrderBook}
              OrderBookProps={{
                ...orderBookData,
                quoteAsset,
                baseAsset,
                loading: orderBookProps.loading,
                exchanges,
                availableExchanges,
                setExchanges: this.setExchanges,
                setOrder: this.setOrder,
                holdings: holdingsData,
                isManager: isManager,
              }}
              OpenOrders={OpenOrders}
              OpenOrdersProps={{
                address,
                isManager,
                // TODO: Compute this properly.
                isReadyToTrade: true,
              }}
              RecentTrades={RecentTrades}
              RecentTradesProps={{
                quoteAsset,
                baseAsset,
              }}
            />
          );
        }}
      </Context>
    );
  }
}