import { CrossChainWalletManager } from './cross-chain-wallet';
import { XRPLEVMNFTMinter } from './xrpl-evm-nft-minter';
import { CrossChainDIDManager } from './cross-chain-did-manager';
import { verifyUnichainNFT, createVerificationSignature } from './nft-verification';
import { 
  CrossChainAppState, 
  UnichainNFTData, 
  VerificationProof, 
  MirrorNFTResult, 
  DIDCreationResult,
  TetheringResult,
  TetheringData
} from '../types/cross-chain';

export class CrossChainNFTApp {
  private walletManager: CrossChainWalletManager;
  private nftMinter: XRPLEVMNFTMinter | null = null;
  private didManager: CrossChainDIDManager | null = null;
  private state: CrossChainAppState;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.walletManager = new CrossChainWalletManager();
    this.state = {
      isConnected: false,
      isVerified: false,
      walletAddresses: { evm: null, xrpl: null },
      status: { type: 'idle', message: 'Ready to connect wallets' }
    };
  }

  /**
   * Initialize the cross-chain verification process
   */
  async initialize(): Promise<void> {
    try {
      // Step 1: Connect multi-chain wallets
      this.updateStatus('connecting', 'Connecting to wallets...');
      const addresses = await this.walletManager.connectMultiChainWallet();
      
      this.state.isConnected = true;
      this.state.walletAddresses = addresses;
      
      this.updateStatus('connected', `Connected: EVM ${addresses.evm}, XRPL ${addresses.xrpl}`);
      this.emitEvent('wallet_connected', addresses);

      // Step 2: Verify and process NFTs
      await this.verifyAndProcess();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateStatus('error', errorMessage);
      this.emitEvent('error', { error: errorMessage });
    }
  }

  /**
   * Main verification and processing workflow
   */
  async verifyAndProcess(): Promise<void> {
    if (!this.state.walletAddresses.evm) {
      throw new Error('EVM wallet not connected');
    }

    try {
      // Step 2: Check Unichain NFT ownership
      this.updateStatus('checking', 'Checking Unichain NFT ownership...');
      const nftData = await verifyUnichainNFT(this.state.walletAddresses.evm);

      if (!nftData.hasNFTs) {
        this.updateStatus('denied', 'No qualifying NFTs found. Access denied.');
        return;
      }

      this.state.nftData = nftData;
      this.emitEvent('nft_verified', nftData);

      // Step 3: Request signature verification
      this.updateStatus('signing', 'Please sign to verify ownership...');
      const connection = this.walletManager.getConnectionStatus();
      
      if (!connection.evmSigner) {
        throw new Error('EVM signer not available');
      }

      const verificationProof = await createVerificationSignature(
        connection.evmSigner,
        this.state.walletAddresses.evm,
        nftData
      );

      // Step 4: Initialize components
      this.nftMinter = new XRPLEVMNFTMinter(
        connection.evmProvider,
        connection.evmSigner
      );

      if (!connection.xrplClient || !connection.xrplWallet) {
        throw new Error('XRPL connection not available');
      }

      this.didManager = new CrossChainDIDManager(
        connection.xrplClient,
        connection.xrplWallet
      );

      // Step 5: Mint mirror NFTs on XRPL EVM
      this.updateStatus('minting', 'Minting mirror NFTs on XRPL EVM...');
      const mirrorNFTs = await this.nftMinter.mintMirrorNFT(nftData, verificationProof);
      
      this.state.mirrorNFTs = mirrorNFTs;
      this.emitEvent('mirror_minted', mirrorNFTs);

      // Step 6: Create/Update DID on XRPL
      this.updateStatus('did', 'Creating DID on XRPL...');
      const didResult = await this.didManager.createOrUpdateDID(nftData, mirrorNFTs);
      
      this.state.didResult = didResult;
      this.emitEvent('did_created', didResult);

      // Step 7: Tether NFTs to DID (simplified - no Axelar in this version)
      this.updateStatus('tethering', 'Tethering NFTs to DID...');
      const tetheringResult = await this.createTetheringRecord(mirrorNFTs, didResult);
      
      this.state.tetheringResult = tetheringResult;
      this.emitEvent('tethering_complete', tetheringResult);

      // Success!
      this.state.isVerified = true;
      this.updateStatus('success', 'Cross-chain NFT verification and DID tethering complete!');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateStatus('error', errorMessage);
      this.emitEvent('error', { error: errorMessage, step: this.state.status.type });
    }
  }

  /**
   * Create tethering record (simplified version without Axelar)
   */
  private async createTetheringRecord(
    mirrorNFTs: MirrorNFTResult[],
    didResult: DIDCreationResult
  ): Promise<TetheringResult> {
    try {
      const tetheringData: TetheringData = {
        did: didResult.didDocument.id,
        xrpl_evm_nfts: mirrorNFTs.map(nft => ({
          contract: '0x742d35cc6634c0532925a3b8d0c8e86b8e8b8a3f', // Mirror NFT contract
          tokenId: nft.mirrorTokenId,
          transactionHash: nft.transactionHash
        })),
        tethering_timestamp: new Date().toISOString()
      };

      // In a full implementation, this would send a cross-chain message via Axelar
      // For now, we'll just record the tethering locally
      console.log('Tethering data created:', tetheringData);

      return {
        success: true,
        tethering: tetheringData
      };
    } catch (error) {
      throw new Error(`Tethering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update application status
   */
  private updateStatus(
    type: CrossChainAppState['status']['type'], 
    message: string
  ): void {
    this.state.status = { type, message };
    console.log(`Status: ${type} - ${message}`);
    this.emitEvent('status_update', this.state.status);
  }

  /**
   * Get current application state
   */
  getState(): CrossChainAppState {
    return { ...this.state };
  }

  /**
   * Check if verification is complete
   */
  isVerified(): boolean {
    return this.state.isVerified;
  }

  /**
   * Get verification results
   */
  getResults() {
    if (!this.state.isVerified) {
      return null;
    }

    return {
      originalNFTs: this.state.nftData,
      mirrorNFTs: this.state.mirrorNFTs,
      did: this.state.didResult,
      tethering: this.state.tetheringResult
    };
  }

  /**
   * Disconnect and reset
   */
  async disconnect(): Promise<void> {
    try {
      await this.walletManager.disconnect();
      
      this.state = {
        isConnected: false,
        isVerified: false,
        walletAddresses: { evm: null, xrpl: null },
        status: { type: 'idle', message: 'Disconnected' }
      };

      this.nftMinter = null;
      this.didManager = null;
      
      this.emitEvent('disconnected', {});
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  /**
   * Event management
   */
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event listener error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Retry verification process
   */
  async retry(): Promise<void> {
    if (!this.state.isConnected) {
      await this.initialize();
    } else {
      await this.verifyAndProcess();
    }
  }

  /**
   * Get wallet connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.state.isConnected,
      addresses: this.state.walletAddresses,
      fullyConnected: this.walletManager.isFullyConnected()
    };
  }

  /**
   * Re-verify NFT ownership (for real-time checks)
   */
  async reVerifyNFTs(): Promise<boolean> {
    if (!this.state.walletAddresses.evm) {
      return false;
    }

    try {
      const nftData = await verifyUnichainNFT(this.state.walletAddresses.evm);
      this.state.nftData = nftData;
      return nftData.hasNFTs;
    } catch (error) {
      console.error('Re-verification failed:', error);
      return false;
    }
  }
} 