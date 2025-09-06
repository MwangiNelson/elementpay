"use client";

import { RetroGrid } from "@/components/magicui/retro-grid";
import { SignInButton, SignedIn, SignedOut, UserButton, useAuth } from '@clerk/nextjs';
import Link from "next/link";
import { motion } from "motion/react";
import StaggeredMenu from "@/components/staggered-menu";
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      toast.success('Welcome back!', {
        description: 'You are now signed in and can access your wallet and orders.',
        duration: 3000,
      });
    }
  }, [isSignedIn, isLoaded]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      <RetroGrid />

      {/* Header with Staggered Menu and User Avatar */}
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

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text text-transparent">
            ElementPay
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Seamless crypto payments. Connect your wallet, create orders, and accept payments effortlessly.
          </p>

          <SignedIn>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/wallet">
                  <button className="px-8 py-4 bg-[#423ACC] hover:bg-[#352a99] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    Connect Wallet
                  </button>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/orders">
                  <button className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                    Create Order
                  </button>
                </Link>
              </motion.div>
            </div>
          </SignedIn>

          <SignedOut>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-[#423ACC] hover:bg-[#352a99] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  Get Started
                </button>
              </SignInButton>
            </motion.div>
          </SignedOut>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
          <p>© 2024 ElementPay. Secure crypto payment gateway.</p>
        </div>
      </div>
    </div>
  );
}
