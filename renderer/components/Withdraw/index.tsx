import React, { useState, Fragment } from 'react';
import * as R from 'ramda';
import ConvertForm from '~/components/ConvertForm';
import withForm from './withForm';
import { withRouter } from 'next/router';
import Composer from 'react-composer';
import { AccountConsumer } from '+/components/AccountContext';
import { withApollo } from 'react-apollo';
import { compose } from 'recompose';
import { BalanceConsumer } from '../BalanceContext';
import ModalTransaction from '../ModalTransaction';
import {
  estimateWithdrawMutation,
  executeWithdrawMutation,
} from '~/queries/withdraw.gql';

const ConvertFormContainer = withForm(props => <ConvertForm {...props} />);

const WithdrawContainer = ({ address, ...props }) => {
  const [convertValues, setConvertValues] = useState(null);

  return (
    <Composer components={[<AccountConsumer />, <BalanceConsumer />]}>
      {([accountProps, balanceProps]) => {
        const quantity = R.path(['quantity', 'quantity'], convertValues);

        return (
          <Fragment>
            <ConvertFormContainer
              {...props}
              address={address}
              setConvertValues={setConvertValues}
              account={accountProps}
              ethBalance={balanceProps.eth}
              wethBalance={balanceProps.weth}
              actionLabel="Unwrap Ether"
            />

            <ModalTransaction
              text={`The following method on the Melon Smart Contracts will be executed:`}
              open={!!quantity}
              step="withdraw"
              estimate={{
                mutation: estimateWithdrawMutation,
                variables: quantity && {
                  quantity: quantity.toString(),
                },
              }}
              execute={{
                mutation: executeWithdrawMutation,
                update: () => {
                  setConvertValues(null);
                  props.router.push('/wallet');
                },
                refetchQueries: () => ['BalanceQuery'],
              }}
              handleCancel={() => {
                setConvertValues(null);
              }}
            />
          </Fragment>
        );
      }}
    </Composer>
  );
};

export default compose(
  withRouter,
  withApollo,
)(WithdrawContainer);
