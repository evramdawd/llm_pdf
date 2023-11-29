import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import {ClerkProvider} from '@clerk/nextjs'
import Providers from '@/components/Providers'
import {Toaster} from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LLM-PDF',
}

export default function RootLayout( {children}: {children: React.ReactNode;} ) {
  // Wrapping app in React-Query Provider
  // <Toaster/> {/* React-Hot-Toast = pretty notifications/alert */}
  return (
    <ClerkProvider>
      <Providers> 
        <html lang="en">
          <body className={inter.className}>{children}</body>
          <Toaster/>
        </html>
      </Providers>
    </ClerkProvider>
  );
};

// Wrapping app in ClerkProvider for Auth purposes
// Wrapping app in Providers for React-Query - utilize caching of data from endpoints. Minimizes wasteful calls to the backend. Wrapping our app in this Provider gives every component w/in our app access to that data cache