import './globals.css';
import type { Metadata } from 'next';
import { Dock } from '../components/Dock';
import { AuthProvider } from '../lib/auth';
import { QueryProvider } from '../lib/QueryProvider';

export const metadata: Metadata = {
  title: "Captains Portal | Sports Team, Matches & Finance Hub",
  description: "Comprehensive management portal for cricket and sports team captains: players ledger, match fees, tournament ROI, sponsors and expenditures.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            <div className="app-container">
              <div className="main-content">
                {children}
              </div>
              <Dock />
            </div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
