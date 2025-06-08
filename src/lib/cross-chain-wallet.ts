import { ethers } from 'ethers';
import * as xrpl from 'xrpl';
import { UserAddresses, WalletConnection } from '../types/cross-chain';
import { NETWORKS } from './cross-chain-config';

declare global {
  interface Window {
    ethereum?: any;
    xrpl?: any;
  }
}

export class CrossChainWalletManager {
  private evmProvider: ethers.BrowserProvider | null = null;
  private evmSigner: ethers.Signer | null = null;
  private xrplClient: xrpl.Client | null = null;
  private xrplWallet: xrpl.Wallet | null = null;
  
  public userAddresses: UserAddresses = {
    evm: null,
    xrpl: null
  };

  constructor() {
    // Initialize with default values
  }

  /**
   * Connect to both EVM and XRPL wallets
   */
  async connectMultiChainWallet(): Promise<UserAddresses> {
    try {
      // Connect EVM wallet (MetaMask)
      await this.connectEVMWallet();
      
      // Connect XRPL wallet
      await this.connectXRPLWallet();
      
      return this.userAddresses;
    } catch (error) {
      throw new Error(`Multi-chain connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Connect to EVM wallet (MetaMask)
   */
  private async connectEVMWallet(): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('EVM wallet not found. Please install MetaMask.');
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      this.evmProvider = new ethers.BrowserProvider(window.ethereum);
      this.evmSigner = await this.evmProvider.getSigner();
      this.userAddresses.evm = await this.evmSigner.getAddress();

      console.log('EVM wallet connected:', this.userAddresses.evm);
    } catch (error) {
      throw new Error(`EVM wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Connect to XRPL wallet
   */
  private async connectXRPLWallet(): Promise<void> {
    try {
      this.xrplClient = new xrpl.Client(NETWORKS.xrpl.testnet);
      await this.xrplClient.connect();
      
      // For demo purposes, we'll generate a wallet
      // In production, integrate with Xumm, GemWallet, or other XRPL wallets
      this.xrplWallet = xrpl.Wallet.generate();
      this.userAddresses.xrpl = this.xrplWallet.address;

      // Fund the wallet on testnet for demo
      if (this.xrplClient.isConnected()) {
        try {
          await this.xrplClient.fundWallet(this.xrplWallet);
          console.log('XRPL wallet funded:', this.userAddresses.xrpl);
        } catch (fundError) {
          console.warn('Could not fund XRPL wallet:', fundError);
        }
      }

      console.log('XRPL wallet connected:', this.userAddresses.xrpl);
    } catch (error) {
      throw new Error(`XRPL wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Switch EVM network
   */
  async switchEVMNetwork(chainId: string): Promise<void> {
    if (!window.ethereum) {
      throw new Error('EVM wallet not found');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Network not added, need to add it
        const networkConfig = this.getNetworkConfigByChainId(chainId);
        if (networkConfig) {
          await this.addEVMNetwork(networkConfig);
        } else {
          throw new Error(`Unknown network: ${chainId}`);
        }
      } else {
        throw switchError;
      }
    }

    // Update provider and signer after network switch
    this.evmProvider = new ethers.BrowserProvider(window.ethereum);
    this.evmSigner = await this.evmProvider.getSigner();
  }

  /**
   * Add EVM network to wallet
   */
  private async addEVMNetwork(networkConfig: any): Promise<void> {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${networkConfig.chainId.toString(16)}`,
        chainName: networkConfig.name,
        nativeCurrency: { name: 'XRP', symbol: 'XRP', decimals: 18 },
        rpcUrls: [networkConfig.rpc],
        blockExplorerUrls: [networkConfig.explorer]
      }],
    });
  }

  /**
   * Get network configuration by chain ID
   */
  private getNetworkConfigByChainId(chainId: string) {
    const numericChainId = parseInt(chainId, 16);
    
    if (numericChainId === NETWORKS.xrplEvm.devnet.chainId) {
      return NETWORKS.xrplEvm.devnet;
    }
    if (numericChainId === NETWORKS.xrplEvm.testnet.chainId) {
      return NETWORKS.xrplEvm.testnet;
    }
    if (chainId === NETWORKS.unichain.chainId) {
      return NETWORKS.unichain;
    }
    
    return null;
  }

  /**
   * Address conversion utilities
   */
  evmToXRPLAddress(evmAddress: string): string {
    try {
      const noPrefix = evmAddress.startsWith('0x') ? evmAddress.slice(2) : evmAddress;
      const accountIDBytes = Buffer.from(noPrefix, 'hex');
      return xrpl.encodeAccountID(accountIDBytes);
    } catch (error) {
      throw new Error(`Failed to convert EVM to XRPL address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  xrplToEVMAddress(xrplAddress: string): string {
    try {
      const accountIDBytes = xrpl.decodeAccountID(xrplAddress);
      return `0x${accountIDBytes.toString('hex')}`;
    } catch (error) {
      throw new Error(`Failed to convert XRPL to EVM address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect all wallets
   */
  async disconnect(): Promise<void> {
    if (this.xrplClient?.isConnected()) {
      await this.xrplClient.disconnect();
    }
    
    this.evmProvider = null;
    this.evmSigner = null;
    this.xrplClient = null;
    this.xrplWallet = null;
    this.userAddresses = { evm: null, xrpl: null };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): WalletConnection {
    return {
      evmProvider: this.evmProvider,
      evmSigner: this.evmSigner,
      xrplClient: this.xrplClient,
      xrplWallet: this.xrplWallet,
      userAddresses: this.userAddresses
    };
  }

  /**
   * Check if both wallets are connected
   */
  isFullyConnected(): boolean {
    return !!(
      this.evmProvider && 
      this.evmSigner && 
      this.xrplClient?.isConnected() && 
      this.xrplWallet &&
      this.userAddresses.evm &&
      this.userAddresses.xrpl
    );
  }
} 