import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, Heart, ShoppingBag } from "lucide-react";
import { useFavorites } from "./FavoritesSystem";
import { useShopifyCart } from "../contexts/Shopifycartcontext";
import { useLanguage } from "./LanguageContext.jsx";

// Pages where a shopping tab bar would only be in the way
const HIDDEN_ON = ["/login", "/signup", "/forgot-password"];

// Bottom tab bar, phones only: Home / Search / Favorites / Cart, with the active tab in a pill.
// While it is on screen <html> gets "has-tabbar", which reserves room for it (see --tabbar-h in
// index.css) so page content and the album page's price bar sit above it.
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

  if (!visible) return null;

  const tabs = [
    { to: "/", icon: Home, label: t.tabHome, end: true },
    { to: "/search", icon: Search, label: t.tabSearch },
    { to: "/favorites", icon: Heart, label: t.tabFavorites, count: favoritesCount },
    { to: "/cart", icon: ShoppingBag, label: t.tabCart, count: cartCount },
  ];

  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 rounded-t-3xl border-t border-border bg-card/95 px-3 pt-2 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.5)]"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      <ul className="flex items-stretch justify-between gap-1">
        {tabs.map(({ to, icon: Icon, label, count, end }) => (
          <li key={to} className="flex-1 min-w-0">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 rounded-full py-2 text-[11px] font-semibold leading-none transition-colors ${
                  isActive ? "bg-primary/15 text-primary" : "text-muted-foreground active:bg-muted"
                }`
              }
            >
              <span className="relative">
                <Icon className="w-6 h-6" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                    {count}
                  </span>
                )}
              </span>
              <span className="truncate max-w-full px-1">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
