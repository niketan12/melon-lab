import axios from 'axios';
import * as R from 'ramda';

import * as Tm from '@melonproject/token-math';
import {
  withDifferentAccount,
  getTokenBySymbol,
  makeOasisDexOrder,
  createOrder,
  withPrivateKeySigner,
  make0xOrder,
  Exchanges,
  signOrder,
  stringifyStruct,
} from '@melonproject/protocol';
import { getWallet } from '../environment';

const DAY_IN_SECONDS = 24 * 60 * 60;

const estimateMakeOrder = async (
  _,
  { from, exchange, buyToken, buyQuantity, sellToken, sellQuantity },
  { environment, loaders },
) => {
  const fund = await loaders.fundAddressFromManager.load(from);
  const { tradingAddress, accountingAddress } = await loaders.fundRoutes.load(
    fund,
  );
  const env = withDifferentAccount(environment, new Tm.Address(from));
  const denominationAsset = await loaders.fundDenominationAsset.load(
    accountingAddress,
  );

  const makerQuantity = Tm.createQuantity(
    getTokenBySymbol(environment, sellToken),
    sellQuantity,
  );
  const takerQuantity = Tm.createQuantity(
    getTokenBySymbol(environment, buyToken),
    buyQuantity,
  );

  if (exchange === 'OASIS_DEX') {
    const result = await makeOasisDexOrder.prepare(env, tradingAddress, {
      makerQuantity,
      takerQuantity,
    });

    return result && result.rawTransaction;
  }

  if (exchange === 'RADAR_RELAY') {
    const zeroExAddress = R.path(
      ['deployment', 'exchangeConfigs', Exchanges.ZeroEx, 'exchange'],
      env,
    );

    const type = Tm.isEqual(makerQuantity.token, denominationAsset)
      ? 'buy'
      : 'sell';

    const quantity = type === 'buy' ? takerQuantity : makerQuantity;
    const total = type === 'buy' ? makerQuantity : takerQuantity;
    const price = Tm.normalize(Tm.createPrice(quantity, total));

    try {
      // TODO: Refactor this into a directive
      const wallet = loaders.getWallet();
      const withSigner = await withPrivateKeySigner(
        environment,
        wallet.privateKey,
      );

      const options = {
        type,
        quantity: quantity.quantity.toString(),
        price: Tm.toFixed(price.quote, price.quote.token.decimals),
        expiration: (Math.round(Date.now() / 1000) + DAY_IN_SECONDS).toString(),
      };

      const response = await axios.post(
        'https://api.kovan.radarrelay.com/v2/markets/mlnt-weth/order/limit',
        options,
      );

      const unsignedOrder = {
        ...R.omit(
          ['makerAddress', 'signature', 'makerAssetAmount', 'takerAssetAmount'],
          response.data,
        ),
        makerAddress: tradingAddress.toLowerCase(),
        makerAssetAmount: makerQuantity.quantity.toString(),
        takerAssetAmount: takerQuantity.quantity.toString(),
      };

      const orderFromProtocol = await createOrder(env, zeroExAddress, {
        makerQuantity,
        takerQuantity,
        makerAddress: tradingAddress,
        feeRecipientAddress: unsignedOrder.feeRecipientAddress,
      });

      const signedOrder = await signOrder(withSigner, orderFromProtocol);

      const result = await make0xOrder.prepare(env, tradingAddress, {
        signedOrder,
      });

      return (
        result && {
          ...result.rawTransaction,
          signedOrder: JSON.stringify(stringifyStruct(signedOrder)),
        }
      );
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  throw new Error(`Make order not implemented for ${exchange}`);
};

export { estimateMakeOrder };
