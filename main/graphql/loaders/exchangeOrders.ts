import * as R from 'ramda';
import {
  exchanges,
  Exchange,
  Network,
} from '@melonproject/exchange-aggregator';
import {
  Environment,
  getTokenBySymbol,
  getChainName,
  constructEnvironment,
} from '@melonproject/protocol';

import { Kyber } from '@melonproject/exchange-aggregator/lib/exchanges/kyber/types';
import { OasisDex } from '@melonproject/exchange-aggregator/lib/exchanges/oasisdex/types';
import { Tracks } from '@melonproject/protocol/lib/utils/environment/Environment';
import { withDeployment } from '@melonproject/protocol/lib/utils/environment/withDeployment';
import { kyber } from '@melonproject/exchange-aggregator/lib/exchanges';

// HACK: We need to cache the open orders here (Signed Orders) to
const offChainOrders = new Map();
export const getOffChainOrder = id => offChainOrders.get(id);
export const addOffChainOrder = order => offChainOrders.set(order.id, order);

export default R.curryN(
  4,
  async (
    environment: Environment,
    exchange: Exchange,
    base: string,
    quote: string,
  ) => {
    const chain = await getChainName(environment);

    const options = {
      network: Network[chain.toUpperCase()],
      pair: {
        base: getTokenBySymbol(environment, base),
        quote: getTokenBySymbol(environment, quote),
      },
    };

    const result = await (() => {
      switch (exchange) {
        case 'OASIS_DEX':
          return exchanges.oasisdex.fetch({
            ...options,
            environment,
          } as OasisDex.WatchOptions);
        case 'RADAR_RELAY':
          return exchanges.radarrelay.fetch(options);
        case 'KYBER_NETWORK':
          return exchanges.kyber.fetch({
            ...options,
            environment,
          } as Kyber.FetchOptions);
        case 'ETHFINEX':
          return exchanges.ethfinex.fetch(options);
        default:
          return [];
      }
    })().catch(e => {
      console.error(e);
      return [];
    });

    return result;
  },
);
