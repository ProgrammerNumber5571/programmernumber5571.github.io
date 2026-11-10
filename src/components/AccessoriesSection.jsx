import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingCart } from 'lucide-react';
import { Accessories, AccessoryCategories } from './Accessories';
import { Button } from './ui/Button';
import { useLanguage, localizeText } from './LanguageContext.jsx';

export function AccessoriesSection() {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoryNames = {
    all: t.catAll,
    turntable: t.catTurntable,
    'cd-player': t.catCdPlayer,
    storage: t.catStorage,
    cleaning: t.catCleaning,
    accessories: t.catAccessories,
  };

  const filteredAccessories = selectedCategory === 'all'
    ? Accessories
    : Accessories.filter(item => item.category === selectedCategory);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t.accessoriesTitle}</h2>
            <p className="text-muted-foreground">
              {t.accessoriesSubtitle}
            </p>
          </div>
          <Link to="/accessories">
            <Button variant="ghost" className="gap-2">
              {t.viewAll}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Category Filter */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {AccessoryCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:border-primary'
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {categoryNames[cat.id] || cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredAccessories.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="group bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-muted">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <img decoding="async"
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {!item.inStock && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{t.outOfStock}</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                  {localizeText(item.description, language)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{item.price} ₼</span>
                  <button
                    disabled={!item.inStock}
                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}