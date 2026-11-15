import { UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';

import { useI18n } from '../../../shared/lib/i18n';
import { publicAsset } from '../../../shared/lib/publicPath';
import styles from './AppHeader.module.scss';

export const AppHeader = ({ children }: { children?: ReactNode }) => {
  const { t } = useI18n();
  const { pathname, search } = useLocation();
  const goalsPath = pathname.startsWith('/goals/') ? `/app${search}` : '/app';

  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <Link
          className={styles.brand}
          to={goalsPath}
          aria-label={t('overview.title')}
        >
          <img
            src={publicAsset('logo.svg')}
            alt={t('overview.logo')}
            width={44}
            height={44}
          />
          <span>GoalCraft</span>
        </Link>
        <nav className={styles.navigation} aria-label={t('nav.goals')}>
          <Link
            className={styles.goalsLink}
            to={goalsPath}
            aria-current={
              pathname === '/app' || pathname.startsWith('/goals/')
                ? 'page'
                : undefined
            }
          >
            {t('nav.goals')}
          </Link>
        </nav>
        <div className={styles.actions}>
          {children}
          <NavLink
            className={styles.profile}
            to="/profile"
            aria-label={t('profile.title')}
            title={t('profile.title')}
          >
            <UserRound size={20} strokeWidth={1.8} aria-hidden="true" />
          </NavLink>
        </div>
      </div>
    </header>
  );
};
