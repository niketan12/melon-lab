import * as R from 'ramda';
import React, { StatelessComponent } from 'react';
import { compose } from 'recompose';
import Button from '~/blocks/Button';
import Dropdown from '~/blocks/Dropdown';
import Form from '~/blocks/Form';
import Input from '~/blocks/Input';
import OrderInfo from '~/blocks/OrderInfo';
import Switch from '~/blocks/Switch';
import { mapFormProps, withDefaultProps } from '~/containers/OrderForm';

import styles from './styles.css';

export interface OrderFormProps {
  form: {
    price: string;
    quantity: string;
    total: string;
    exchange: string;
    type: string;
  };
  onSubmit?: any;
  onChange?: any;
  info?: any;
  baseTokenSymbol?: string;
  quoteTokenSymbol?: string;
  strategy?: string;
  exchanges: Array<{
    name: string;
    label: string;
  }>;
  selectedOrder?: string;
  selectedExchange?: string;
}

const getValue = R.path(['target', 'value']);

export const OrderForm: StatelessComponent<OrderFormProps> = ({
  form,
  onSubmit,
  onChange,
  info,
  baseTokenSymbol,
  quoteTokenSymbol,
  strategy,
  exchanges,
  selectedOrder,
  selectedExchange,
}) => {
  const handleSubmit = (e, formData) => {
    e.preventDefault();
    console.log(formData);
  };

  const isMarket = strategy === 'Market' ? true : false;

  return (
    <Form className="order-form" onSubmit={onSubmit}>
      <style jsx>{styles}</style>
      <div className="order-form__switch">
        <Switch
          options={[baseTokenSymbol, quoteTokenSymbol]}
          // value={form.type ? form.type : 'Buy'}
          labels={['Buy', 'Sell']}
          onChange={R.compose(onChange('type'))}
        />
      </div>
      <div className="order-form__dropdown">
        <Dropdown
          name="exchange"
          value={form.exchange ? form.exchange : selectedExchange}
          options={exchanges}
          label="Exchange Server"
          onChange={R.compose(onChange('exchange'), getValue)}
        />
      </div>
      <div className="order-form__order-info">
        <OrderInfo {...info} />
      </div>
      <div className="order-form__input">
        <Input
          value={form.price}
          disabled={isMarket && !selectedOrder}
          type="number"
          label="Price"
          name="price"
          insideLabel="true"
          placeholder="0.0000"
          onChange={R.compose(onChange('price'), getValue)}
        />
      </div>
      <div className="order-form__input">
        <Input
          value={form.quantity}
          type="number"
          label="Quantity"
          name="quantity"
          insideLabel="true"
          placeholder="0.0000"
          onChange={R.compose(onChange('quantity'), getValue)}
        />
      </div>
      <div className="order-form__input">
        <Input
          value={form.total}
          type="number"
          label="Total"
          name="total"
          insideLabel="true"
          placeholder="0.0000"
          onChange={R.compose(onChange('total'), getValue)}
        />
      </div>
      <Button onClick={e => handleSubmit(e, form)} type="submit">
        Transfer
      </Button>
    </Form>
  );
};

export default compose(withDefaultProps, mapFormProps)(OrderForm);
