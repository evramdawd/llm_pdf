'use client'
import React from 'react'
import {QueryClientProvider, QueryClient} from '@tanstack/react-query'

type Props = {
  children: React.ReactNode; // wraps our entire app
}

const queryClient = new QueryClient();

const Providers = ({children}: Props) => {
  // Wrap query client provider, passing in client, wrapping the Childern in the provider
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider> 
  );
};

export default Providers;