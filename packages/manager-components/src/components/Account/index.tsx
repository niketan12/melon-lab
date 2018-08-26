import React, { Fragment, StatelessComponent } from 'react';
import Button from '~/blocks/Button';

import styles from './styles.css';

export interface AccountProps {
  associatedFund?: string;
  currentAddress?: string;
  deleteWallet: () => void;
  downloadJSON: () => void;
  gotoAccountGenerate: () => void;
  gotoAccountRestore: () => void;
  goToFund?: (associatedFund) => void;
  gotoImportJSON: () => void;
  gotoSetup: () => void;
  isCompetition?: boolean;
  networkId: string;
}

export const Account: StatelessComponent<AccountProps> = ({
  associatedFund,
  currentAddress,
  deleteWallet,
  downloadJSON,
  gotoAccountGenerate,
  gotoAccountRestore,
  goToFund,
  gotoImportJSON,
  gotoSetup,
  isCompetition,
  networkId,
}) => {
  const onClickGoToFund = () =>
    associatedFund && goToFund && goToFund(associatedFund);

  const isDanger = currentAddress ? 'danger' : 'secondary';

  return (
    <div className="account">
      <style jsx>{styles}</style>
      <h3>Your Wallet</h3>
      {currentAddress ? (
        <Fragment>
          <p>
            Your ethereum address. Use this for white listing on{' '}
            <a href="https://ico.bitcoinsuisse.ch/" target="_blank">
              ico.bitcoinsuisse.ch
            </a>
            :
            <strong>
              <a
                href={`https://${
                  networkId === '42' ? 'kovan.' : ''
                }etherscan.io/address/${currentAddress}`}
                target="_blank"
              >
                {' '}
                {currentAddress}{' '}
              </a>
            </strong>
          </p>
          {associatedFund && (
            <p>
              Associated fund address:{' '}
              <strong>
                <a
                  href={`https://${
                    networkId === '42' ? 'kovan.' : ''
                  }etherscan.io/address/${associatedFund}`}
                  target="_blank"
                >
                  {associatedFund}
                </a>
              </strong>
            </p>
          )}

          <p>
            <strong>
              It is highly recommended to download a backup of your wallet. You
              can import this into{' '}
              <a href="https://mycrypto.com/" target="_blank">
                MyCrypto.com
              </a>{' '}
              or Parity.
            </strong>
          </p>
          <p>
            <Button style="secondary" onClick={downloadJSON}>
              Download wallet backup JSON
            </Button>
          </p>
          {!associatedFund ? (
            <p>
              <Button style="success" onClick={gotoSetup}>
                Setup your fund
              </Button>
            </p>
          ) : (
            <p>
              <Button style="success" onClick={onClickGoToFund}>
                Go to your fund
              </Button>
            </p>
          )}
          <br />
          {!isCompetition && (
            <Fragment>
              <p>
                <strong> [IMPORTANT] - Please read carefully</strong>{' '}
              </p>
              <p>
                Careful, below actions have <strong> irreversible</strong>{' '}
                effects. If you do not have a backup of the mnemonic phrase that
                generated your current address,
                <strong>
                  {' '}
                  you will never be able to access your current wallet again{' '}
                </strong>{' '}
                after performing one of the below actions.
              </p>
              <p>
                If you do not wish to continue,{' '}
                <a href="/">click here to go back to your fund&#39;s page</a>.
              </p>
            </Fragment>
          )}
        </Fragment>
      ) : (
        <Fragment>
          <p>
            Before you can setup your fund, you need to import, restore or
            create a wallet:
          </p>
        </Fragment>
      )}

      <Fragment>
        {!isCompetition && (
          <p>
            <Button style={isDanger} onClick={gotoAccountGenerate}>
              Create a new wallet
            </Button>
          </p>
        )}
        <p>
          <Button style={isDanger} onClick={gotoAccountRestore}>
            Restore from mnemonic
          </Button>
        </p>
        <p>
          <Button style={isDanger} onClick={gotoImportJSON}>
            Import wallet JSON
          </Button>
        </p>
        {currentAddress &&
          !isCompetition && (
            <p>
              <Button style={isDanger} onClick={deleteWallet}>
                Delete wallet
              </Button>
            </p>
          )}
      </Fragment>
    </div>
  );
};

export default Account;
