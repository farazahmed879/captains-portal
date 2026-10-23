"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings2,
  PanelBottom,
  PanelLeft,
  PanelRight,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import {
  DashboardIcon,
  ShieldAlertIcon,
  PlayersIcon,
  TrophyIcon,
  SwordsIcon,
  ReceiptIcon,
  SponsorIcon,
} from "./icons";

export type DockPosition = "bottom" | "left" | "right";

const BASE_SIZE = 46;
const MAX_SCALE = 1.62;
const RANGE = 135;
const STORAGE_KEY = "cp-dock-prefs";
const TOTAL_ITEMS = 9;

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: DashboardIcon,
    gradient: "linear-gradient(145deg, #38bdf8, #2563eb)",
  },
  {
    name: "My Teams",
    href: "/teams",
    icon: ShieldAlertIcon,
    gradient: "linear-gradient(145deg, #818cf8, #7c3aed)",
  },
  {
    name: "Players",
    href: "/players",
    icon: PlayersIcon,
    gradient: "linear-gradient(145deg, #34d399, #059669)",
  },
  {
    name: "Tournaments",
    href: "/tournaments",
    icon: TrophyIcon,
    gradient: "linear-gradient(145deg, #fbbf24, #ea580c)",
  },
  {
    name: "Matches",
    href: "/matches",
    icon: SwordsIcon,
    gradient: "linear-gradient(145deg, #fb7185, #e11d48)",
  },
  {
    name: "Expenses",
    href: "/finances",
    icon: ReceiptIcon,
    gradient: "linear-gradient(145deg, #2dd4bf, #0f766e)",
  },
  {
    name: "Sponsors & ROI",
    href: "/sponsors",
    icon: SponsorIcon,
    gradient: "linear-gradient(145deg, #c084fc, #db2777)",
  },
];

