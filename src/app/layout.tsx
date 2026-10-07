import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'MaintainAI — Equipment Maintenance Triage Assistant',
  description: 'AI-assisted equipment maintenance decision support system for industrial technicians. Report issues, run threshold checks, analyze evidence, and generate work orders.',
  keywords: 'maintenance, equipment, AI, industrial, triage, work orders, sensor analysis',
  robots: 'noindex, nofollow', // Private application
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
