import styles from './GoalsOverviewPage.module.scss';

export const GoalsOverviewPage = () => (
  <main className={styles.page}>
    <header className={styles.header}>
      <h1>Мои цели</h1>
    </header>
    <section aria-label="Создание цели" className={styles.createTargetSlot} />
  </main>
);
