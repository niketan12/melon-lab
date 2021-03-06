import * as R from 'ramda';
import {
  valueIn,
  subtract,
  createQuantity,
  greaterThan,
} from '@melonproject/token-math';

function fundRemainingInvestAmount(daiPrice, investmentAssetPrice, fundGav) {
  const maxCap = createQuantity(daiPrice.base.token, 5000);
  const maxCapInWeth = valueIn(daiPrice, maxCap);

  if (greaterThan(maxCapInWeth, fundGav)) {
    const remaining = subtract(maxCapInWeth, fundGav);
    return valueIn(investmentAssetPrice, remaining);
  }

  return createQuantity(investmentAssetPrice.base.token, 0);
}

export default R.curryN(3, fundRemainingInvestAmount);
