import { useI18n } from '../../lib/i18n';
import styles from './LanguageSwitcher.module.scss';

export const LanguageSwitcher = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      aria-label={t('language.label')}
      className={styles.switcher}
      role="group"
    >
      <button
        aria-pressed={locale === 'ru'}
        className={locale === 'ru' ? styles.active : undefined}
        onClick={() => setLocale('ru')}
        type="button"
      >
        RU
      </button>
      <button
        aria-pressed={locale === 'en'}
        className={locale === 'en' ? styles.active : undefined}
        onClick={() => setLocale('en')}
        type="button"
      >
        EN
      </button>
    </div>
  );
};
