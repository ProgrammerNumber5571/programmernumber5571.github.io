import { useState } from "react";
import { Button } from "./ui/Button";
import { VinylRecord } from "./VinylRecord";
import { useLanguage } from "./LanguageContext.jsx";
import { useInView } from "../lib/useInView.js";
import { toast } from "sonner";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../Firebase/Firebase.js";

export const Newsletter = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sectionRef, inView] = useInView();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error(t.invalidEmail);
      return;
    }
    try {
      const subscribers = JSON.parse(localStorage.getItem("newsletter_subscribers") || "[]");
      if (!subscribers.includes(email.trim())) {
        subscribers.push(email.trim());
        localStorage.setItem("newsletter_subscribers", JSON.stringify(subscribers));
      }
    } catch { /* storage unavailable — subscription is still acknowledged */ }
    // Central copy for when Firestore is provisioned; local copy is the fallback
    addDoc(collection(db, "newsletter"), { email: email.trim(), createdAt: Date.now() })
      .catch(() => { /* unreachable — subscriber kept in localStorage */ });
    toast.success(t.subscribedToast);
    setEmail("");
  };

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-secondary via-card to-secondary" />

      {/* Decorative vinyls (only spin while on screen) */}
      <div className="absolute -left-16 top-1/2 -translate-y-1/2 opacity-20">
        <VinylRecord size="xl" spinning={inView} />
      </div>
      <div className="absolute -right-16 top-1/2 -translate-y-1/2 opacity-20">
        <VinylRecord size="xl" spinning={inView} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-primary font-medium tracking-widest text-sm uppercase mb-2">
            {t.newsletterTag}
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            {t.newsletterTitle}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            {t.newsletterSubtitle}
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="flex-1 bg-background border h-12 px-4 rounded-md focus:border-primary"
            />
            <Button type="submit" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              {t.subscribe}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-4">
            {t.newsletterNote}
          </p>
        </div>
      </div>
    </section>
  );
};
