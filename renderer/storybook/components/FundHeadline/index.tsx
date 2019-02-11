import React, { StatelessComponent, Fragment } from 'react';
import Spinner from '~/blocks/Spinner';
import Button from '~/blocks/Button';
import Link from '~/blocks/Link';
import displayQuantity from '~/shared/utils/displayQuantity';
import displayPrice from '~/shared/utils/displayPrice';
import * as Tm from '@melonproject/token-math';
import format from 'date-fns/format';

import styles from './styles.css';

export interface FundHeadlineProps {
  name?: string;
  sharePrice?: Tm.PriceInterface;
  gav?: Tm.QuantityInterface;
  rank?: string;
  totalFunds?: string;
  quoteAsset?: string;
  address?: string;
  track?: string;
  loading?: boolean;
  decimals?: number;
  inception?: string;
  personalStake?: Tm.QuantityInterface;
  totalSupply?: Tm.QuantityInterface;
  account?: string;
  isShutdown?: boolean;
  isManager?: boolean;
  handleShutDown: () => void;
  handleClaimRewards: () => void;
}

const FundHeadline: StatelessComponent<FundHeadlineProps> = ({
  name,
  sharePrice,
  gav,
  rank,
  totalFunds,
  address,
  track,
  loading,
  decimals = 4,
  inception,
  personalStake,
  totalSupply,
  account,
  isShutdown,
  isManager,
  handleShutDown,
  handleClaimRewards,
}) => {
  const etherscanUrl =
    track === 'live'
      ? `https://etherscan.io/address/${address}`
      : `https://kovan.etherscan.io/address/${address}`;

  return (
    <div className="fund-headline">
      <style jsx>{styles}</style>
      {loading ? (
        <div className="fund-headline__spinner">
          <Spinner icon size="small" />
        </div>
      ) : (
        <Fragment>
          <div className="fund-headline__headline">
            <h1 className="fund-headline__title">{name}</h1>
            <div className="fund-headline__links">
              <a
                href="https://ipfs.io/ipfs/Qmc9JRw4zarrs6gJwu6tC58UAgeEujNg9VMWcH8MUEd5TW/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact Investors/Managers
              </a>{' '}
              |{' '}
              <a href={etherscanUrl} target="_blank" rel="noopener noreferrer">
                View on Etherscan
              </a>
            </div>

            <div className="fund-headline__actions">
              {account && address && (
                <Fragment>
                  <div className="fund-headline__action">
                    <Link
                      href={{
                        pathname: '/invest',
                        query: {
                          address,
                        },
                      }}
                      style="primary"
                      size="small"
                    >
                      Invest
                    </Link>
                  </div>
                  <div className="fund-headline__action">
                    <Link
                      href={{
                        pathname: '/redeem',
                        query: {
                          address,
                        },
                      }}
                      style="primary"
                      size="small"
                    >
                      Redeem
                    </Link>
                  </div>
                  <div className="fund-headline__action">
                    <Button
                      onClick={handleClaimRewards}
                      style="primary"
                      size="small"
                    >
                      Claim rewards
                    </Button>
                  </div>
                </Fragment>
              )}
              {!isShutdown && isManager && (
                <div className="fund-headline__action">
                  <Fragment>
                    <Button
                      onClick={handleShutDown}
                      style="danger"
                      size="small"
                    >
                      Shut down
                    </Button>
                  </Fragment>
                </div>
              )}
            </div>
          </div>
          <div className="fund-headline__information">
            <div className="fund-headline__item">
              <div className="fund-headline__item-title">Share price</div>
              {sharePrice && displayPrice(sharePrice, decimals)}
              /Share
            </div>
            <div className="fund-headline__item">
              <div className="fund-headline__item-title">AUM</div>
              {gav && displayQuantity(gav, decimals)}
            </div>
            <div className="fund-headline__item">
              <div className="fund-headline__item-title">Ranking</div>
              {rank} out of {totalFunds}
            </div>
            <div className="fund-headline__item">
              <div className="fund-headline__item-title">Creation date</div>
              {inception && format(inception, 'DD. MMM YYYY HH:mm')}
            </div>
            <div className="fund-headline__item">
              <div className="fund-headline__item-title">
                Total number of shares
              </div>
              {totalSupply && Tm.toFixed(totalSupply)}
            </div>
            <div className="fund-headline__item">
              <div className="fund-headline__item-title">
                Shares owned by me
              </div>
              {personalStake && Tm.toFixed(personalStake)}
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
};

export default FundHeadline;
