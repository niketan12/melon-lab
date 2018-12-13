import DataLoader from 'dataloader';
import memoizeOne from 'memoize-one';
import * as R from 'ramda';
import { pluck, map } from 'rxjs/operators';
import takeLast from './utils/takeLast';
import importWallet from './loaders/wallet/decryptWallet';
import restoreWallet from './loaders/wallet/restoreWallet';
import generateMnemonic from './loaders/wallet/generateMnemonic';
import getFundInception from './loaders/fund/fundInception';
import getFundModules from './loaders/fund/fundModules';
import getFundOwner from './loaders/fund/fundOwner';
import getFundName from './loaders/fund/fundName';
import getFundSettings from './loaders/fund/fundSettings';
import getFundHoldings from './loaders/fund/fundHoldings';
import getFundTotalSupply from './loaders/fund/fundTotalSupply';
import getFundCalculations from './loaders/fund/fundCalculations';
import getFundOpenOrders from './loaders/fund/fundOpenOrders';
import getFundAddressFromManager from './loaders/fund/fundAddressFromManager';
import getFundIsShutdown from './loaders/fund/fundIsShutdown';
import getRecentTrades from './loaders/recentTrades';
import getQuoteToken from './loaders/quoteToken';
import getAssetPrice from './loaders/assetPrice';
import getStepFor from './loaders/stepFor';
import getSymbolBalance from './loaders/symbolBalance';
import getSymbolBalanceObservable from './loaders/symbolBalanceObservable';
import resolveNetwork from './utils/resolveNetwork';

