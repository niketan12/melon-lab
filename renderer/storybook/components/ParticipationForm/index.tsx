import React, { Fragment, StatelessComponent } from 'react';
import * as Tm from '@melonproject/token-math';
import Button from '~/blocks/Button';
import Form from '~/blocks/Form';
import Input from '~/blocks/Input';
import Spinner from '~/blocks/Spinner';
import * as R from 'ramda';
import Notification from '~/blocks/Notification';

import styles from './styles.css';
import Dropdown from '~/blocks/Dropdown';

export interface FormValues {
  price: Tm.PriceInterface;
  quantity: Tm.QuantityInterface;
  total: Tm.QuantityInterface;
  type: string;
  asset: string;
}

export interface FormErrors {
  quantity?: string;
  total?: string;
  price?: string;
  asset?: string;
}

export interface ParticipationFormProps {
  decimals?: number;
  touched?: any;
  errors: FormErrors;
  values: FormValues;
  handleBlur?: () => void;
  handleSubmit?: () => void;
  handleChange?: () => void;
  executeRequest?: () => void;
  cancelRequest?: () => void;
  loading?: boolean;
  address?: string;
  sharePrice?: Tm.PriceInterface;
  isWaiting?: boolean;
  readyToExecute?: boolean;
  isInitialRequest?: boolean;
  isExpired?: boolean;
  ethBalance?: Tm.QuantityInterface;
  wethBalance?: Tm.QuantityInterface;
  allowedAssets: Tm.TokenInterface[];
}

const ParticipationForm: StatelessComponent<ParticipationFormProps> = ({
  decimals = 6,
  errors,
  handleBlur,
  handleSubmit,
  handleChange,
  touched,
  values,
  loading,
  sharePrice,
  isWaiting,
  readyToExecute,
  executeRequest,
  isInitialRequest,
  isExpired,
  cancelRequest,
  ethBalance,
  wethBalance,
  allowedAssets,
}) => {
  const numberPlaceholder = (0).toFixed(decimals);

  return (
    <Fragment>
      <style jsx>{styles}</style>
      {loading && (
        <div className="participation-form__spinner">
          <Spinner icon size="small" />
        </div>
      )}
      
      {!loading && allowedAssets.length === 0 && (
        <Notification isWarning>
          This fund does not currently allow investment.
        </Notification>
      )}

      {!loading && allowedAssets.length > 0 && (
        <div className="participation-form">      
          {isWaiting && !isExpired && (
            <Notification isWarning>
              You already requested an investment for this fund. Please wait!
            </Notification>
          )}

          {readyToExecute && (
            <Fragment>
              <Notification isWarning>
                Execute your investment request!
              </Notification>
              <hr />
              <Button onClick={executeRequest}>Execute Request</Button>
            </Fragment>
          )}

          {isExpired && (
            <Fragment>
              <Notification isWarning>Your request is expired!</Notification>
              <hr />
              <Button onClick={cancelRequest}>Cancel Request</Button>
            </Fragment>
          )}

          {!isWaiting && !readyToExecute && (
            <Fragment>
              <Form onSubmit={handleSubmit}>            
                <div className="participation-form__input">
                  <Input
                    value={
                      values.quantity && Tm.toFixed(values.quantity, decimals)
                    }
                    type="number"
                    label="Quantity (Shares)"
                    name="quantity"
                    insideLabel
                    placeholder={numberPlaceholder}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required={true}
                    formatNumber={true}
                    error={touched.quantity && errors.quantity}
                    decimals={decimals}
                  />
                </div>
                <div className="participation-form__current-price">
                  <span>
                    Current share price: {sharePrice && Tm.toFixed(sharePrice)}
                  </span>
                </div>

                <div className="participation-form__input">
                  <Dropdown
                    onChange={handleChange}
                    value={values.asset}
                    options={allowedAssets.map(token => ({
                      value: token.symbol,
                      name: token.symbol,
                    }))}
                    name="asset"
                  />
                </div>

                <div className="participation-form__input">
                  <Input
                    value={values.price && Tm.toFixed(values.price, decimals)}
                    type="number"
                    label={`Max price (${R.path(
                      ['quote', 'token', 'symbol'],
                      values.price,
                    )})`}
                    name="price"
                    insideLabel
                    placeholder={numberPlaceholder}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required={true}
                    formatNumber={true}
                    error={touched.price && errors.price}
                    decimals={decimals}
                    disabled={isInitialRequest}
                  />
                </div>
          
                <div className="participation-form__input">
                  <Input
                    value={values.total && Tm.toFixed(values.total, decimals)}
                    type="number"
                    label={`Total (${R.path(
                      ['token', 'symbol'],
                      values.total,
                    )})`}
                    name="total"
                    insideLabel
                    placeholder={numberPlaceholder}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required={true}
                    formatNumber={true}
                    error={touched.total && errors.total}
                    decimals={decimals}
                  />
                </div>

                <div className="participation-form__input">
                  <Button type="submit">Submit request</Button>
                </div>
              </Form>
            </Fragment>
          )}
        </div>
      )}
    </Fragment>
  );
};

export default ParticipationForm;
