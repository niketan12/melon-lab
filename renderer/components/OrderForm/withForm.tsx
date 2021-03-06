import * as R from 'ramda';
import * as Tm from '@melonproject/token-math';
import { withFormik } from 'formik';
import { withHandlers, compose } from 'recompose';
import { FormErrors } from '~/components/OrderForm';

const withForm = withFormik({
  mapPropsToValues: props => props.formValues,
  enableReinitialize: true,
  validate: (values, props) => {
    const errors: FormErrors = {};

    if (!values.price) {
      errors.price = 'Required';
    } else if (Tm.isZero(values.price.quote)) {
      errors.price = 'Invalid price';
    }

    if (!values.quantity) {
      errors.quantity = 'Required';
    } else if (Tm.isZero(values.quantity)) {
      errors.quantity = 'Invalid quantity';
    } else if (
      Tm.greaterThan(values.quantity, props.baseToken) &&
      values.type === 'Sell'
    ) {
      errors.quantity = 'Insufficient balance';
    }

    if (!values.total) {
      errors.total = 'Required';
    } else if (Tm.isZero(values.total)) {
      errors.total = 'Invalid total';
    } else if (
      Tm.greaterThan(values.total, props.quoteToken) &&
      values.type === 'Buy'
    ) {
      errors.total = 'Insufficient balance';
    }

    if (
      values.exchange === 'MELON_ENGINE' &&
      Tm.greaterThan(
        R.pathOr('0', ['total', 'quantity'], values),
        R.pathOr('0', ['liquidEther', 'quantity'], props),
      )
    ) {
      errors.total = 'Not enough liquid ETH on Melon Engine';
    }

    return errors;
  },
  handleSubmit: (values, form) => form.props.setOrderFormValues(values),
});

const withFormHandlers = withHandlers({
  onChange: props => async event => {
    const { resetForm, setFieldValue, baseToken, quoteToken, values } = props;
    const { name, value } = event.target;

    // Reset form on exchange change
    if (name === 'exchange') {
      resetForm({
        price: '',
        quantity: '',
        total: '',
        exchange: value,
        id: null,
        signedOrder: null,
        strategy: values.strategy,
        type: values.type,
      });
    }

    if (name === 'type' || name === 'strategy') {
      setFieldValue(name, value);
    }

    if (name === 'price') {
      const price = Tm.createPrice(
        Tm.createQuantity(baseToken.token, 1),
        Tm.createQuantity(quoteToken.token, value || 0),
      );
      setFieldValue('price', price);

      if (values.quantity) {
        const total = Tm.valueIn(price, values.quantity);
        setFieldValue('total', total);
      }
    }

    if (name === 'quantity') {
      const quantity = Tm.createQuantity(baseToken.token, value || 0);
      setFieldValue('quantity', quantity);

      if (values.price) {
        const total = Tm.valueIn(values.price, quantity);
        setFieldValue('total', total);
      }
    }

    if (name === 'total') {
      const total = Tm.createQuantity(quoteToken.token, value || 0);
      setFieldValue('total', total);

      if (values.price) {
        const quantity = Tm.valueIn(values.price, total);
        setFieldValue('quantity', quantity);
      }
    }
  },
});

export default compose(
  withForm,
  withFormHandlers,
);