export default (environment, streams) => {
  const fundAddressFromManager = new DataLoader(addresses => {
    const fn = getFundAddressFromManager(environment);
    return Promise.all(addresses.map(fn) || []);
  });

  const fundName = new DataLoader(addresses => {
    const fn = getFundName(environment);
    return Promise.all(addresses.map(fn) || []);
  });

  const fundReady = new DataLoader(async addresses => {
    const settings = await fundSettings.loadMany(addresses);
    return Promise.all(
      addresses.map((address, key) => {
        return !!(settings && settings[key]);
      }),
    );
  });

  const fundOwner = new DataLoader(addresses => {
    const fn = getFundOwner(environment);
    return Promise.all(addresses.map(fn) || []);
  });

  const fundSettings = new DataLoader(addresses => {
    const fn = getFundSettings(environment);
    return Promise.all(addresses.map(fn) || []);
  });

  const fundTotalSupply = new DataLoader(async addresses => {
    const settings = await fundSettings.loadMany(addresses);
    return Promise.all(
      addresses.map((address, key) => {
        const { sharesAddress } = settings[key] || {
          sharesAddress: null,
        };

        return sharesAddress && getFundTotalSupply(environment, sharesAddress);
      }),
    );
  });

  const fundRank = new DataLoader(async addresses => {
    const ranking = (await takeLast(streams.ranking$)) || [];
    return Promise.all(
      addresses.map(address => {
        const entry = R.find(R.propEq('address', address), ranking);
        return R.propOr(0, 'rank', entry);
      }),
    );
  });

  const fundInception = new DataLoader(addresses => {
    const fn = getFundInception(environment);
    return Promise.all(addresses.map(fn) || []);
  });

  const fundModules = new DataLoader(addresses => {
    const fn = getFundModules(environment);
    return Promise.all(addresses.map(fn) || []);
  });

  const fundCalculations = new DataLoader(async addresses => {
    const settings = await fundSettings.loadMany(addresses);
    return Promise.all(
      addresses.map((address, key) => {
        const { accountingAddress } = settings[key] || {
          accountingAddress: null,
        };

        return (
          accountingAddress &&
          getFundCalculations(environment, accountingAddress)
        );
      }),
    );
  });

  const fundHoldings = new DataLoader(async addresses => {
    const settings = await fundSettings.loadMany(addresses);
    return Promise.all(
      addresses.map((address, key) => {
        const { accountingAddress } = settings[key] || {
          accountingAddress: null,
        };

        return (
          accountingAddress && getFundHoldings(environment, accountingAddress)
        );
      }),
    );
  });

  const fundOpenOrders = new DataLoader(addresses => {
    const fn = getFundOpenOrders(environment);
    return Promise.all(addresses.map(fn) || []);
  });

  const fundIsShutdown = new DataLoader(addresses => {
    const fn = getFundIsShutdown(environment);
    return Promise.all(addresses.map(fn) || []);
  });

  const fundParticipation = new DataLoader(
    async pairs => {
      const funds = pairs.map(pair => pair.fund);
      const investors = pairs.map(pair => pair.investor);
      const settings = await fundSettings.loadMany(funds);
      return Promise.all(
        investors.map((investor, key) => {
          const { sharesAddress } = settings[key] || {
            sharesAddress: null,
          };

          return (
            sharesAddress &&
            getFundParticipation(environment, sharesAddress, investor)
          );
        }),
      );
    },
    {
      cacheKeyFn: pair => `${pair.fund}:${pair.investor}`,
    },
  );

  const fundByName = new DataLoader(async names => {
    const ranking = await fundRanking();
    return Promise.all(
      names.map(name => {
        const entry = R.find(R.propEq('name', name), ranking);
        return R.prop('address', entry);
      }),
    );
  });

  const stepFor = new DataLoader(addresses => {
    const fn = getStepFor(environment);
    return Promise.all(addresses.map(fn) || []);
  });

  const symbolBalance = new DataLoader(
    async pairs => {
      const fn = getSymbolBalance(environment);
      const result = pairs.map(pair => fn(pair.symbol, pair.address));
      return Promise.all(result || []);
    },
    {
      cacheKeyFn: pair => `${pair.symbol}:${pair.address}`,
    },
  );

  const symbolBalanceObservable = new DataLoader(
    async pairs => {
      const fn = getSymbolBalanceObservable(environment, streams);
      const result = pairs.map(pair => fn(pair.symbol, pair.address));
      return Promise.all(result || []);
    },
    {
      cacheKeyFn: pair => `${pair.symbol}:${pair.address}`,
    },
  );

  const recentTrades = new DataLoader(
    pairs => {
      const fn = getRecentTrades(environment);
      const result = pairs.map(pair => fn(pair.base, pair.quote));
      return Promise.all(result || []);
    },
    {
      cacheKeyFn: pair => `${pair.base}:${pair.quote}`,
    },
  );

  const assetPrice = new DataLoader(
    tokens => {
      const fn = getAssetPrice(environment);
      return Promise.all(tokens.map(fn) || []);
    },
    {
      cacheKeyFn: token => `${token.symbol}`,
    },
  );

  const quoteToken = memoizeOne(() => {
    return getQuoteToken(
      environment,
      environment.deployment.melonContracts.priceSource,
    );
  });

  const fundRanking = memoizeOne(() => {
    return takeLast(streams.ranking$);
  });

  const currentBlock = memoizeOne(() => {
    return takeLast(streams.block$.pipe(pluck('number')));
  });

  const nodeSynced = memoizeOne(() => {
    return takeLast(streams.syncing$.pipe(map(value => !value)));
  });

  const priceFeedUp = memoizeOne(() => {
    return takeLast(streams.recentPrice$);
  });

  const peerCount = memoizeOne(() => {
    return takeLast(streams.peers$);
  });

  const versionDeployment = memoizeOne(() => {
    return environment.deployment;
  });

  const networkName = memoizeOne(async () => {
    return resolveNetwork(await environment.eth.net.getId());
  });

  return {
    fundReady,
    fundRanking,
    fundByName,
    fundAddressFromManager,
    fundName,
    fundInception,
    fundModules,
    fundOwner,
    fundRank,
    fundTotalSupply,
    fundCalculations,
    fundHoldings,
    fundOpenOrders,
    fundParticipation,
    fundSettings,
    fundIsShutdown,
    stepFor,
    assetPrice,
    recentTrades,
    symbolBalance,
    symbolBalanceObservable,
    generateMnemonic,
    importWallet,
    restoreWallet,
    quoteToken,
    currentBlock,
    nodeSynced,
    priceFeedUp,
    peerCount,
    versionDeployment,
    networkName,
  };
};
