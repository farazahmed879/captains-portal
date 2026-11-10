"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";
import { TopbarBrand, TopbarUserMenu } from "./topbar";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <TopbarBrand />

          <div className="topbar-heading">
            <h1 className="topbar-title">{title}</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <TopbarUserMenu
            isAuthenticated={isAuthenticated}
            user={user}
            onOpenProfile={() => router.push("/profile")}
            onLogout={logout}
          />
        </div>
      </header>
    </>
  );
};
