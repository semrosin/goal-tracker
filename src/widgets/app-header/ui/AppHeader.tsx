import { UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router';

import { useI18n } from '../../../shared/lib/i18n';
import { publicAsset } from '../../../shared/lib/publicPath';
import styles from './AppHeader.module.scss';

export const AppHeader = ({ children }: { children?: ReactNode }) => {
  const { t } = useI18n();

  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <Link
          className={styles.brand}
          to="/app"
          aria-label={t('overview.title')}
        >
          <img
            src={publicAsset('logo.svg')}
            alt={t('overview.logo')}
            width={44}
            height={44}
          />
        </Link>
        <div className={styles.actions}>
          {children}
          <NavLink
            className={styles.profile}
            to="/profile"
            aria-label={'Profile'}
            title={'Profile'}
          >
            <UserRound size={20} aria-hidden="true" />
          </NavLink>
        </div>
      </div>
    </header>
  );
};
