'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { CreateOrderRequest, Order, OrderStatus } from '@/types';
import { BorderBeam } from "@/components/magicui/border-beam";
import StaggeredMenu from '@/components/staggered-menu';
import { SignedIn, SignedOut, UserButton, SignInButton, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface FormData {
  amount: string;
  currency: string;
  token: string;
  note: string;
}

interface FormErrors {
  amount?: string;
  currency?: string;
  token?: string;
}

export default function OrdersPage() {
  const { isConnected } = useAccount();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // All hooks must be called before any conditional returns
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    currency: 'KES',
    token: 'USDC',
    note: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showReceiptCard, setShowReceiptCard] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const webhookListenerRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast.error('Authentication Required', {
        description: 'Please sign in to create orders.',
        duration: 4000,
      });
      router.push('/');
    }
  }, [isSignedIn, isLoaded, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (webhookListenerRef.current) {
        webhookListenerRef.close();
      }
    };
  }, []);

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


  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    if (!formData.token) {
      newErrors.token = 'Token is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setShowProcessingModal(true);

    try {
      const orderData: CreateOrderRequest = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        token: formData.token,
        note: formData.note || undefined,
      };

      const response = await fetch('/api/mock/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order: Order = await response.json();
      setCurrentOrder(order);
      startOrderTracking(order.order_id);
    } catch (error) {
      console.error('Error creating order:', error);
      setShowProcessingModal(false);
      // Handle error (you could show an error toast here)
    } finally {
      setIsSubmitting(false);
    }
  };

  const startOrderTracking = (orderId: string) => {
    setIsPolling(true);
    setTimeoutReached(false);

    // Start polling every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/mock/orders/${orderId}`);
        if (response.ok) {
          const order: Order = await response.json();
          setCurrentOrder(order);

          if (order.status === 'settled' || order.status === 'failed') {
            finalizeOrder();
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    // Set 60-second timeout
    timeoutRef.current = setTimeout(() => {
      setTimeoutReached(true);
      finalizeOrder();
    }, 60000);

    // Start webhook listener (simulated with Server-Sent Events)
    startWebhookListener(orderId);
  };

  const startWebhookListener = (orderId: string) => {
    // In a real app, you'd set up a WebSocket or SSE connection
    // For this demo, we'll simulate webhook updates
    // The webhook endpoint we created would normally push updates to a queue/database
    // and this would listen for those updates
  };

  const finalizeOrder = () => {
    setIsPolling(false);
    setShowProcessingModal(false);
    setShowReceiptCard(true);

    // Cleanup
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (webhookListenerRef.current) {
      webhookListenerRef.current.close();
      webhookListenerRef.current = null;
    }
  };

  const handleRetry = () => {
    setShowReceiptCard(false);
    setTimeoutReached(false);
    setCurrentOrder(null);
  };

  const handleNewOrder = () => {
    setShowReceiptCard(false);
    setCurrentOrder(null);
    setFormData({
      amount: '',
      currency: 'KES',
      token: 'USDC',
      note: '',
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Staggered Menu */}
        <div className="absolute top-0 left-0 right-0 z-10 h-20">
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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Create Order</h1>
          </div>

          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Wallet Required</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
              You need to connect your wallet before creating orders.
            </p>
            <Link
              href="/wallet"
              className="inline-flex items-center px-6 py-3 bg-[#423ACC] hover:bg-[#352a99] text-white font-medium rounded-lg transition-colors"
            >
              Connect Wallet
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Create Order</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Create a new crypto payment order
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {!showReceiptCard ? (
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 overflow-hidden">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#423ACC] focus:border-[#423ACC] dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter amount"
                    disabled={isSubmitting}
                  />
                  {errors.amount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>}
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency *
                  </label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#423ACC] focus:border-[#423ACC] dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm ${
                      errors.currency ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                  {errors.currency && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currency}</p>}
                </div>

                <div>
                  <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Token *
                  </label>
                  <select
                    id="token"
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#423ACC] focus:border-[#423ACC] dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm ${
                      errors.token ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="USDC">USDC - USD Coin</option>
                    <option value="USDT">USDT - Tether</option>
                    <option value="DAI">DAI - Dai Stablecoin</option>
                    <option value="ETH">ETH - Ethereum</option>
                  </select>
                  {errors.token && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.token}</p>}
                </div>

                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Note (Optional)
                  </label>
                  <textarea
                    id="note"
                    rows={2}
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#423ACC] focus:border-[#423ACC] dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    placeholder="Add a note to your order"
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-[#423ACC] hover:bg-[#352a99] disabled:bg-[#423ACC]/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Order...
                    </>
                  ) : (
                    'Create Order'
                  )}
                </button>
              </form>
              <BorderBeam duration={8} size={100} colorFrom="#423ACC" colorTo="#9c40ff" />
            </div>
          ) : (
            <ReceiptCard 
              order={currentOrder}
              timeoutReached={timeoutReached}
              onRetry={handleRetry}
              onNewOrder={handleNewOrder}
            />
          )}
        </div>
      </div>

      {/* Processing Modal */}
      {showProcessingModal && (
        <ProcessingModal order={currentOrder} />
      )}
    </div>
  );
}

// Processing Modal Component
function ProcessingModal({ order }: { order: Order | null }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-6">
            <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Processing Order
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please wait while we process your payment order...
          </p>
          {order && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p><strong>Order ID:</strong> {order.order_id}</p>
                <p><strong>Status:</strong> <span className="capitalize">{order.status}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Receipt Card Component
function ReceiptCard({ 
  order, 
  timeoutReached, 
  onRetry, 
  onNewOrder 
}: { 
  order: Order | null;
  timeoutReached: boolean;
  onRetry: () => void;
  onNewOrder: () => void;
}) {
  if (timeoutReached) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full mx-auto mb-6">
          <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Order Timed Out
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          The order processing took too long. Please try again.
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!order) return null;

  const isSettled = order.status === 'settled';
  const isFailed = order.status === 'failed';

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 overflow-hidden">
      <div className="text-center mb-8">
        <div className={`flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-6 ${
          isSettled ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
        }`}>
          {isSettled ? (
            <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Order {isSettled ? 'Completed' : 'Failed'}
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          {isSettled 
            ? 'Your payment order has been successfully processed.' 
            : 'There was an issue processing your payment order.'
          }
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Order Details</h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Order ID:</span>
            <span className="font-mono text-gray-900 dark:text-white">{order.order_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Amount:</span>
            <span className="text-gray-900 dark:text-white">{order.amount} {order.currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Token:</span>
            <span className="text-gray-900 dark:text-white">{order.token}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Status:</span>
            <span className={`capitalize font-medium ${
              isSettled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {order.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Created:</span>
            <span className="text-gray-900 dark:text-white">
              {new Date(order.created_at).toLocaleString()}
            </span>
          </div>
          {order.note && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Note:</span>
              <span className="text-gray-900 dark:text-white">{order.note}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onNewOrder}
          className="flex-1 px-6 py-3 bg-[#423ACC] hover:bg-[#352a99] text-white font-medium rounded-lg transition-colors"
        >
          Create New Order
        </button>
        <Link
          href="/"
          className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-center"
        >
          Back to Home
        </Link>
      </div>
      <BorderBeam duration={8} size={100} colorFrom="#423ACC" colorTo="#9c40ff" />
    </div>
  );
}

