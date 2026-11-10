import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";
import { useFavorites } from "./FavoritesSystem";
import { useShopifyCart } from "../contexts/Shopifycartcontext";
import { useLanguage } from "./LanguageContext.jsx";

// Pages where a shopping tab bar would only be in the way
const HIDDEN_ON = ["/login", "/signup", "/forgot-password"];

const matches = (pathname, to) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`));

// Bottom tab bar, phones only: Home / Search / Favorites / Cart / Profile.
// One highlight pill glides from tab to tab with a springy overshoot (like iOS tab bars) instead of
// each tab switching its own background. While the bar is on screen <html> gets "has-tabbar", which
// reserves room for it (see --tabbar-h in index.css) so page content and the album page's price bar
// sit above it.
export const MobileTabBar = () => {
  const { pathname } = useLocation();
  const { favoritesCount } = useFavorites();
  const { cartCount } = useShopifyCart();
  const { t } = useLanguage();

  const visible = !HIDDEN_ON.includes(pathname);
  useEffect(() => {
    document.documentElement.classList.toggle("has-tabbar", visible);
    return () => document.documentElement.classList.remove("has-tabbar");
  }, [visible]);

  const tabs = [
    { to: "/", icon: Home, label: t.tabHome },
    { to: "/search", icon: Search, label: t.tabSearch },
    { to: "/favorites", icon: Heart, label: t.tabFavorites, count: favoritesCount },
    { to: "/cart", icon: ShoppingBag, label: t.tabCart, count: cartCount },
    { to: "/account", icon: User, label: t.tabProfile },
  ];
  const activeIndex = tabs.findIndex((tab) => matches(pathname, tab.to));

  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const [pill, setPill] = useState(null); // { left, width }
  const [settled, setSettled] = useState(false); // false until the first position is placed (no slide-in from 0)

  const measure = () => {
    const el = itemRefs.current[activeIndex];
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  };
  useLayoutEffect(() => {
    if (!visible) return undefined;
    measure();
    const id = requestAnimationFrame(() => setSettled(true));
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, visible, t.tabHome]);

  if (!visible) return null;

  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 rounded-t-3xl border-t border-border bg-card/95 px-3 pt-2 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.5)]"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      <ul ref={listRef} className="relative flex items-stretch justify-between">
        {/* the gliding highlight */}
        <span
          aria-hidden="true"
          className="tabbar-pill pointer-events-none absolute inset-y-0 rounded-full bg-primary/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]"
          style={{
            width: pill?.width ?? 0,
            transform: `translateX(${pill?.left ?? 0}px)`,
            opacity: pill && activeIndex >= 0 ? 1 : 0,
            transition: settled ? undefined : "none",
          }}
        />
        {tabs.map(({ to, icon: Icon, label, count }, i) => {
          const active = i === activeIndex;
          return (
            <li key={to} ref={(el) => (itemRefs.current[i] = el)} className="relative flex-1 min-w-0">
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 rounded-full py-2 text-[11px] font-semibold leading-none transition-colors duration-300 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className={`relative transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${active ? "scale-110 -translate-y-px" : ""}`}>
                  <Icon className="w-6 h-6" />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </span>
                <span className="truncate max-w-full px-0.5">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
