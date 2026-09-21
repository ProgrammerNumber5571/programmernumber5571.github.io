import { useLanguage } from './LanguageContext.jsx';

const PRIVACY_URL = 'https://policies.google.com/privacy';
const TERMS_URL = 'https://policies.google.com/terms';

export function RecaptchaNotice() {
  const { t } = useLanguage();

  const linkProps = {
    target: '_blank',
    rel: 'noopener noreferrer',
    className: 'text-primary hover:underline',
  };

  const links = {
    '{privacy}': (
      <a key="privacy" href={PRIVACY_URL} {...linkProps}>
        {t.recaptchaPrivacy}
      </a>
    ),
    '{terms}': (
      <a key="terms" href={TERMS_URL} {...linkProps}>
        {t.recaptchaTerms}
      </a>
    ),
  };

  return (
    <p className="text-center text-xs text-muted-foreground">
      {t.recaptchaNotice.split(/(\{privacy\}|\{terms\})/).map((part) => links[part] ?? part)}
    </p>
  );
}
