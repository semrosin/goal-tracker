import type { CSSProperties } from 'react';

import styles from './AmbientParticles.module.scss';

const positions = [
  3, 72, 24, 91, 53, 12, 83, 38, 66, 97, 18, 47, 77, 30, 58, 8, 87, 43, 69, 21,
  95, 34, 62, 15, 80, 50, 27, 74,
];
const delays = [
  2, 19, 8, 25, 13, 29, 4, 21, 10, 16, 27, 5, 23, 12, 1, 18, 7, 26, 14, 3, 22,
  9, 28, 17, 6, 24, 11, 20,
];

const particles = positions.map((left, index) => ({
  left,
  duration: 17 + ((index * 7) % 15),
  delay: -delays[index],
  drift: ((index * 13) % 61) - 30,
  size: 3 + (index % 3),
}));

export const AmbientParticles = () => (
  <div aria-hidden="true" className={styles.particles} data-ambient-particles>
    {particles.map((particle, index) => (
      <span
        className={styles.particle}
        key={index}
        style={
          {
            '--left': `${particle.left}%`,
            '--duration': `${particle.duration}s`,
            '--delay': `${particle.delay}s`,
            '--drift': `${particle.drift}px`,
            '--size': `${particle.size}px`,
          } as CSSProperties
        }
      />
    ))}
  </div>
);
