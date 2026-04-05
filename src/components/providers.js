'use client';

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/useToast";

export function ClientProviders({ children }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}
