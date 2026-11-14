import {
  Car,
  Gift,
  GraduationCap,
  Heart,
  House,
  Laptop,
  Plane,
  Target,
} from 'lucide-react';
import { useId } from 'react';
import { useI18n } from '../../../shared/lib/i18n';
import {
  goalColors,
  goalIcons,
  type GoalColor,
  type GoalIconName,
} from '../model/appearance';
import styles from './GoalAppearance.module.scss';

const icons = {
  target: Target,
  plane: Plane,
  home: House,
  car: Car,
  gift: Gift,
  heart: Heart,
  laptop: Laptop,
  graduation: GraduationCap,
};
export const GoalIcon = ({
  name = 'target',
  size = 22,
}: {
  name?: GoalIconName;
  size?: number;
}) => {
  const Icon = icons[name];
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
};

type Props = {
  color: GoalColor;
  icon: GoalIconName;
  onColorChange: (value: GoalColor) => void;
  onIconChange: (value: GoalIconName) => void;
};
export const GoalAppearancePicker = ({
  color,
  icon,
  onColorChange,
  onIconChange,
}: Props) => {
  const { t } = useI18n();
  const id = useId();
  return (
    <div className={styles.picker}>
      <fieldset className={styles.group}>
        <legend>{t('appearance.color')}</legend>
        <div className={styles.options}>
          {goalColors.map((option) => (
            <label
              className={styles.choice}
              key={option}
              title={t(`appearance.${option}`)}
            >
              <input
                type="radio"
                name={`${id}-color`}
                value={option}
                checked={color === option}
                onChange={() => onColorChange(option)}
                aria-label={t(`appearance.${option}`)}
              />
              <span className={styles.swatch} data-color={option} />
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.group}>
        <legend>{t('appearance.icon')}</legend>
        <div className={styles.options}>
          {goalIcons.map((option) => (
            <label
              className={styles.choice}
              key={option}
              title={t(`appearance.${option}`)}
            >
              <input
                type="radio"
                name={`${id}-icon`}
                value={option}
                checked={icon === option}
                onChange={() => onIconChange(option)}
                aria-label={t(`appearance.${option}`)}
              />
              <span className={styles.iconChoice}>
                <GoalIcon name={option} size={19} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
};
