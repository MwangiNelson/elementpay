'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import Link from 'next/link';
import StaggeredMenu from '@/components/staggered-menu';
import { SignedIn, SignedOut, UserButton, SignInButton, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function WalletPage() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast.error('Authentication Required', {
        description: 'Please sign in to access your wallet.',
        duration: 4000,
      });
      router.push('/');
    }
  }, [isSignedIn, isLoaded, router]);

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#423ACC] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Staggered Menu with User Avatar */}
      <div className="absolute top-0 left-0 right-0 z-10 h-20">
        {/* User Avatar in top right corner - positioned before menu */}
        <div className="absolute top-6 right-6 z-30">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium text-[#423ACC] hover:text-[#352a99] transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>

        <StaggeredMenu
          items={[
            { label: 'Home', ariaLabel: 'Go to Home', link: '/' },
            { label: 'Connect Wallet', ariaLabel: 'Connect your wallet', link: '/wallet' },
            { label: 'Order', ariaLabel: 'Create an order', link: '/orders' }
          ]}
          displaySocials={false}
          accentColor="#423ACC"
          menuButtonColor="#423ACC"
          openMenuButtonColor="#423ACC"
        />
      </div>

      <div className="container mx-auto px-4 py-8 pt-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Wallet Connection
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Connect your crypto wallet to start creating orders
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {!isConnected ? (
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-[#423ACC]/10 rounded-full mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-[#423ACC]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  No Wallet Connected
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                  Connect your wallet to access ElementPay features. We support MetaMask, 
                  WalletConnect, and other popular wallets.
                </p>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Wallet Connected
                </h2>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address
                      </label>
                      <div className="bg-white dark:bg-gray-800 rounded-md p-2 border">
                        <code className="text-xs text-gray-900 dark:text-gray-100 break-all">
                          {address}
                        </code>
                      </div>
                    </div>
                    
                    {chain && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Network
                        </label>
                        <div className="bg-white dark:bg-gray-800 rounded-md p-2 border">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-900 dark:text-gray-100">
                              {chain.name} (ID: {chain.id})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/orders"
                    className="inline-flex items-center justify-center px-6 py-3 bg-[#423ACC] hover:bg-[#352a99] text-white font-medium rounded-lg transition-colors"
                  >
                    Create Order
                    <svg
                      className="w-5 h-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5-5 5M6 12h12"
                      />
                    </svg>
                  </Link>
                  
                  <button
                    onClick={() => disconnect()}
                    className="inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Features List */}
          <div className="mt-8">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Supported Features
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-[#423ACC]/10 rounded-lg flex items-center justify-center mr-2">
                  <svg
                    className="w-3 h-3 text-[#423ACC]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    MetaMask Support
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Connect using the most popular Ethereum wallet
                  </p>
                </div>
              </div>

              <div className="flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-[#423ACC]/10 rounded-lg flex items-center justify-center mr-2">
                  <svg
                    className="w-4 h-4 text-[#423ACC]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    WalletConnect
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Connect mobile wallets via QR code scanning
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

