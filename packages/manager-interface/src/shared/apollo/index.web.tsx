import generateMnemonic from '@melonproject/graphql-schema/loaders/wallet/generateMnemonic';
import restoreWallet from '@melonproject/graphql-schema/loaders/wallet/restoreWallet';
import importWallet from '@melonproject/graphql-schema/loaders/wallet/decryptWallet';
import estimateTransaction from '@melonproject/graphql-schema/loaders/transaction/estimateTransaction';
import sendTransaction from '@melonproject/graphql-schema/loaders/transaction/sendTransaction';
import createTransactionOptions from '@melonproject/graphql-schema/loaders/transaction/createTransactionOptions';
import createSetupFundParameters from '@melonproject/graphql-schema/loaders/transaction/setupFund/createParameters';
import postProcessSetupFund from '@melonproject/graphql-schema/loaders/transaction/setupFund/postProcess';
import { getParityProvider } from '@melonproject/melon.js';
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { withClientState } from 'apollo-link-state';
import { setContext } from 'apollo-link-context';
import { WebSocketLink } from 'apollo-link-ws';
import { Query as QueryBase } from 'react-apollo';
import { createErrorLink, createCache } from './common';
import withApollo from 'next-with-apollo';
import getConfig from 'next/config';

const { publicRuntimeConfig: config, serverRuntimeConfig: serverConfig } = getConfig();

// We must disable SSR in the electron app. Hence, we re-export
// the query components here so we can override the ssr flag.
export { Subscription, Mutation } from 'react-apollo';
export const Query = ({ errorPolicy, ...props }) => (
  <QueryBase {...props} errorPolicy={errorPolicy || 'all'} />
);

const createStateLink = (cache) => {
  // We only need the local overrides for the schema within the browser.
  // The server won't ever run these since the affected fields are generally
  // mutations or don't pose any security relevant thread. Even if they did,
  // they would be protected through our directives in the schema.
  if (!process.browser) {
    return withClientState({ cache });
  }

  const stateLink = withClientState({
    cache,
    defaults: {
      hasStoredWallet: false,
      defaultAccount: null,
      allAccounts: null,
    },
    resolvers: {
      Mutation: {
        generateMnemonic: () => {
          return generateMnemonic();
        },
        deleteWallet: () => {
          return true;
        },
        exportWallet: (_, { password }, { getWallet }) => {
          const wallet = getWallet();
          return wallet && wallet.encrypt(password) || null;
        },
        importWallet: (_, { wallet, password }, { setWallet }) => {
          return importWallet(wallet, password, (wallet) => {
            setWallet(wallet);
          });
        },
        restoreWallet: (_, { mnemonic, password }, { setWallet }) => {
          return restoreWallet(mnemonic, password, (wallet) => {
            setWallet(wallet);
          });
        },
        loginWallet: () => {
          throw new Error('The in-browser app does not support storing of wallets for security reasons.');
        },
        estimateSetupFund: async (_, { name, exchanges }, { environment, getWallet }) => {
          const wallet = getWallet();
          const parameters = await createSetupFundParameters(environment, wallet, name);
          const options = await createTransactionOptions(environment, wallet);
          return await estimateTransaction(environment, 'setupFund', parameters, options);
        },
        executeSetupFund: async (_, { name, exchanges, gasPrice, gasLimit }, { environment, getWallet }) => {
          const wallet = getWallet();
          const parameters = await createSetupFundParameters(environment, wallet, name);
          const options = await createTransactionOptions(environment, wallet);
          const receipt = await sendTransaction(environment, wallet, 'setupFund', parameters, {
            ...options,
            // TODO: Remove the parseInt() calls in the new melon.js.
            gasLimit: parseInt(gasLimit, 10),
            gasPrice: parseInt(gasPrice, 10),
          });

          return postProcessSetupFund(receipt);
        },
      },
    },
  });

  let contextSingleton;
  const stateContext = setContext(async () => {
    if (contextSingleton) {
      return contextSingleton;
    }

    let activeWallet;

    contextSingleton = {
      environment: {
        ...(await getParityProvider(config.jsonRpcRemote)),
        track: config.track,
      },
      getWallet: () => activeWallet,
      setWallet: (wallet) => {
        activeWallet = wallet;
      },
    };

    return contextSingleton;
  });

  return ApolloLink.from([stateContext, stateLink]);
};

export const createClient = options => {
  const cache = createCache();
  const stateLink = createStateLink(cache);
  const errorLink = createErrorLink();
  const dataLink = new WebSocketLink({
    uri: process.browser ? config.graphqlRemoteWs : serverConfig.graphqlLocalWs,
    options: {
      reconnect: true,
    },
  });

  const link = ApolloLink.from([errorLink, stateLink, dataLink]);
  const client = new ApolloClient({
    ssrMode: !process.browser,
    link,
    cache,
  });

  return client;
};

export default withApollo(options => {
  return createClient(options);
});
