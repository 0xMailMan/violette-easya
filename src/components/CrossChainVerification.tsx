'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CrossChainNFTApp } from '../lib/cross-chain-app';
import { CrossChainAppState } from '../types/cross-chain';
import { ChevronRightIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface CrossChainVerificationProps {
  onVerificationComplete?: (results: any) => void;
  onError?: (error: string) => void;
}

export default function CrossChainVerification({ 
  onVerificationComplete, 
  onError 
}: CrossChainVerificationProps) {
  const [app] = useState(() => new CrossChainNFTApp());
  const [state, setState] = useState<CrossChainAppState>(app.getState());
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Update state when app state changes
  const updateState = useCallback(() => {
    setState(app.getState());
  }, [app]);

  useEffect(() => {
    // Set up event listeners
    const events = [
      'wallet_connected',
      'nft_verified', 
      'mirror_minted',
      'did_created',
      'tethering_complete',
      'status_update',
      'error'
    ];

    events.forEach(event => {
      app.addEventListener(event, updateState);
    });

    // Error handler
    app.addEventListener('error', (data: any) => {
      onError?.(data.error);
      setIsLoading(false);
    });

    // Success handler
    app.addEventListener('tethering_complete', (data: any) => {
      const results = app.getResults();
      if (results) {
        onVerificationComplete?.(results);
      }
      setIsLoading(false);
    });

    return () => {
      events.forEach(event => {
        app.removeEventListener(event, updateState);
      });
    };
  }, [app, updateState, onVerificationComplete, onError]);

  const handleStartVerification = async () => {
    setIsLoading(true);
    try {
      await app.initialize();
    } catch (error) {
      console.error('Verification failed:', error);
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsLoading(true);
    try {
      await app.retry();
    } catch (error) {
      console.error('Retry failed:', error);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await app.disconnect();
    setIsLoading(false);
  };

  const getStatusIcon = (status: CrossChainAppState['status']['type']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'error':
      case 'denied':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case 'idle':
        return <div className="w-6 h-6 bg-gray-300 rounded-full" />;
      default:
        return <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse" />;
    }
  };

  const getStatusColor = (status: CrossChainAppState['status']['type']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
      case 'denied':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'connecting':
      case 'checking':
      case 'signing':
      case 'minting':
      case 'did':
      case 'tethering':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderVerificationSteps = () => {
    const steps = [
      { key: 'connecting', label: 'Connect Wallets', status: state.isConnected ? 'complete' : 'pending' },
      { key: 'checking', label: 'Verify NFT Ownership', status: state.nftData ? 'complete' : 'pending' },
      { key: 'signing', label: 'Sign Verification', status: state.nftData ? 'complete' : 'pending' },
      { key: 'minting', label: 'Mint Mirror NFTs', status: state.mirrorNFTs ? 'complete' : 'pending' },
      { key: 'did', label: 'Create DID', status: state.didResult ? 'complete' : 'pending' },
      { key: 'tethering', label: 'Tether NFTs to DID', status: state.tetheringResult ? 'complete' : 'pending' },
    ];

    return (
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step.status === 'complete' 
                ? 'bg-green-100 border-green-500' 
                : state.status.type === step.key
                ? 'bg-blue-100 border-blue-500 animate-pulse'
                : 'bg-gray-100 border-gray-300'
            }`}>
              {step.status === 'complete' ? (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              ) : (
                <span className={`text-sm font-medium ${
                  state.status.type === step.key ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {index + 1}
                </span>
              )}
            </div>
            <span className={`text-sm font-medium ${
              step.status === 'complete' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {step.label}
            </span>
            {state.status.type === step.key && (
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderResults = () => {
    const results = app.getResults();
    if (!results) return null;

    return (
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-4">🎉 Verification Complete!</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Original NFTs (Unichain)</h4>
              <p className="text-sm text-gray-600">Found {results.originalNFTs?.nfts.length || 0} NFT(s)</p>
              <div className="mt-2 space-y-1">
                {results.originalNFTs?.nfts.map((nft: any, index: number) => (
                  <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                    Token ID: {nft.tokenId}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Mirror NFTs (XRPL EVM)</h4>
              <p className="text-sm text-gray-600">Minted {results.mirrorNFTs?.length || 0} mirror NFT(s)</p>
              <div className="mt-2 space-y-1">
                {results.mirrorNFTs?.map((nft: any, index: number) => (
                  <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                    Token ID: {nft.mirrorTokenId}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">DID Document (XRPL)</h4>
            <p className="text-sm text-gray-600">DID: {results.did?.didDocument.id}</p>
            <p className="text-xs text-gray-500 mt-1">
              Transaction: {results.did?.transactionHash}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">Cross-Chain Tethering</h4>
            <p className="text-sm text-gray-600">
              Status: {results.tethering?.success ? 'Complete' : 'Failed'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Timestamp: {results.tethering?.tethering.tethering_timestamp}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 text-sm text-green-600 hover:text-green-700 flex items-center"
        >
          {showDetails ? 'Hide' : 'Show'} Technical Details
          <ChevronRightIcon className={`ml-1 w-4 h-4 transform transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </button>

        {showDetails && (
          <div className="mt-4 p-3 bg-gray-100 rounded border text-xs">
            <pre className="whitespace-pre-wrap overflow-auto max-h-60">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Cross-Chain NFT Verification
        </h2>
        <p className="text-gray-600">
          Verify your Unichain NFT ownership and create cross-chain digital identity
        </p>
      </div>

      {/* Status Display */}
      <div className={`p-4 rounded-lg border mb-6 ${getStatusColor(state.status.type)}`}>
        <div className="flex items-center space-x-3">
          {getStatusIcon(state.status.type)}
          <div className="flex-1">
            <p className="font-medium">{state.status.message}</p>
            {state.walletAddresses.evm && (
              <p className="text-sm opacity-75 mt-1">
                EVM: {state.walletAddresses.evm.slice(0, 6)}...{state.walletAddresses.evm.slice(-4)}
              </p>
            )}
            {state.walletAddresses.xrpl && (
              <p className="text-sm opacity-75">
                XRPL: {state.walletAddresses.xrpl.slice(0, 6)}...{state.walletAddresses.xrpl.slice(-4)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Verification Steps */}
      {(state.isConnected || isLoading) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Verification Progress</h3>
          {renderVerificationSteps()}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {!state.isConnected && !isLoading && (
          <button
            onClick={handleStartVerification}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start Verification
          </button>
        )}

        {state.status.type === 'error' && (
          <button
            onClick={handleRetry}
            disabled={isLoading}
            className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Retrying...' : 'Retry'}
          </button>
        )}

        {state.status.type === 'denied' && (
          <div className="flex-1 bg-red-100 text-red-700 py-3 px-6 rounded-lg text-center">
            <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
            Access Denied - No qualifying NFTs found
          </div>
        )}

        {state.isConnected && (
          <button
            onClick={handleDisconnect}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Results */}
      {state.isVerified && renderResults()}

      {/* Loading Indicator */}
      {isLoading && state.status.type !== 'success' && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
} 