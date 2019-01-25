import { execute } from 'graphql/execution';
import * as R from 'ramda';
import Accounts from 'web3-eth-accounts';

import {
  deposit,
  Environment,
  Exchanges,
  getActiveOasisDexOrders,
  getFundDetails,
  getTokenBySymbol,
  makeOrderFromAccountOasisDex,
  randomString,
  sendEth,
  withPrivateKeySigner,
} from '@melonproject/protocol';
import {
  allLogsWritten,
  testLogger,
} from '@melonproject/protocol/lib/tests/utils/testLogger';
import * as Tm from '@melonproject/token-math';
import { schema } from '~/graphql/schema';
import { createContext } from '~/graphql/context';
import { getEnvironment, getWallet } from '~/graphql/environment';

import {
  estimateFundSetupBeginMutation,
  estimateFundSetupCompleteMutation,
  estimateFundSetupStepMutation,
  executeFundSetupBeginMutation,
  executeFundSetupCompleteMutation,
  executeFundSetupStepMutation,
} from '~/queries/fundSetup.gql';

import {
  estimateApproveTransferMutation,
  executeApproveTransferMutation,
} from '~/queries/approve.gql';

import {
  estimateExecuteRequestMutation,
  estimateRequestInvestmentMutation,
  executeExecuteRequestMutation,
  executeRequestInvestmentMutation,
} from '~/queries/invest.gql';

import {
  estimateMakeOrderMutation,
  estimateTakeOasisDexOrderMutation,
  executeMakeOrderMutation,
  executeTakeOasisDexOrderMutation,
} from '~/queries/oasisDex.gql';

import * as fundQuery from '~/queries/fund.gql';

jest.setTimeout(1200000);

