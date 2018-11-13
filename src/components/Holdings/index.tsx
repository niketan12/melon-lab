import Holdings from '~/components/Holdings';
import Router from 'next/router';
import * as R from 'ramda';
import { toBigNumber } from '~/utils/functionalBigNumber';

const mapHoldings = R.curryN(2, (nav, asset) => ({
  ...asset,
  price: asset.price,
  fraction:
    asset &&
    nav &&
    toBigNumber(asset.balance)
      .times(asset.price)
      .div(nav.toString() || 1)
      .times(100),
  balance: asset.balance,
}));

const sortHoldings = R.sortWith([
  R.comparator((a, b) =>
    R.gt(parseInt(R.prop('fraction', a)), parseInt(R.prop('fraction', b))),
  ),
  R.ascend(R.prop('symbol')),
]);

export default class HoldingsContainer extends React.PureComponent {
  onClick(asset, address) {
    Router.push({
      pathname: '/manage',
      query: {
        address,
        base: asset.symbol,
        quote: 'WETH-T',
      },
    });
  }

  render() {
    const { address } = this.props;
    const holdings =
      (!this.props.loading &&
        (this.props.holdings || []) &&
        sortHoldings(this.props.holdings.map(mapHoldings(this.props.nav)))) ||
      [];

    return (
      <Holdings
        holdings={holdings}
        loading={this.props.loading}
        onClick={asset => this.onClick(asset, address)}
      />
    );
  }
}