import { useState, useEffect } from "react";
import { X, Type, MousePointer, Zap, Palette, Sun, Moon, Languages, Disc, Droplets } from "lucide-react";
import { Button } from "./ui/Button.tsx";
import { useLanguage } from "./LanguageContext.jsx";
import { applyUserSettings } from "./applyUserSettings.js";

export const Settings = ({ isOpen, onClose }) => {
  const { setLanguage, t } = useLanguage();

  const [settings, setSettings] = useState({
    biggerText: false,
    biggerCursor: false,
    lineHeight: "normal",
    stopAnimations: false,
    hideVinylEntirely: false,
    hideVinylArtistOnly: false,
    invertColors: false,
    liquidGlass: true,
    brightness: 100,
    contrast: 100,
    language: "az",
    theme: "dark"
  });

  useEffect(() => {
    const saved = localStorage.getItem("userSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge over defaults so newly added settings keep their default value
        setSettings(prev => ({ ...prev, ...parsed }));
        applyUserSettings(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("userSettings", JSON.stringify(settings));
    applyUserSettings(settings);
    setLanguage(settings.language);
  }, [settings]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const resetSettings = () => {
    setSettings({
      biggerText: false,
      biggerCursor: false,
      lineHeight: "normal",
      stopAnimations: false,
      hideVinylEntirely: false,
      hideVinylArtistOnly: false,
      invertColors: false,
      liquidGlass: true,
      brightness: 100,
      contrast: 100,
      language: "az",
      theme: "dark"
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.settings}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel bg-background border border-border w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl rounded-2xl flex flex-col"
      >
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t.settings}</h2>
            <p className="text-sm text-muted-foreground">{t.customize}</p>
          </div>
          <button onClick={onClose} className="lg-btn lg-btn-lib lg-btn-ghost p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-10">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Disc className="w-4 h-4" /> {t.vinylSettings}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setSettings(s => ({ ...s, hideVinylEntirely: !s.hideVinylEntirely, hideVinylArtistOnly: false }))}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${settings.hideVinylEntirely ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <span className="font-semibold text-sm">{t.hideVinylAll}</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.hideVinylEntirely ? "bg-primary" : "bg-muted"}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.hideVinylEntirely ? "left-6" : "left-1"}`} />
                </div>
              </button>

              <button
                disabled={settings.hideVinylEntirely}
                onClick={() => setSettings(s => ({ ...s, hideVinylArtistOnly: !s.hideVinylArtistOnly }))}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${settings.hideVinylArtistOnly ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"} ${settings.hideVinylEntirely ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <span className="font-semibold text-sm">{t.hideVinylArtist}</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.hideVinylArtistOnly ? "bg-primary" : "bg-muted"}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.hideVinylArtistOnly ? "left-6" : "left-1"}`} />
                </div>
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Type className="w-4 h-4" /> {t.contentView}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSettings(s => ({ ...s, biggerText: !s.biggerText }))}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${settings.biggerText ? "border-primary bg-primary/5 shadow-inner" : "border-border hover:border-primary/50"}`}
              >
                <div className={`p-2 rounded-lg ${settings.biggerText ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <Type className="w-6 h-6" />
                </div>
                <span className="font-semibold">{t.biggerText}</span>
              </button>

              <button
                onClick={() => setSettings(s => ({ ...s, biggerCursor: !s.biggerCursor }))}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${settings.biggerCursor ? "border-primary bg-primary/5 shadow-inner" : "border-border hover:border-primary/50"}`}
              >
                <div className={`p-2 rounded-lg ${settings.biggerCursor ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <MousePointer className="w-6 h-6" />
                </div>
                <span className="font-semibold">{t.biggerCursor}</span>
              </button>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">{t.lineHeight}</label>
              <select
                value={settings.lineHeight}
                onChange={(e) => setSettings(s => ({ ...s, lineHeight: e.target.value }))}
                className="w-full p-3 rounded-lg bg-muted border border-border focus:ring-2 ring-primary outline-none"
              >
                <option value="normal">{t.lineNormal}</option>
                <option value="relaxed">{t.lineRelaxed}</option>
                <option value="loose">{t.lineLoose}</option>
              </select>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" /> {t.effectsColors}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSettings(s => ({ ...s, stopAnimations: !s.stopAnimations }))}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${settings.stopAnimations ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <Zap className={`w-6 h-6 ${settings.stopAnimations ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-semibold">{t.stopAnimations}</span>
              </button>

              <button
                onClick={() => setSettings(s => ({ ...s, invertColors: !s.invertColors }))}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${settings.invertColors ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <Palette className={`w-6 h-6 ${settings.invertColors ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-semibold">{t.invertColors}</span>
              </button>

              <button
                onClick={() => setSettings(s => ({ ...s, liquidGlass: s.liquidGlass === false }))}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${settings.liquidGlass !== false ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <Droplets className={`w-6 h-6 ${settings.liquidGlass !== false ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-semibold">{t.liquidGlass}</span>
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label className="text-sm font-medium block mb-2">{t.brightness}: {settings.brightness}%</label>
                <input
                  type="range" min="50" max="150" value={settings.brightness}
                  onChange={(e) => setSettings(s => ({ ...s, brightness: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">{t.contrast}: {settings.contrast}%</label>
                <input
                  type="range" min="50" max="150" value={settings.contrast}
                  onChange={(e) => setSettings(s => ({ ...s, contrast: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Languages className="w-4 h-4" /> {t.language}
            </h3>
            <div className="flex p-1 bg-muted rounded-xl gap-1">
              {["az", "en", "ru"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSettings(s => ({ ...s, language: lang }))}
                  className={`flex-1 py-3 rounded-lg transition-all font-semibold text-sm ${settings.language === lang ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {lang === "az" ? "Azərbaycan" : lang === "en" ? "English" : "Русский"}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{t.theme}</h3>
            <div className="flex p-1 bg-muted rounded-xl gap-1">
              <button
                onClick={() => setSettings(s => ({ ...s, theme: "dark" }))}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${settings.theme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Moon className="w-4 h-4" /> {t.dark}
              </button>
              <button
                onClick={() => setSettings(s => ({ ...s, theme: "light" }))}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${settings.theme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Sun className="w-4 h-4" /> {t.light}
              </button>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-border bg-muted/20">
          <Button onClick={resetSettings} variant="outline" className="w-full">
            {t.reset}
          </Button>
        </div>
      </div>
    </div>
  );
};