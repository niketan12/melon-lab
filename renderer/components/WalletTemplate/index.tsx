import React from 'react';
import Composer from 'react-composer';
import WalletTemplate from '~/templates/WalletTemplate';
import { withRouter } from 'next/router';
import { AccountConsumer } from '+/components/AccountContext';
import { BalanceConsumer } from '+/components/BalanceContext';
import { NetworkConsumer } from '+/components/NetworkContext';
import { CapabilityConsumer } from '+/components/CapabilityContext';
import { ConfigurationConsumer } from '+/components/ConfigurationContext';

const WalletTemplateContainer = ({ router, title, text, icon, children }) => (
  <Composer
    components={[
      <AccountConsumer />,
      <BalanceConsumer />,
      <NetworkConsumer />,
      <CapabilityConsumer />,
      <ConfigurationConsumer />,
    ]}
  >
    {([account, balances, network, capabibility, configuration]) => {
      return (
        <WalletTemplate
          NavigationProps={
            account && {
              activePath: router.pathname,
              navigationItems: [
                {
                  name: 'Overview',
                  href: '/wallet/overview',
                },
                {
                  name: 'Settings',
                  href: '/wallet/settings',
                },
                {
                  name: 'Wrap Ether',
                  href: '/wallet/convert',
                },
                {
                  name: 'Unwrap Ether',
                  href: '/wallet/withdraw',
                },
              ],
            }
          }
          HeaderProps={{
            address: account,
            ethBalance: balances && balances.eth,
            canInvest: capabibility && capabibility.canInvest,
            canInteract: capabibility && capabibility.canInteract,
            canonicalPriceFeedAddress:
              configuration && configuration.melonContracts.priceSource,
            network: network && network.network,
            currentBlock: network && network.currentBlock,
            blockOverdue: network && network.blockOverdue,
            nodeSynced: network && network.nodeSynced,
            priceFeedUp: network && network.priceFeedUp,
          }}
          HeadlineProps={
            title && {
              title,
              text,
              icon,
            }
          }
          FooterProps={{
            priceFeedUpdate: network && network.priceFeedUpdate,
          }}
        >
          {children}
        </WalletTemplate>
      );
    }}
  </Composer>
);

export default withRouter(WalletTemplateContainer);
