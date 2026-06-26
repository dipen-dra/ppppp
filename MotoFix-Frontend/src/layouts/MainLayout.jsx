import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

const bodyStyle = "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans antialiased";

export const MainLayout = ({ children }) => {
  return (
    <div className={bodyStyle}>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </div>
  );
};