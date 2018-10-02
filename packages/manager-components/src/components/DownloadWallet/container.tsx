import { withFormik } from 'formik';
import { compose } from 'recompose';
import * as Yup from 'yup';
import DownloadWallet from './index';

const initialValues = {
  password: '',
};

const withFormValidation = withFormik({
  mapPropsToValues: props =>
    props.formValues ? { ...props.formValues } : initialValues,
  validationSchema: Yup.object().shape({
    password: Yup.string().required('Password is required.'),
  }),
  enableReinitialize: true,
  handleSubmit: (values, form) => {
    form.props.onSubmit && form.props.onSubmit(values);
    form.resetForm();
  },
});

export default compose(withFormValidation)(DownloadWallet);