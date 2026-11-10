import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, MapPin, CreditCard, Package, Heart, Plus, Trash2, LogOut, Camera, ShoppingBag, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/authContext';
import { useLanguage } from './LanguageContext.jsx';
import { usePageTitle } from './usePageTitle.js';
import { Button } from './ui/Button.tsx';
import { Settings } from './Settings';
import { useFavorites } from './FavoritesSystem';
import { useShopifyCart } from '../contexts/Shopifycartcontext';
import { defaultProfile, loadLocalProfile, fetchRemoteProfile, saveProfile } from './userProfileStore.js';

const inputCls = "w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none";

const Section = ({ icon: Icon, title, children }) => (
  <section className="bg-card border border-border rounded-xl p-6">
    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
      <Icon className="w-5 h-5 text-primary" /> {title}
    </h2>
    {children}
  </section>
);

export const AccountPage = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  usePageTitle(t.account);

  const { favoritesCount } = useFavorites();
  const { cartCount } = useShopifyCart();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const photoInput = useRef(null);

  const [profile, setProfile] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [addressDraft, setAddressDraft] = useState({ label: '', text: '' });
  const [cardDraft, setCardDraft] = useState({ holder: '', last4: '', expiry: '', brand: 'Visa' });

  useEffect(() => {
    if (!currentUser) return;
    const local = loadLocalProfile(currentUser.uid) || defaultProfile(currentUser);
    setProfile(local);
    // Merge in the remote copy when Firestore is reachable (remote wins for
    // fields the local copy doesn't have yet).
    fetchRemoteProfile(currentUser.uid).then(remote => {
      if (remote) setProfile(prev => ({ ...defaultProfile(currentUser), ...remote, ...prev }));
    });
  }, [currentUser?.uid]);

  if (!profile) return null;

  const persist = (next) => {
    setProfile(next);
    saveProfile(currentUser.uid, next);
  };

  // Profile photo: cropped to a centred square and shrunk to 256px so it stays small enough to sync
  const onPhotoChosen = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const side = Math.min(img.width, img.height);
      canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      persist({ ...profile, photo: canvas.toDataURL('image/jpeg', 0.82) });
      toast.success(t.savedToast);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error(t.errorTryAgain);
    };
    img.src = url;
  };

  const displayName = profile.name || profile.username || currentUser.displayName || t.account;
  const initials = displayName.trim().split(/s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

  const saveIdentity = () => {
    persist(profile);
    toast.success(t.savedToast);
  };

  const addAddress = () => {
    if (!addressDraft.text.trim()) return;
    persist({
      ...profile,
      addresses: [...profile.addresses, { id: Date.now(), label: addressDraft.label.trim(), text: addressDraft.text.trim() }],
    });
    setAddressDraft({ label: '', text: '' });
    setShowAddressForm(false);
    toast.success(t.savedToast);
  };

  const removeAddress = (id) => {
    persist({ ...profile, addresses: profile.addresses.filter(a => a.id !== id) });
  };

  const addCard = () => {
    const last4 = cardDraft.last4.trim();
    const expiry = cardDraft.expiry.trim();
    if (!cardDraft.holder.trim() || !/^\d{4}$/.test(last4) || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      toast.error(t.errorTryAgain);
      return;
    }
    persist({
      ...profile,
      cards: [...profile.cards, { id: Date.now(), holder: cardDraft.holder.trim(), last4, expiry, brand: cardDraft.brand }],
    });
    setCardDraft({ holder: '', last4: '', expiry: '', brand: 'Visa' });
    setShowCardForm(false);
    toast.success(t.savedToast);
  };

  const removeCard = (id) => {
    persist({ ...profile, cards: profile.cards.filter(c => c.id !== id) });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/" className="hidden md:inline-block text-primary hover:underline mb-4">
          ← {t.backHome}
        </Link>

        {/* Profile card */}
        <div className="mb-8 rounded-3xl border border-border bg-gradient-to-b from-primary/15 via-card to-card px-5 pb-6 pt-8 text-center shadow-lg">
          <div className="relative mx-auto h-28 w-28">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-primary text-4xl font-bold text-primary-foreground shadow-xl ring-4 ring-background">
              {profile.photo ? <img src={profile.photo} alt="" className="h-full w-full object-cover" /> : initials}
            </div>
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              aria-label={t.changePhoto}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-background transition-transform active:scale-90"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={onPhotoChosen} />
          </div>

          <h1 className="mt-4 break-words text-3xl font-serif font-bold">{displayName}</h1>
          {profile.username && <p className="font-medium text-primary">@{profile.username}</p>}
          <p className="mt-1 break-all text-sm text-muted-foreground">{currentUser.email}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { to: '/favorites', icon: Heart, value: favoritesCount, label: t.favoritesTitle },
              { to: '/account', icon: Package, value: (profile.orders || []).length, label: t.profileStatsOrders },
              { to: '/cart', icon: ShoppingBag, value: cartCount, label: t.cart },
            ].map(({ to, icon: Icon, value, label }) => {
              const cls = "rounded-2xl border border-border bg-background/60 px-2 py-3 transition-colors active:bg-muted";
              const inner = (
                <>
                  <Icon className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold leading-none">{value}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
                </>
              );
              // the orders tile scrolls to the orders list on this very page
              return to === '/account' ? (
                <button
                  key={label}
                  type="button"
                  onClick={() => document.getElementById('my-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className={cls}
                >
                  {inner}
                </button>
              ) : (
                <Link key={label} to={to} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>

          <Button variant="outline" onClick={() => setSettingsOpen(true)} className="mt-4 gap-2">
            <SettingsIcon className="h-4 w-4" /> {t.settings}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Orders (first, right under the profile card) */}
          <div id="my-orders" className="scroll-mt-24">
            <Section icon={Package} title={t.myOrders}>
              {(profile.orders || []).length === 0 ? (
                <p className="text-muted-foreground text-sm">{t.noOrders}</p>
              ) : (
                <ul className="space-y-3">
                  {profile.orders.map((order) => (
                    <li key={order.id} className="p-4 border border-border rounded-lg bg-background">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">#{order.id}</span>
                        <span className="text-muted-foreground">{order.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{order.summary}</p>
                      {order.total && <p className="font-bold mt-1">{order.total} ₼</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          {/* Profile */}
          <Section icon={User} title={t.profile}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t.username}</label>
                <input
                  className={inputCls}
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t.nameLabel}</label>
                <input
                  className={inputCls}
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={saveIdentity} className="mt-4">{t.save}</Button>
          </Section>

          {/* Addresses */}
          <Section icon={MapPin} title={t.addresses}>
            {profile.addresses.length === 0 ? (
              <p className="text-muted-foreground text-sm mb-4">{t.noAddresses}</p>
            ) : (
              <ul className="space-y-3 mb-4">
                {profile.addresses.map((addr) => (
                  <li key={addr.id} className="flex items-start justify-between gap-4 p-4 border border-border rounded-lg bg-background">
                    <div>
                      {addr.label && <p className="font-semibold text-sm mb-1">{addr.label}</p>}
                      <p className="text-sm text-muted-foreground">{addr.text}</p>
                    </div>
                    <button
                      onClick={() => removeAddress(addr.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                      aria-label={t.removeItem}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showAddressForm ? (
              <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
                <input
                  className={inputCls}
                  placeholder={t.addressLabel}
                  value={addressDraft.label}
                  onChange={(e) => setAddressDraft({ ...addressDraft, label: e.target.value })}
                />
                <textarea
                  className={`${inputCls} h-20 resize-none`}
                  placeholder={t.addressText}
                  value={addressDraft.text}
                  onChange={(e) => setAddressDraft({ ...addressDraft, text: e.target.value })}
                />
                <div className="flex gap-3">
                  <Button size="sm" onClick={addAddress}>{t.save}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddressForm(false)}>{t.cancel}</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAddressForm(true)} className="gap-2">
                <Plus className="w-4 h-4" /> {t.addAddress}
              </Button>
            )}
          </Section>

          {/* Payment cards — display data only, never full numbers or CVV */}
          <Section icon={CreditCard} title={t.paymentMethods}>
            <p className="text-xs text-muted-foreground mb-4">{t.cardSecurityNote}</p>
            {profile.cards.length === 0 ? (
              <p className="text-muted-foreground text-sm mb-4">{t.noCards}</p>
            ) : (
              <ul className="space-y-3 mb-4">
                {profile.cards.map((card) => (
                  <li key={card.id} className="flex items-center justify-between gap-4 p-4 border border-border rounded-lg bg-background">
                    <div className="flex items-center gap-4">
                      <CreditCard className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-semibold text-sm">{card.brand} •••• {card.last4}</p>
                        <p className="text-xs text-muted-foreground">{card.holder} — {card.expiry}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCard(card.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                      aria-label={t.removeItem}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showCardForm ? (
              <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
                <input
                  className={inputCls}
                  placeholder={t.cardHolder}
                  value={cardDraft.holder}
                  onChange={(e) => setCardDraft({ ...cardDraft, holder: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    className={inputCls}
                    placeholder={t.cardLast4}
                    maxLength={4}
                    inputMode="numeric"
                    value={cardDraft.last4}
                    onChange={(e) => setCardDraft({ ...cardDraft, last4: e.target.value.replace(/\D/g, '') })}
                  />
                  <input
                    className={inputCls}
                    placeholder={t.cardExpiry}
                    maxLength={5}
                    value={cardDraft.expiry}
                    onChange={(e) => setCardDraft({ ...cardDraft, expiry: e.target.value })}
                  />
                  <select
                    className={inputCls}
                    value={cardDraft.brand}
                    onChange={(e) => setCardDraft({ ...cardDraft, brand: e.target.value })}
                  >
                    <option>Visa</option>
                    <option>Mastercard</option>
                    <option>American Express</option>
                    <option>Mir</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button size="sm" onClick={addCard}>{t.save}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowCardForm(false)}>{t.cancel}</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowCardForm(true)} className="gap-2">
                <Plus className="w-4 h-4" /> {t.addCard}
              </Button>
            )}
          </Section>

          {/* Wishlist shortcut — favorites are already synced per account */}
          <Section icon={Heart} title={t.favoritesTitle}>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/favorites"><Heart className="w-4 h-4" /> {t.viewAll}</Link>
            </Button>
          </Section>

          <Button variant="outline" onClick={handleLogout} className="w-full gap-2 border-red-500/40 text-red-500">
            <LogOut className="h-4 w-4" /> {t.logout}
          </Button>
        </div>
      </div>

      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default AccountPage;
