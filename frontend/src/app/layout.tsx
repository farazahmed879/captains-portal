import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '../components/Sidebar';

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
        <div className="app-container">
          <Sidebar />
          <div className="main-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
