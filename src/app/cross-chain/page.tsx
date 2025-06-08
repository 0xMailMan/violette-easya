'use client';

import React, { useState } from 'react';
import CrossChainVerification from '../../components/CrossChainVerification';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CrossChainPage() {
  const [verificationResults, setVerificationResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const handleVerificationComplete = (results: any) => {
    setVerificationResults(results);
    setError(null);
    console.log('✅ Cross-chain verification completed:', results);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setVerificationResults(null);
    console.error('❌ Cross-chain verification failed:', errorMessage);
  };

  const resetDemo = () => {
    setVerificationResults(null);
    setError(null);
    setShowDemo(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to App
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                Cross-Chain NFT Verification
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Demo
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Testnet
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        {!showDemo && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Cross-Chain NFT Access Control
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Verify your NFT ownership on Unichain and create a cross-chain digital identity 
                  that bridges multiple blockchain networks through XRPL's DID system.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Chain Verification</h3>
                  <p className="text-gray-600 text-sm">
                    Verify NFT ownership across Unichain and create mirror NFTs on XRPL EVM sidechain
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🆔</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">DID Integration</h3>
                  <p className="text-gray-600 text-sm">
                    Create W3C compliant Decentralized Identifiers on XRPL mainnet with cross-chain context
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔐</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Control</h3>
                  <p className="text-gray-600 text-sm">
                    Grant access to protected features based on verified cross-chain NFT ownership
                  </p>
                </div>
              </div>

              {/* Technical Overview */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Verification Flow</h4>
                    <ol className="text-sm text-gray-600 space-y-1">
                      <li>1. Connect EVM and XRPL wallets</li>
                      <li>2. Verify NFT ownership on Unichain</li>
                      <li>3. Create cryptographic proof of ownership</li>
                      <li>4. Mint mirror NFTs on XRPL EVM sidechain</li>
                      <li>5. Create DID document on XRPL mainnet</li>
                      <li>6. Tether NFTs to DID for cross-chain identity</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Supported Networks</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Unichain Sepolia Testnet</li>
                      <li>• XRPL EVM Devnet/Testnet</li>
                      <li>• XRPL Mainnet/Testnet</li>
                      <li>• Cross-chain messaging via Axelar (future)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Target Contract Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <div className="flex items-start">
                  <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Target NFT Contract</h4>
                    <p className="text-blue-800 text-sm mb-2">
                      This demo verifies ownership of NFTs from contract:
                    </p>
                    <code className="bg-blue-100 text-blue-900 px-2 py-1 rounded text-sm">
                      0x22C1f6050E56d2876009903609a2cC3fEf83B415
                    </code>
                    <p className="text-blue-700 text-xs mt-2">
                      Make sure you own NFTs from this contract on Unichain to test the verification.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowDemo(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Start Cross-Chain Verification
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo Section */}
        {showDemo && (
          <div className="mb-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Live Verification Demo</h3>
              <button
                onClick={resetDemo}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Reset Demo
              </button>
            </div>

            <CrossChainVerification
              onVerificationComplete={handleVerificationComplete}
              onError={handleError}
            />
          </div>
        )}

        {/* Results Display */}
        {verificationResults && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Verification Successful - Access Granted!
                </h3>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm">
                  🎉 Congratulations! Your cross-chain identity has been established. 
                  You now have verified access to protected features based on your NFT ownership.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Original NFTs</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {verificationResults.originalNFTs?.nfts.length || 0}
                  </p>
                  <p className="text-xs text-gray-600">Verified on Unichain</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Mirror NFTs</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {verificationResults.mirrorNFTs?.length || 0}
                  </p>
                  <p className="text-xs text-gray-600">Minted on XRPL EVM</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">DID Created</h4>
                  <p className="text-2xl font-bold text-green-600">✓</p>
                  <p className="text-xs text-gray-600">On XRPL Mainnet</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Cross-Chain Link</h4>
                  <p className="text-2xl font-bold text-orange-600">✓</p>
                  <p className="text-xs text-gray-600">NFTs → DID Tethered</p>
                </div>
              </div>

              {/* Protected Features Demo */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">🔓 Unlocked Features</h4>
                <p className="text-yellow-800 text-sm mb-3">
                  Based on your verified NFT ownership, you now have access to:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white rounded p-3 text-center">
                    <span className="text-lg">📊</span>
                    <p className="text-sm font-medium">Analytics Dashboard</p>
                  </div>
                  <div className="bg-white rounded p-3 text-center">
                    <span className="text-lg">💬</span>
                    <p className="text-sm font-medium">Exclusive Community</p>
                  </div>
                  <div className="bg-white rounded p-3 text-center">
                    <span className="text-lg">🎁</span>
                    <p className="text-sm font-medium">Special Rewards</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900 mb-1">Verification Failed</h4>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documentation */}
        {!showDemo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Guide</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">1. Install Dependencies</h4>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    npm install ethers xrpl @axelar-network/axelarjs-sdk
                  </code>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">2. Add Component</h4>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    import CrossChainVerification from './components/CrossChainVerification'
                  </code>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">3. Environment Variables</h4>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    NEXT_PUBLIC_MIRROR_NFT_CONTRACT=0x...<br/>
                    NEXT_PUBLIC_DID_REGISTRY_CONTRACT=0x...
                  </code>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Architecture Overview</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span><strong>Unichain:</strong> Source NFT verification</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span><strong>XRPL EVM:</strong> Mirror NFT minting</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span><strong>XRPL Mainnet:</strong> DID document storage</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span><strong>Cross-Chain:</strong> Tethering & messaging</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">
                  <strong>Note:</strong> This implementation provides a foundation for cross-chain 
                  NFT verification. For production use, deploy the smart contracts and configure 
                  the appropriate network endpoints.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 