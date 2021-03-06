import React from 'react';
import gql from 'graphql-tag';
import { Mutation, Query } from 'react-apollo';

const loadWalletMutation = gql`
  mutation LoadWallet($password: String!) {
    loginWallet(password: $password)
  }
`;

const storedWalletQuery = gql`
  query GetWalletQuery {
    hasStoredWallet
  }
`;

const WalletQuery = ({ children }) => (
  <Query query={storedWalletQuery} ssr={false} errorPolicy="all">
    {children}
  </Query>
);

const WalletMutation = ({ onCompleted, children }) => (
  <Mutation
    mutation={loadWalletMutation}
    update={(cache, { data: { loginWallet } }) => {
      const allAccounts = loginWallet || null;
      const defaultAccount = (loginWallet && loginWallet[0]) || null;

      cache.writeQuery({
        query: gql`
          {
            allAccounts
            defaultAccount
            hasStoredWallet
          }
        `,
        data: {
          // We can safely set this to "true" even on the web client because
          // on the next refresh it will be automatically set to "false" through
          // the defaults anyways.
          hasStoredWallet: true,
          allAccounts,
          defaultAccount,
        },
      });
    }}
    onCompleted={onCompleted}
  >
    {children}
  </Mutation>
);

export { WalletQuery, WalletMutation };
