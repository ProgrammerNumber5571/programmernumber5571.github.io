import { Link } from 'react-router-dom';
import { ChevronRight, Shirt, Package } from 'lucide-react';
import { Merch } from './Merch';
import { Button } from './ui/Button';
import { useLanguage } from './LanguageContext.jsx';

export function MerchPromoSection() {
  const { t } = useLanguage();
  const featuredMerch = Merch.slice(0, 4);

  return (
    <section id="orders" className="py-16 bg-background">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t.officialMerch}</h2>
            <p className="text-muted-foreground">
              {t.merchSubtitle}
            </p>
          </div>
          <Link to="/merch">
            <Button className="gap-2">
              <Shirt className="w-4 h-4" />
              {t.merchStore}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Featured Merch Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Large Featured Item */}
          {featuredMerch[0] && (
            <Link
              to={`/merch/${featuredMerch[0].id}`}
              className="group relative h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border border-border hover:border-primary transition-all"
            >
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="relative z-10 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="w-48 h-48 rounded-lg overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform">
                      <img loading="lazy" decoding="async"
                        src={featuredMerch[0].image}
                        alt={featuredMerch[0].title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{featuredMerch[0].title}</h3>
                  <p className="text-muted-foreground mb-4">
                    {Array.isArray(featuredMerch[0].artist) 
                      ? featuredMerch[0].artist.join(', ') 
                      : featuredMerch[0].artist}
                  </p>
                  <span className="text-3xl font-bold text-primary">
                    {featuredMerch[0].price} ₼
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Grid of 3 smaller items */}
          <div className="grid grid-cols-1 gap-6">
            {featuredMerch.slice(1, 4).map((item) => (
              <Link
                key={item.id}
                to={`/merch/${item.id}`}
                className="group flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary hover:shadow-lg transition-all"
              >
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  <img loading="lazy" decoding="async"
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 truncate">
                    {Array.isArray(item.artist) ? item.artist.join(', ') : item.artist}
                  </p>
                  <span className="text-lg font-bold">{item.price} ₼</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-8 p-8 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Package className="w-6 h-6" />
                {t.exclusiveMerch}
              </h3>
              <p className="text-muted-foreground">
                {t.merchCtaSubtitle}
              </p>
            </div>
            <Link to="/merch">
              <Button size="lg" variant="outline" className="gap-2">
                {t.buyNow}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}