export const Dock: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [position, setPosition] = useState<DockPosition>("bottom");
  const [autoHide, setAutoHide] = useState(false);
  const [revealed, setRevealed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [bouncing, setBouncing] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const itemElsRef = useRef<(HTMLElement | null)[]>([]);
  const targetScalesRef = useRef<number[]>(new Array(TOTAL_ITEMS).fill(1));
  const currentScalesRef = useRef<number[]>(new Array(TOTAL_ITEMS).fill(1));
  const itemCentersRef = useRef<number[]>([]);
  const isHoveringRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const effectivePos: DockPosition = isMobile ? "bottom" : position;
  const vertical = effectivePos !== "bottom";

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (
        saved.position &&
        ["bottom", "left", "right"].includes(saved.position)
      ) {
        setPosition(saved.position);
      }
      if (typeof saved.autoHide === "boolean") {
        setAutoHide(saved.autoHide);
        setRevealed(!saved.autoHide);
      }
    } catch {
      /* ignore */
    }
    const onResize = () => {
      setIsMobile(window.innerWidth < 640);
      itemCentersRef.current = [];
    };
    onResize();
    window.addEventListener("resize", onResize);
    const t = setTimeout(() => setMounted(true), 40);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, []);

  // Update layout data-attributes on <html> for zero-layout-shift responsive padding
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ position, autoHide }));
    document.documentElement.dataset.dock = effectivePos;
    document.documentElement.dataset.dockAutohide = String(autoHide);
  }, [position, autoHide, effectivePos]);

  // Close popup menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  // Cache item center positions once on enter/first move (0 forced reflows during mouse movement)
  const cacheCenters = useCallback(() => {
    const centers: number[] = [];
    for (let i = 0; i < TOTAL_ITEMS; i++) {
      const el = itemElsRef.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        centers[i] = vertical
          ? rect.top + rect.height / 2
          : rect.left + rect.width / 2;
      } else {
        centers[i] = 0;
      }
    }
    itemCentersRef.current = centers;
  }, [vertical]);

  // Spring damping animation loop (runs natively at 60Hz/120Hz/144Hz via rAF)
  const startAnimation = useCallback(() => {
    if (rafIdRef.current !== null) return;

    const tick = () => {
      let hasDelta = false;
      const current = currentScalesRef.current;
      const target = targetScalesRef.current;

      for (let i = 0; i < TOTAL_ITEMS; i++) {
        const diff = target[i] - current[i];
        if (Math.abs(diff) > 0.0015) {
          // 0.28 gives high responsiveness with fluid macOS-like deceleration
          current[i] += diff * 0.28;
          hasDelta = true;
        } else {
          current[i] = target[i];
        }

        const el = itemElsRef.current[i];
        if (el) {
          const s = current[i];
          el.style.setProperty("--dock-scale", s.toFixed(3));

          // Slot expansion along the dock axis (neighbors push apart smoothly)
          // The perpendicular axis stays locked to prevent dock container wobbling!
          if (vertical) {
            const h = BASE_SIZE * (1 + (s - 1) * 0.65);
            el.style.height = `${h.toFixed(1)}px`;
            el.style.width = `${BASE_SIZE}px`;
          } else {
            const w = BASE_SIZE * (1 + (s - 1) * 0.65);
            el.style.width = `${w.toFixed(1)}px`;
            el.style.height = `${BASE_SIZE}px`;
          }
        }
      }

      if (hasDelta || isHoveringRef.current) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [vertical]);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setRevealed(true);
  }, []);

  const scheduleHide = useCallback(() => {
    if (!autoHide || menuOpen) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setRevealed(false), 450);
  }, [autoHide, menuOpen]);

  const handleMouseEnter = () => {
    if (isMobile) return;
    isHoveringRef.current = true;
    show();
    cacheCenters();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
    if (!itemCentersRef.current.length) {
      cacheCenters();
    }
    const coord = vertical ? e.clientY : e.clientX;
    const centers = itemCentersRef.current;

    for (let i = 0; i < TOTAL_ITEMS; i++) {
      const c = centers[i];
      const d = Math.abs(coord - c);
      if (d < RANGE) {
        // Authentic macOS cosine magnification curve
        targetScalesRef.current[i] =
          1 + (MAX_SCALE - 1) * Math.cos((d / RANGE) * (Math.PI / 2));
      } else {
        targetScalesRef.current[i] = 1;
      }
    }
    startAnimation();
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    isHoveringRef.current = false;
    for (let i = 0; i < TOTAL_ITEMS; i++) {
      targetScalesRef.current[i] = 1;
    }
    startAnimation();
    scheduleHide();
  };

  // Fluid position switching: quick scale/fade transition to avoid sudden visual jump
  const changePosition = (newPos: DockPosition) => {
    if (newPos === position) return;
    setIsSwitching(true);
    setTimeout(() => {
      setPosition(newPos);
      currentScalesRef.current.fill(1);
      targetScalesRef.current.fill(1);
      for (let i = 0; i < TOTAL_ITEMS; i++) {
        const el = itemElsRef.current[i];
        if (el) {
          el.style.setProperty("--dock-scale", "1");
          el.style.width = `${BASE_SIZE}px`;
          el.style.height = `${BASE_SIZE}px`;
        }
      }
      itemCentersRef.current = [];
      setTimeout(() => {
        setIsSwitching(false);
      }, 60);
    }, 180);
  };

  const triggerBounce = (key: string) => {
    setBouncing(key);
    setTimeout(() => setBouncing((b) => (b === key ? null : b)), 650);
  };

  if (pathname === "/login") {
    return null;
  }

  const hidden = autoHide && !revealed;

  return (
    <>
      {autoHide && !isMobile && (
        <div
          className={`dock-hotzone pos-${effectivePos}`}
          onMouseEnter={show}
          aria-hidden="true"
        />
      )}

      <div
        className={`dock-wrap pos-${effectivePos} ${hidden ? "is-hidden" : ""} ${mounted ? "is-mounted" : ""} ${isSwitching ? "is-switching" : ""}`}
      >
        <nav
          className={`dock ${vertical ? "vertical" : ""}`}
          aria-label="Main navigation"
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Index 0: Brand & DB Status */}
          <div
            className="dock-item"
            ref={(el) => {
              itemElsRef.current[0] = el;
            }}
          >
            <Link
              href="/"
              id="dock-brand"
              className="dock-icon dock-brand"
              aria-label="Captains Portal home"
            >
              CP
              <span className="dock-status-dot" />
            </Link>
            <span className="dock-tooltip">
              <strong>Captains Portal</strong>
              <span className="dock-tooltip-sub">
                {user?.name || "Super Admin"} · Connected
              </span>
            </span>
          </div>

          <span className="dock-sep" />

          {/* Indices 1 to 7: App Navigation Icons */}
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const itemIndex = idx + 1;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <div
                key={item.href}
                className={`dock-item ${isActive ? "active" : ""} ${bouncing === item.href ? "bouncing" : ""}`}
                ref={(el) => {
                  itemElsRef.current[itemIndex] = el;
                }}
              >
                <Link
                  href={item.href}
                  id={`dock-link-${item.href === "/" ? "dashboard" : item.href.slice(1)}`}
                  className="dock-icon"
                  style={{ background: item.gradient }}
                  aria-label={item.name}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => !isActive && triggerBounce(item.href)}
                >
                  <Icon size={22} />
                </Link>
                <span className="dock-tooltip">{item.name}</span>
              </div>
            );
          })}

          {!isMobile && (
            <>
              <span className="dock-sep" />

              {/* Index 8: Settings Popover */}
              <div
                className="dock-item"
                ref={(el) => {
                  itemElsRef.current[8] = el;
                  menuRef.current = el as HTMLDivElement | null;
                }}
              >
                <button
                  type="button"
                  id="dock-settings"
                  className={`dock-icon dock-settings ${menuOpen ? "open" : ""}`}
                  aria-label="Dock settings"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <Settings2 size={22} />
                </button>
                {!menuOpen && (
                  <span className="dock-tooltip">Dock Settings</span>
                )}

                {menuOpen && (
                  <div
                    className="dock-menu"
                    role="dialog"
                    aria-label="Dock settings"
                  >
                    <div className="dock-menu-label">Dock Position</div>
                    <div className="dock-segment">
                      {(
                        [
                          { v: "left", icon: PanelLeft, label: "Left" },
                          { v: "bottom", icon: PanelBottom, label: "Bottom" },
                          { v: "right", icon: PanelRight, label: "Right" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.v}
                          type="button"
                          id={`dock-pos-${opt.v}`}
                          className={`dock-segment-btn ${position === opt.v ? "active" : ""}`}
                          onClick={() => changePosition(opt.v)}
                        >
                          <opt.icon size={16} />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>

                    <label className="dock-toggle-row" htmlFor="dock-autohide">
                      <span>
                        <span className="dock-toggle-title">
                          Auto-hide Dock
                        </span>
                        <span className="dock-toggle-sub">
                          Reveals when pointer touches screen edge
                        </span>
                      </span>
                      <input
                        id="dock-autohide"
                        type="checkbox"
                        className="dock-switch"
                        checked={autoHide}
                        onChange={(e) => setAutoHide(e.target.checked)}
                      />
                    </label>

                    {isAuthenticated && (
                      <div className="dock-user-box">
                        <div className="dock-user-row">
                          <div className="dock-user-avatar">
                            <UserIcon size={14} />
                          </div>
                          <div className="dock-user-info">
                            <span className="dock-user-name">{user?.name}</span>
                            <span className="dock-user-role">
                              {user?.role?.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="dock-logout-btn"
                          className="dock-logout-btn"
                          onClick={() => {
                            setMenuOpen(false);
                            logout();
                          }}
                        >
                          <LogOut size={13} />
                          <span>Log Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </nav>
      </div>
    </>
  );
};
