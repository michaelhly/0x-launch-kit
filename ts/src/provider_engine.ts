import { Web3ProviderEngine } from '0x.js';
import { PrivateKeyWalletSubprovider } from '@0x/subproviders';

import { FEE_RECIPIENT_PRIVATE_KEY } from './config';

export const privateWallet = new PrivateKeyWalletSubprovider(FEE_RECIPIENT_PRIVATE_KEY as string);

export const pe = new Web3ProviderEngine();
pe.addProvider(privateWallet);
pe.start();

export const providerEngine = pe;
