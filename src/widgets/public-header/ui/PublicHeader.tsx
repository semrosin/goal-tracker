import { Link } from 'react-router';

import { publicAsset } from '../../../shared/lib/publicPath';
import { LanguageSwitcher } from '../../../shared/ui/LanguageSwitcher/LanguageSwitcher';
import styles from './PublicHeader.module.scss';

export const PublicHeader = () => (
  <header className={styles.header}>
    <div className={styles.inner}>
      <Link className={styles.brand} to="/">
        <img alt="" height={36} src={publicAsset('logo.svg')} width={36} />
        <span>GoalCraft</span>
      </Link>
      <LanguageSwitcher />
    </div>
  </header>
);
