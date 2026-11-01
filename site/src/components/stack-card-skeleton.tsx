import styles from "./stack-card-skeleton.module.css";

const TECH_COUNT = 6;

export function StackCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden>
      <div className={styles.shot}>
        <div className={styles.image} />
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.who} />
          <span className={styles.score} />
        </div>
        <span className={styles.title} />
        <div className={styles.stack}>
          {Array.from({ length: TECH_COUNT }, (_, index) => (
            <span key={index} className={styles.tech}>
              <span className={styles.logo} />
              <span className={styles.name} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
