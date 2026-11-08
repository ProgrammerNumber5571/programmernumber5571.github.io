import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useShopifyCart } from '../contexts/Shopifycartcontext';
import { useLanguage } from './LanguageContext.jsx';
import { usePageTitle } from './usePageTitle.js';
import { Button } from './ui/Button.tsx';
import { useAuth } from '../contexts/authContext';
import { recordCheckoutOrder } from './userProfileStore.js';

export const CartPage = () => {
  const { cart, cartCount, cartTotal, removeFromCart, updateQuantity, openCheckout, loading } = useShopifyCart();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  usePageTitle(t.cart);

  const handleCheckout = () => {
    recordCheckoutOrder(currentUser, cart, cartTotal);
    openCheckout();
  };

  const lines = cart?.lines?.edges || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <Link to="/" className="text-primary hover:underline mb-4 inline-block">
          ← {t.backHome}
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 flex items-center gap-4">
            {t.cart}
            <ShoppingBag className="w-10 h-10 text-primary" />
          </h1>
          <p className="text-muted-foreground text-lg">
            {cartCount} {t.productsWord.toLowerCase()}
          </p>
        </div>

        {lines.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-muted-foreground opacity-50" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold mb-8">{t.cartEmpty}</h2>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              <Link to="/collections">{t.viewAllCollection}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {lines.map(({ node: item }) => (
                <div
                  key={item.id}
                  className="flex gap-5 p-5 bg-card rounded-xl border border-border hover:border-primary/40 transition-colors"
                >
                  <img loading="lazy" decoding="async"
                    src={item.merchandise.image?.url || '/placeholder.png'}
                    alt={item.merchandise.product.title}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg bg-muted flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {item.merchandise.product.title}
                    </h3>
                    {item.merchandise.title !== 'Default Title' && (
                      <p className="text-sm text-muted-foreground mb-3">{item.merchandise.title}</p>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={loading || item.quantity <= 1}
                        className="w-8 h-8 rounded-lg border-2 border-border hover:border-primary transition flex items-center justify-center disabled:opacity-50"
                        aria-label="−"
                      >
                        <span className="text-lg font-bold">−</span>
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={loading || item.quantity >= 4}
                        className="w-8 h-8 rounded-lg border-2 border-border hover:border-primary transition flex items-center justify-center disabled:opacity-50"
                        aria-label="+"
                      >
                        <span className="text-lg font-bold">+</span>
                      </button>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        disabled={loading}
                        className="ml-auto p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 transition disabled:opacity-50"
                        aria-label={t.clear}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-xl">
                      {parseFloat(item.cost.totalAmount.amount).toFixed(2)} ₼
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-6 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold">{t.orderSummary}</h2>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="font-semibold text-lg">{t.total}</span>
                <span className="font-bold text-3xl font-serif">
                  {parseFloat(cartTotal).toFixed(2)} ₼
                </span>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full h-12 text-lg font-bold"
              >
                {t.checkout}
              </Button>

              <Link
                to="/collections"
                className="block text-center text-sm text-muted-foreground hover:text-foreground transition"
              >
                {t.continueShopping}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
