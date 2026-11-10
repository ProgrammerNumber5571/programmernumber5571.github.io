import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShopifyCart } from "../contexts/Shopifycartcontext";
import { CartSidebar } from "./CartSidebar";

import { Button } from "./ui/Button";
import { Search, ShoppingBag, Heart } from "lucide-react";
import { UserMenu } from "./userMenu";
import { SearchEngine } from "./SearchEngine";
import { useFavorites } from "./FavoritesSystem";
import { useLanguage } from "./LanguageContext.jsx";

export const Nav = ({ albums }) => {
  const { favoritesCount } = useFavorites();
  const { cartCount } = useShopifyCart();
  const { t } = useLanguage();
  const [showSearch, setShowSearch] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const navigate = useNavigate();

  // Scrolling down shrinks the top bar, scrolling up (or being near the top) brings it back to full size
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - last;
      if (y < 48) setCompact(false);
      else if (dy > 10) setCompact(true);
      else if (dy < -10) setCompact(false);
      if (Math.abs(dy) > 10 || y < 48) last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { name: t.navNew, id: "new" },
    { name: t.navGenres, id: "genres" },
    { name: t.tabProfile, to: "/account" },
    { name: t.navAbout, id: "about" },
  ];

  // Anchor hrefs like "#genres" collide with the hash router (it reads them
  // as routes), so section jumps scroll programmatically instead. If the
  // section isn't on the current page, go home first and retry until the
  // lazy-loaded homepage has rendered it.
  const scrollToSection = (id, attempts = 12) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (attempts > 0) setTimeout(() => scrollToSection(id, attempts - 1), 200);
  };

  const handleNavClick = (id) => {
    if (!document.getElementById(id)) navigate("/");
    scrollToSection(id);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className={`flex items-center justify-between transition-[height] duration-500 ease-[cubic-bezier(0.32,1.2,0.5,1)] motion-reduce:transition-none ${compact ? "h-14" : "h-20"}`}>
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className={`shrink-0 rounded-full bg-primary flex items-center justify-center transition-[width,height] duration-500 ${compact ? "w-8 h-8" : "w-10 h-10"}`}>
                <div className={`rounded-full bg-background transition-[width,height] duration-500 ${compact ? "w-2.5 h-2.5" : "w-3 h-3"}`} />
              </div>
              <span className={`font-serif font-bold tracking-tight truncate transition-[font-size] duration-500 ${compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}>Backrooms</span>
            </a>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.to ? (
                  <Link
                    key={link.name}
                    to={link.to}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium tracking-wide whitespace-nowrap"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium tracking-wide whitespace-nowrap"
                  >
                    {link.name}
                  </button>
                )
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 sm:gap-4 shrink-0">
              {/* Search toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={`max-md:hidden ${showSearch ? "text-primary bg-muted" : "text-foreground"}`}
                onClick={() => setShowSearch(!showSearch)}
                aria-label={t.searchPlaceholderShort}
                aria-pressed={showSearch}
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Cart toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="max-md:hidden text-foreground relative"
                onClick={() => setCartOpen(true)}
                aria-label={t.cart}
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {/* Favorites (on phones this lives in the menu: the bar is too narrow for every icon) */}
              <Button variant="ghost" size="icon" className="hidden md:inline-flex text-foreground relative" asChild>
                <Link to="/favorites" aria-label={t.favoritesTitle}>
                  <Heart className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {favoritesCount}
                  </span>
                </Link>
              </Button>

              {/* User menu */}
              {/* On phones the Profile tab in the bottom bar replaces this */}
              <div className="max-md:hidden">
                <UserMenu />
              </div>

            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="py-4 border-t border-border">
              <SearchEngine albums={albums} />
            </div>
          )}

        </div>
      </nav>

      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};
