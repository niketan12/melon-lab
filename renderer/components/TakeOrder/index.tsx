import ModalTransaction from '+/components/ModalTransaction';
import React from 'react';

import {
  EstimateTakeOrderMutation,
  ExecuteTakeOrderMutation,
} from '~/queries/takeOrder.gql';

export default props => {
  return (
    <ModalTransaction
      text="The following method on the Melon Smart Contracts will be executed: takeOrder"
      step="takeOrder"
      open={!!props.values && props.values.strategy === 'Market'}
      estimate={{
        mutation: EstimateTakeOrderMutation,
        variables: props.values && {
          id: props.values.id,
          exchange: props.values.exchange,
          buyToken:
            props.values.type === 'Buy'
              ? props.values.quantity.token.symbol
              : props.values.total.token.symbol,
          buyQuantity:
            props.values.type === 'Buy'
              ? props.values.quantity.quantity.toString()
              : props.values.total.quantity.toString(),
          sellToken:
            props.values.type === 'Buy'
              ? props.values.total.token.symbol
              : props.values.quantity.token.symbol,
          sellQuantity:
            props.values.type === 'Buy'
              ? props.values.total.quantity.toString()
              : props.values.quantity.quantity.toString(),
        },
      }}
      execute={{
        mutation: ExecuteTakeOrderMutation,
        variables: props.values && {
          exchange: props.values.exchange,
        },
        refetchQueries: () => [
          'FundQuery',
          'HoldingsQuery',
          'OrdersQuery',
          'OpenOrdersQuery',
        ],
        onCompleted: () => {
          props.resetForm({
            price: '',
            quantity: '',
            total: '',
            exchange: props.values.exchange,
            id: null,
            signedOrder: null,
            strategy: props.values.strategy,
            type: props.values.type,
          });
          props.setOrderFormValues(null);
        },
      }}
      handleCancel={() => {
        props.setOrderFormValues(null);
      }}
    />
  );
};
