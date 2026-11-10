import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Heart, UserCircle } from "lucide-react";
import { Button } from "./ui/Button.tsx";
import { useAuth } from "../contexts/authContext";
import { useLanguage } from "./LanguageContext.jsx";

export const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Logged out: the icon leads straight to the login page
  if (!currentUser) {
    return (
      <Button variant="ghost" size="icon" className="text-foreground" asChild>
        <Link to="/login" aria-label={t.loginTitle}>
          <User className="w-5 h-5" />
        </Link>
      </Button>
    );
  }

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const itemCls = "w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors";

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className={open ? "text-primary bg-muted" : "text-foreground"}
        onClick={() => setOpen(!open)}
        aria-label={t.account}
        aria-expanded={open}
      >
        <User className="w-5 h-5" />
      </Button>

      {open && (
        <div className="glass-panel absolute right-0 mt-2 w-56 bg-background border border-border rounded-md shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold truncate">{currentUser.displayName || t.account}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
          </div>
          <Link to="/account" className={itemCls} onClick={() => setOpen(false)}>
            <UserCircle className="w-4 h-4" /> {t.tabProfile}
          </Link>
          <Link to="/favorites" className={itemCls} onClick={() => setOpen(false)}>
            <Heart className="w-4 h-4" /> {t.favoritesTitle}
          </Link>
          <button onClick={handleLogout} className={`${itemCls} border-t border-border`}>
            <LogOut className="w-4 h-4" /> {t.logout}
          </button>
        </div>
      )}
    </div>
  );
};
