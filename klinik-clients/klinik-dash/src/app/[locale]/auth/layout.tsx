import React from 'react';

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-surface-bg flex flex-col justify-center">
      {children}
    </main>
  );
}