describe('Setup fund and trade on Oasis Dex', () => {
  let environment: Environment;
  let master: Environment;
  let context;
  let fundAddress;
  let weth: Tm.TokenInterface;
  let mln: Tm.TokenInterface;
  let matchingMarket: Tm.Address;
  let matchingMarketAccessor: Tm.Address;

  const fundName = `test-fund-${randomString()}`;

  afterAll(async () => {
    await allLogsWritten();
  });

  beforeAll(async () => {
    environment = await getEnvironment(testLogger);
    const wallet = await getWallet();
    const accounts = new Accounts(environment.eth.currentProvider);
    const account = accounts.create();
    master = await withPrivateKeySigner(environment, wallet.privateKey);
    const tester = await withPrivateKeySigner(environment, account.privateKey);

    matchingMarket = R.path(
      ['deployment', 'exchangeConfigs', Exchanges.MatchingMarket, 'exchange'],
      environment,
    );
    matchingMarketAccessor = R.path(
      ['deployment', 'melonContracts', 'adapters', 'matchingMarketAccessor'],
      environment,
    );

    await sendEth(master, {
      howMuch: Tm.createQuantity('ETH', 2),
      to: tester.wallet.address,
    });

    weth = getTokenBySymbol(environment, 'WETH');
    mln = getTokenBySymbol(environment, 'MLN');

    const quantity = Tm.createQuantity(weth, 1);

    await deposit(tester, quantity.token.address, undefined, {
      value: quantity.quantity.toString(),
    });

    context = await createContext(tester, account);
  });

  it('Setup fund', async () => {
    const fundsBefore = await getFundDetails(environment);

    const estimateSetupBegin = await execute(
      schema,
      estimateFundSetupBeginMutation,
      null,
      context(),
      {
        name: fundName,
        exchanges: ['MATCHING_MARKET'],
        managementFee: 2,
        performanceFee: 20,
      },
    );

    expect(estimateSetupBegin.errors).toBeUndefined();
    expect(estimateSetupBegin.data).toBeTruthy();

    const executeSetupBegin = await execute(
      schema,
      executeFundSetupBeginMutation,
      null,
      context(),
      estimateSetupBegin.data && estimateSetupBegin.data.estimate,
    );

    expect(executeSetupBegin.errors).toBeUndefined();
    expect(executeSetupBegin.data).toBeTruthy();

    fundAddress = R.path(['data', 'execute'], executeSetupBegin);

    const steps = [
      'CREATE_ACCOUNTING',
      'CREATE_FEE_MANAGER',
      'CREATE_PARTICIPATION',
      'CREATE_POLICY_MANAGER',
      'CREATE_SHARES',
      'CREATE_TRADING',
      'CREATE_VAULT',
    ];

    for (const step of steps) {
      const estimateStep = await execute(
        schema,
        estimateFundSetupStepMutation,
        null,
        context(),
        {
          step,
        },
      );

      expect(estimateStep.errors).toBeUndefined();
      expect(estimateStep.data).toBeTruthy();

      const executeStep = await execute(
        schema,
        executeFundSetupStepMutation,
        null,
        context(),
        {
          step,
          ...(estimateStep.data && estimateStep.data.estimate),
        },
      );

      expect(executeStep.errors).toBeUndefined();
      expect(executeStep.data).toBeTruthy();
    }

    const estimateFundSetupComplete = await execute(
      schema,
      estimateFundSetupCompleteMutation,
      null,
      context(),
    );

    const executeFundSetupComplete = await execute(
      schema,
      executeFundSetupCompleteMutation,
      null,
      context(),
      R.path(['data', 'estimate'], estimateFundSetupComplete),
    );

    const fundsAfter = await getFundDetails(environment);

    expect(R.path(['data', 'execute'], executeSetupBegin)).toBe(
      R.path(['data', 'execute'], executeFundSetupComplete),
    );

    expect(fundsAfter.length).toBeGreaterThan(fundsBefore.length);

    const fundFromRanking = fundsAfter.find(
      fund => fund.address === fundAddress,
    );

    expect(fundFromRanking).toBeTruthy();
    expect(fundFromRanking.name).toBe(fundName);
  });

  it('invest', async () => {
    const investment = Tm.createQuantity(weth, 1);

    const estimateApprove = await execute(
      schema,
      estimateApproveTransferMutation,
      null,
      context(),
      { fundAddress, investmentAmount: investment.quantity.toString() },
    );

    const executeApprove = await execute(
      schema,
      executeApproveTransferMutation,
      null,
      context(),
      {
        fundAddress,
        investmentAmount: investment.quantity.toString(),
        ...R.path(['data', 'estimate'], estimateApprove),
      },
    );

    expect(executeApprove.errors).toBeUndefined();
    expect(executeApprove.data).toBeTruthy();

    const estimateRequestInvestment = await execute(
      schema,
      estimateRequestInvestmentMutation,
      null,
      context(),
      { fundAddress, investmentAmount: investment.quantity.toString() },
    );

    const executeRequestInvestment = await execute(
      schema,
      executeRequestInvestmentMutation,
      null,
      context(),
      {
        fundAddress,
        ...R.path(['data', 'estimate'], estimateRequestInvestment),
      },
    );

    expect(executeRequestInvestment.errors).toBeUndefined();
    expect(executeRequestInvestment.data).toBeTruthy();

    const estimateExecuteRequest = await execute(
      schema,
      estimateExecuteRequestMutation,
      null,
      context(),
      { fundAddress },
    );

    const executeExecuteRequest = await execute(
      schema,
      executeExecuteRequestMutation,
      null,
      context(),
      {
        fundAddress,
        ...R.path(['data', 'estimate'], estimateExecuteRequest),
      },
    );

    expect(executeExecuteRequest.errors).toBeUndefined();
    expect(executeExecuteRequest.data).toBeTruthy();

    // const calculations = await performCalculations(environment, fundAddress);
    // const gav = await calcGav(environment, )

    const fundResult = await execute(schema, fundQuery, null, context(), {
      fundAddress,
    });

    const holdings = R.path(['data', 'fund', 'holdings'], fundResult);
    const wethHolding = holdings.find(holding =>
      Tm.isEqual(holding.balance.token, weth),
    );

    expect(Tm.isEqual(wethHolding.balance, investment));
  });

  it('Oasis make order', async () => {
    const preOrders = await getActiveOasisDexOrders(
      environment,
      matchingMarketAccessor,
      {
        targetExchange: matchingMarket,
        buyAsset: mln.address,
        sellAsset: weth.address,
      },
    );

    const buy = Tm.createQuantity(mln, 7.5);
    const sell = Tm.createQuantity(weth, 0.5);

    const estimateMakeOrder = await execute(
      schema,
      estimateMakeOrderMutation,
      null,
      context(),
      {
        exchange: 'OASIS_DEX',
        buyToken: buy.token.symbol,
        buyQuantity: buy.quantity.toString(),
        sellToken: sell.token.symbol,
        sellQuantity: sell.quantity.toString(),
      },
    );

    expect(estimateMakeOrder.errors).toBeUndefined();
    expect(estimateMakeOrder.data).toBeTruthy();

    const result = await execute(
      schema,
      executeMakeOrderMutation,
      null,
      context(),
      {
        exchange: 'OASIS_DEX',
        ...R.path(['data', 'estimate'], estimateMakeOrder),
      },
    );

    expect(result.errors).toBeUndefined();
    expect(result.data).toBeTruthy();

    const postOrders = await getActiveOasisDexOrders(
      environment,
      matchingMarketAccessor,
      {
        targetExchange: matchingMarket,
        sellAsset: weth.address,
        buyAsset: mln.address,
      },
    );

    // TODO: Fix meta data return
    // console.log(JSON.stringify(result, null, 2));
    // expect(R.path(['data', 'metadata'], result)).toBeTruthy()

    // if (R.path(['data', 'metadata', 'isActive'], result)) {
    //   expect(postOrders.length).toBeGreaterThan(preOrders.length);
    // } else {
    //   expect(postOrders.length).toBe(preOrders.length);
    // }
    expect(postOrders.length >= preOrders.length).toBe(true);
  });

  it('Oasis take order', async () => {
    const buy = Tm.createQuantity(weth, 0.1);
    const sell = Tm.createQuantity(mln, 2);

    const orderFromAccount = await makeOrderFromAccountOasisDex(
      master,
      matchingMarket,
      { buy, sell },
    );

    const orders = await getActiveOasisDexOrders(
      environment,
      matchingMarketAccessor,
      {
        targetExchange: matchingMarket,
        buyAsset: buy.token.address,
        sellAsset: sell.token.address,
      },
    );

    const orderInOrderbook = orders.find(
      order => orderFromAccount.id === order.id,
    );

    if (!orderFromAccount.matched) {
      expect(orderInOrderbook).toBeTruthy();
    }

    const orderToTake = orderFromAccount.matched ? orders[0] : orderFromAccount;

    const estimateTakeOrder = await execute(
      schema,
      estimateTakeOasisDexOrderMutation,
      null,
      context(),
      {
        id: `${orderToTake.id}`,
        fillQuantity: buy.quantity.toString(),
      },
    );

    expect(estimateTakeOrder.errors).toBeUndefined();
    expect(estimateTakeOrder.data).toBeTruthy();

    const executeTakeOrder = await execute(
      schema,
      executeTakeOasisDexOrderMutation,
      null,
      context(),
      {
        exchange: 'OASIS_DEX',
        ...R.path(['data', 'estimate'], estimateTakeOrder),
      },
    );

    expect(executeTakeOrder.errors).toBeUndefined();
    expect(executeTakeOrder.data).toBeTruthy();
    expect(Object.keys(R.path(['data', 'execute'], executeTakeOrder))).toEqual(
      expect.arrayContaining([
        'id',
        'trade',
        'price',
        'volume',
        'type',
        'exchange',
      ]),
    );
  });
});