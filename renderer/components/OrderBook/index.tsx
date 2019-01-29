import React, { useState } from 'react';
import * as R from 'ramda';
import OrderBook from '~/components/OrderBook';
import Composer from 'react-composer';
import { Query } from 'react-apollo';
import {
  isBidOrder,
  isAskOrder,
  sortOrders,
  reduceOrderVolumes,
} from '@melonproject/exchange-aggregator';
import availableExchanges from '~/shared/utils/availableExchanges';

import { OrdersQuery as query } from '~/queries/orderbook.gql';

const OrdersQuery = ({ exchange, baseAsset, quoteAsset, children }) => (
  <Query
    ssr={false}
    query={query}
    variables={{
      exchange,
      base: baseAsset,
      quote: quoteAsset,
    }}
  >
    {children}
  </Query>
);

const AggregatedOrders = ({ baseAsset, quoteAsset, exchanges, children }) => (
  <Composer
    components={exchanges.map(exchange => (
      <OrdersQuery
        exchange={exchange}
        quoteAsset={quoteAsset}
        baseAsset={baseAsset}
      />
    ))}
  >
    {orderResponses => {
      const loading = !!orderResponses.find(R.propEq('loading', true));
      const orders = [].concat(
        ...orderResponses.map(R.pathOr([], ['data', 'orders'])),
      );

      const asks = orders
        .filter(isAskOrder)
        .sort(sortOrders)
        .reverse()
        .reduce(reduceOrderVolumes, []);

      const bids = orders
        .filter(isBidOrder)
        .sort(sortOrders)
        .reduce(reduceOrderVolumes, []);

      return children({
        asks,
        bids,
        loading,
      });
    }}
  </Composer>
);

export default ({ baseAsset, quoteAsset, isManager, setOrder }) => {
  const [selectedExchanges, setExchanges] = useState(
    Object.keys(availableExchanges),
  );

  const updateExchanges = e => {
    const value = e.target.value;
    const tempExchanges = selectedExchanges;

    if (value === 'ALL') {
      if (
        selectedExchanges.length ===
        Object.keys(availableExchanges).map(([key]) => key).length
      ) {
        return setExchanges([]);
      }
      return setExchanges(Object.keys(availableExchanges));
    }
    if (!selectedExchanges.includes(value)) {
      tempExchanges.push(value);
    } else {
      const index = selectedExchanges.indexOf(value);
      tempExchanges.splice(index, 1);
    }

    return setExchanges(tempExchanges);
  };

  return (
    <AggregatedOrders
      exchanges={selectedExchanges}
      quoteAsset={quoteAsset}
      baseAsset={baseAsset}
    >
      {({ asks, bids, loading }) => (
        <OrderBook
          loading={loading}
          bids={bids}
          asks={asks}
          availableExchanges={Object.entries(availableExchanges)}
          setExchange={updateExchanges}
          selectedExchanges={selectedExchanges}
          isManager={isManager}
          setOrder={setOrder}
        />
      )}
    </AggregatedOrders>
  );
};
