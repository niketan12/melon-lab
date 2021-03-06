import { execute } from 'graphql/execution';
import * as R from 'ramda';
import Accounts from 'web3-eth-accounts';

import {
  deposit,
  Environment,
  Exchanges,
  getActiveOasisDexOrders,
  getFundDetails,
  getFundToken,
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
  EstimateRedeemMutation,
  ExecuteRedeemMutation,
} from '~/queries/redeem.gql';

import * as fundQuery from '~/queries/fund.gql';

jest.setTimeout(1200000);

describe('Setup fund and trade on Oasis Dex', () => {
  let environment: Environment;
  let master: Environment;
  let context;
  let investorContext;
  let fundAddress;
  let matchingMarket: Tm.Address;
  let matchingMarketAccessor: Tm.Address;
  let weth: Tm.TokenInterface;
  let mln: Tm.TokenInterface;

  const fundName = `test-fund-${randomString()}`;

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

  afterAll(async () => {
    await allLogsWritten();
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

  it('Redeem', async () => {
    const fundToken = await getFundToken(environment, fundAddress);

    const redemption = Tm.createQuantity(fundToken, 0.5);

    const estimateRedeem = await execute(
      schema,
      EstimateRedeemMutation,
      null,
      context(),
      { fundAddress, sharesQuantity: redemption.quantity.toString() },
    );

    expect(estimateRedeem.errors).toBeUndefined();
    expect(estimateRedeem.data).toBeTruthy();

    const executeRedeem = await execute(
      schema,
      ExecuteRedeemMutation,
      null,
      context(),
      {
        fundAddress,
        ...R.path(['data', 'estimate'], estimateRedeem),
      },
    );

    expect(executeRedeem.errors).toBeUndefined();
    // expect(executeRedeem.data).toBeTruthy();
  });
});
