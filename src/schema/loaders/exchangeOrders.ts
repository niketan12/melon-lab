import * as R from 'ramda';
import { filter } from 'rxjs/operators';
import { Exchange, Network } from '@melonproject/exchange-aggregator/lib/types';
import {
  getObservableRadarRelayOrders,
  standardizeStream as standarizeRadarRelayStream,
} from '@melonproject/exchange-aggregator/lib/exchanges/radar-relay';
import { isSnapshotEvent } from '@melonproject/exchange-aggregator/lib/exchanges';
import { createToken } from '@melonproject/token-math/token';
import takeLast from '../utils/takeLast';

export default R.curryN(
  4,
  (environment, exchange: Exchange, base: string, quote: string) => {
    switch (exchange) {
      case 'RADAR_RELAY': {
        const options = {
          network: Network.KOVAN,
          pair: {
            base: createToken(base),
            quote: createToken(quote),
          },
        };

        const stream$ = getObservableRadarRelayOrders(options);
        const standardized$ = standarizeRadarRelayStream(options, stream$).pipe(
          filter(isSnapshotEvent),
        );

        return takeLast(standardized$).then(data => data.orders);
      }

      default:
        return [];
    }
  },
);
