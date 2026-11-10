import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShopifyCart } from "../contexts/Shopifycartcontext";
import { CartSidebar } from "./CartSidebar";

import { Button } from "./ui/Button";
import { Search, ShoppingBag, Heart, Settings as SettingsIcon, Menu, X } from "lucide-react";
import { UserMenu } from "./userMenu";
import { Settings } from "./Settings";
import { SearchEngine } from "./SearchEngine";
import { useFavorites } from "./FavoritesSystem";
import { useLanguage } from "./LanguageContext.jsx";

export const Nav = ({ albums }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { favoritesCount } = useFavorites();
  const { cartCount } = useShopifyCart();
  const { t } = useLanguage();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const navigate = useNavigate();

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
    setIsOpen(false);
    if (!document.getElementById(id)) navigate("/");
    scrollToSection(id);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-full bg-primary flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-background" />
              </div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight truncate">Backrooms</span>
            </a>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.to ? (
                  <Link
                    key={link.name}
                    to={link.to}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium tracking-wide"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium tracking-wide"
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

              {/* Settings */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="hidden md:inline-flex text-foreground"
                aria-label={t.settings}
              >
                <SettingsIcon className="w-5 h-5" />
              </Button>

              {/* User menu */}
              <UserMenu />

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-foreground"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? t.closeWindow : "Menu"}
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="py-4 border-t border-border">
              <SearchEngine albums={albums} />
            </div>
          )}

          {/* Mobile nav links */}
          {isOpen && (
            <div className="md:hidden py-6 border-t border-border">
              {navLinks.map((link) =>
                link.to ? (
                  <Link
                    key={link.name}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-left py-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link.id)}
                    className="block w-full text-left py-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </button>
                )
              )}
              <div className="mt-3 pt-3 border-t border-border">
                <Link
                  to="/favorites"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span className="flex-1">{t.favoritesTitle}</span>
                  <span className="min-w-5 h-5 px-1.5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {favoritesCount}
                  </span>
                </Link>
                <button
                  onClick={() => { setIsOpen(false); setSettingsOpen(true); }}
                  className="flex items-center gap-3 w-full py-3 text-left text-muted-foreground hover:text-foreground transition-colors"
                >
                  <SettingsIcon className="w-5 h-5" />
                  {t.settings}
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};
