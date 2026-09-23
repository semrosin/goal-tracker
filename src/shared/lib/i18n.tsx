import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

export type Locale = 'ru' | 'en';

const storageKey = 'goal-tracker-locale';

const messages = {
  ru: {
    'app.title': 'Goal Tracker — цели накоплений',
    'app.description': 'Планируйте накопления и отслеживайте прогресс целей.',
    'welcome.title': 'Копите на важное с понятным планом',
    'welcome.lead':
      'Записывайте пополнения и снятия, следите за прогрессом и узнавайте, сколько откладывать каждый месяц.',
    'welcome.demo': 'Посмотреть демо',
    'welcome.signIn': 'Войти',
    'welcome.noRegistration': 'Демо открывается без регистрации.',
    'welcome.exampleGoal': 'Пример цели',
    'welcome.exampleTitle': 'Поездка к морю',
    'welcome.exampleProgress': '42% пути к цели',
    'welcome.previewLabel': 'Пример цели накопления',
    'welcome.progressLabel': 'Прогресс примера цели',
    'welcome.ofTarget': 'из {amount}',
    'language.label': 'Язык',
    'overview.logo': 'Логотип Goal Tracker',
    'overview.create': 'Новая цель',
    'overview.summary': 'Сводка накоплений',
    'overview.total': 'Всего накоплено',
    'overview.active': 'Активных целей',
    'overview.completed': 'Выполненных целей',
    'overview.goalList': 'Список целей',
    'overview.title': 'Мои цели',
    'overview.empty': 'У вас пока нет целей',
    'overview.emptyHint':
      'Создайте первую цель, чтобы начать следить за накоплениями.',
    'list.completed': 'Выполнено',
    'progress.default': 'Прогресс цели',
    'toolbar.demoMode': 'Демо · данные на этом устройстве',
    'toolbar.resetPrompt': 'Сбросить все изменения в демо?',
    'toolbar.reset': 'Сбросить демо',
    'toolbar.home': 'На главную',
    'toolbar.signOut': 'Выйти',
    'toolbar.signOutError': 'Не удалось выйти. Повторите попытку.',
    'status.checkingSession': 'Проверяем сессию…',
    'status.loadingGoals': 'Загружаем цели…',
    'status.loadError': 'Не удалось загрузить цели',
    'status.syncError': 'Не удалось обновить данные.',
    'status.retry': 'Повторить',
    'detail.notFound': 'Цель не найдена',
    'detail.back': 'К списку целей',
    'detail.edit': 'Изменить',
    'transaction.title': 'Добавить операцию',
    'transaction.type': 'Тип операции',
    'transaction.depositAction': 'Пополнить',
    'transaction.withdrawAction': 'Снять',
    'transaction.amount': 'Сумма',
    'transaction.add': 'Добавить операцию',
    'transaction.adding': 'Добавляем…',
    'transaction.invalidAmount': 'Укажите положительную целую сумму',
    'transaction.overBalance': 'Нельзя снять больше, чем накоплено',
    'transaction.addError': 'Не удалось добавить операцию',
    'history.title': 'История операций',
    'history.empty': 'Операций пока нет. Пополните цель, чтобы начать историю.',
    'history.deposit': 'Пополнение',
    'history.withdrawal': 'Снятие',
    'history.depositObject': 'пополнение',
    'history.withdrawalObject': 'снятие',
    'history.deleteLabel': 'Удалить {type} {amount} от {date}, операция {id}',
    'delete.action': 'Удалить',
    'delete.cancel': 'Отмена',
    'delete.deleting': 'Удаляем…',
    'delete.goalDescription': 'Цель и все связанные операции будут удалены.',
    'delete.goalError': 'Не удалось удалить цель',
    'delete.transactionTitle': 'Удалить операцию',
    'delete.transactionDescription':
      'Операция будет удалена без возможности восстановления.',
    'delete.transactionBlocked':
      'Нельзя удалить операцию: это приведёт к отрицательному балансу',
    'delete.transactionError': 'Не удалось удалить операцию',
    'dialog.close': 'Закрыть',
    'auth.backHome': 'На главную',
    'auth.eyebrow': 'Ваши цели, ваш темп',
    'auth.email': 'Электронная почта',
    'auth.password': 'Пароль',
    'auth.signIn': 'Войти',
    'auth.signInDescription': 'Продолжайте копить с любого устройства.',
    'auth.unavailableDemo':
      'Облачный режим пока не настроен. Вы можете посмотреть демо.',
    'auth.unavailable': 'Облачный режим пока не настроен.',
    'auth.expired': 'Сессия завершилась. Войдите снова.',
    'auth.signingIn': 'Входим…',
    'auth.forgotPassword': 'Забыли пароль?',
    'auth.createAccount': 'Создать аккаунт',
    'auth.signUpDescription': 'Сохраните цели и операции в облаке.',
    'auth.checkEmail': 'Проверьте почту',
    'auth.confirmEmailHint':
      'Перейдите по ссылке в письме, чтобы подтвердить адрес и войти.',
    'auth.backSignIn': 'Ко входу',
    'auth.passwordHint': 'Не менее 8 символов.',
    'auth.creating': 'Создаём…',
    'auth.register': 'Зарегистрироваться',
    'auth.haveAccount': 'Уже есть аккаунт? Войти',
    'auth.forgotTitle': 'Восстановить доступ',
    'auth.forgotDescription': 'Отправим ссылку для установки нового пароля.',
    'auth.resetSent':
      'Если адрес зарегистрирован, письмо со ссылкой уже отправлено.',
    'auth.sending': 'Отправляем…',
    'auth.sendLink': 'Отправить ссылку',
    'auth.passwordMismatch': 'Пароли не совпадают',
    'auth.newPassword': 'Новый пароль',
    'auth.repeatPassword': 'Повторите пароль',
    'auth.resetTitle': 'Новый пароль',
    'auth.resetDescription': 'Установите пароль для вашего аккаунта.',
    'auth.checkingLink': 'Проверяем ссылку…',
    'auth.invalidLink': 'Ссылка истекла или недействительна.',
    'auth.requestNew': 'Запросить новую',
    'auth.saving': 'Сохраняем…',
    'auth.savePassword': 'Сохранить пароль',
    'auth.callbackTitle': 'Подтверждение адреса',
    'auth.callbackDescription': 'Проверяем ссылку из письма.',
    'auth.signedIn': 'Вы вошли в аккаунт.',
    'auth.openGoals': 'Открыть цели',
    'auth.returnSignIn': 'Вернуться ко входу',
    'auth.invalidCredentials': 'Неверная почта или пароль',
    'auth.emailNotConfirmed': 'Подтвердите адрес по ссылке в письме',
    'auth.rateLimit': 'Слишком много попыток. Повторите позже',
    'auth.requestError': 'Не удалось выполнить запрос. Повторите попытку',
    'error.request': 'Не удалось выполнить запрос. Повторите попытку.',
    'error.balance': 'Недостаточно средств для снятия.',
    'error.history': 'Удаление сделает баланс в истории отрицательным.',
    'error.concurrent':
      'Данные изменились одновременно в другой вкладке. Повторите попытку.',
    'error.goalMissing': 'Цель больше не найдена. Обновите данные.',
    'error.transactionMissing': 'Операция больше не найдена. Обновите данные.',
    'error.badData': 'Сервер вернул некорректные данные.',
    'error.unavailable': 'Облачный режим пока не настроен.',
    'error.session': 'Не удалось открыть сессию.',
    'error.signInRequired': 'Войдите в аккаунт, чтобы продолжить.',
    'goal.createTitle': 'Новая цель',
    'goal.editTitle': 'Изменить',
    'goal.titleLabel': 'Название',
    'goal.titleRequiredCreate': 'Укажите название цели',
    'goal.titleRequiredEdit': 'Введите название цели',
    'goal.amountLabel': 'Сумма',
    'goal.amountRequiredCreate': 'Сумма должна быть положительным целым числом',
    'goal.amountRequiredEdit': 'Укажите положительную целую сумму',
    'goal.monthLabel': 'Месяц достижения',
    'goal.monthInvalid': 'Укажите корректный месяц',
    'goal.descriptionLabel': 'Описание',
    'goal.descriptionPlaceholder':
      'Напишите, зачем вам эта цель и о чём вы мечтаете',
    'goal.createAction': 'Создать',
    'goal.saveAction': 'Сохранить',
    'goal.saving': 'Сохраняем…',
    'goal.createError': 'Не удалось создать цель. Попробуйте ещё раз.',
    'goal.saveError': 'Не удалось сохранить цель. Попробуйте ещё раз.',
    'goal.summaryTitle': 'Описание',
    'goal.saved': 'Накоплено',
    'goal.target': 'Цель',
    'goal.progress': 'Прогресс',
    'goal.progressLabel': 'Прогресс цели {title}',
    'plan.title': 'План накопления',
    'plan.active': 'По плану',
    'plan.overdue': 'Срок прошёл',
    'plan.completed': 'Цель достигнута',
    'plan.noDeadline': 'Без срока',
    'plan.targetMonth': 'Месяц достижения: {month}',
    'plan.monthlyContribution': '{amount} в месяц',
    'plan.overdueHint':
      'Измените месяц достижения или рассчитайте новый ежемесячный взнос.',
    'plan.noDeadlineHint':
      'Добавьте месяц достижения, чтобы увидеть нужный ежемесячный взнос.',
    'plan.whatIfLabel': 'Если откладывать в месяц',
    'plan.whatIfPlaceholder': 'Например, 5000',
    'plan.whatIfHint':
      'Укажите положительную сумму в целых рублях для прогноза.',
    'plan.forecast': 'Прогноз достижения: {month}',
  },
  en: {
    'app.title': 'Goal Tracker — savings goals',
    'app.description': 'Plan savings and track progress toward your goals.',
    'welcome.title': 'Save for what matters with a clear plan',
    'welcome.lead':
      'Record deposits and withdrawals, track progress, and see how much to save each month.',
    'welcome.demo': 'Explore the demo',
    'welcome.signIn': 'Sign in',
    'welcome.noRegistration': 'The demo works without an account.',
    'welcome.exampleGoal': 'Example goal',
    'welcome.exampleTitle': 'A seaside trip',
    'welcome.exampleProgress': '42% of the way there',
    'welcome.previewLabel': 'Example savings goal',
    'welcome.progressLabel': 'Example goal progress',
    'welcome.ofTarget': 'of {amount}',
    'language.label': 'Language',
    'overview.logo': 'Goal Tracker logo',
    'overview.create': 'New goal',
    'overview.summary': 'Savings overview',
    'overview.total': 'Total saved',
    'overview.active': 'Active goals',
    'overview.completed': 'Completed goals',
    'overview.goalList': 'Goals list',
    'overview.title': 'My goals',
    'overview.empty': 'No goals yet',
    'overview.emptyHint':
      'Create your first goal to start tracking your savings.',
    'list.completed': 'Completed',
    'progress.default': 'Goal progress',
    'toolbar.demoMode': 'Demo · saved on this device',
    'toolbar.resetPrompt': 'Reset all changes to the demo?',
    'toolbar.reset': 'Reset demo',
    'toolbar.home': 'Home',
    'toolbar.signOut': 'Sign out',
    'toolbar.signOutError': 'Could not sign out. Please try again.',
    'status.checkingSession': 'Checking your session…',
    'status.loadingGoals': 'Loading goals…',
    'status.loadError': 'Could not load goals',
    'status.syncError': 'Could not refresh data.',
    'status.retry': 'Retry',
    'detail.notFound': 'Goal not found',
    'detail.back': 'Back to goals',
    'detail.edit': 'Edit',
    'transaction.title': 'Add transaction',
    'transaction.type': 'Transaction type',
    'transaction.depositAction': 'Deposit',
    'transaction.withdrawAction': 'Withdraw',
    'transaction.amount': 'Amount',
    'transaction.add': 'Add transaction',
    'transaction.adding': 'Adding…',
    'transaction.invalidAmount': 'Enter a positive whole amount',
    'transaction.overBalance': 'You cannot withdraw more than you have saved',
    'transaction.addError': 'Could not add the transaction',
    'history.title': 'Transaction history',
    'history.empty': 'No transactions yet. Add a deposit to begin.',
    'history.deposit': 'Deposit',
    'history.withdrawal': 'Withdrawal',
    'history.depositObject': 'deposit',
    'history.withdrawalObject': 'withdrawal',
    'history.deleteLabel':
      'Delete {type} {amount} from {date}, transaction {id}',
    'delete.action': 'Delete',
    'delete.cancel': 'Cancel',
    'delete.deleting': 'Deleting…',
    'delete.goalDescription':
      'This goal and all its transactions will be deleted.',
    'delete.goalError': 'Could not delete the goal',
    'delete.transactionTitle': 'Delete transaction',
    'delete.transactionDescription':
      'This transaction cannot be restored after deletion.',
    'delete.transactionBlocked':
      'This transaction cannot be deleted because the balance would become negative',
    'delete.transactionError': 'Could not delete the transaction',
    'dialog.close': 'Close',
    'auth.backHome': 'Home',
    'auth.eyebrow': 'Your goals, your pace',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signIn': 'Sign in',
    'auth.signInDescription': 'Keep saving from any device.',
    'auth.unavailableDemo':
      'Cloud accounts are not configured yet. You can explore the demo.',
    'auth.unavailable': 'Cloud accounts are not configured yet.',
    'auth.expired': 'Your session expired. Sign in again.',
    'auth.signingIn': 'Signing in…',
    'auth.forgotPassword': 'Forgot password?',
    'auth.createAccount': 'Create account',
    'auth.signUpDescription': 'Save goals and transactions to your account.',
    'auth.checkEmail': 'Check your email',
    'auth.confirmEmailHint':
      'Open the link in the email to confirm your address and sign in.',
    'auth.backSignIn': 'Back to sign in',
    'auth.passwordHint': 'At least 8 characters.',
    'auth.creating': 'Creating…',
    'auth.register': 'Sign up',
    'auth.haveAccount': 'Already have an account? Sign in',
    'auth.forgotTitle': 'Recover access',
    'auth.forgotDescription': 'We will send a link to set a new password.',
    'auth.resetSent':
      'If this address has an account, a reset link has been sent.',
    'auth.sending': 'Sending…',
    'auth.sendLink': 'Send reset link',
    'auth.passwordMismatch': 'Passwords do not match',
    'auth.newPassword': 'New password',
    'auth.repeatPassword': 'Repeat password',
    'auth.resetTitle': 'New password',
    'auth.resetDescription': 'Set a password for your account.',
    'auth.checkingLink': 'Checking link…',
    'auth.invalidLink': 'This link is expired or invalid.',
    'auth.requestNew': 'Request another',
    'auth.saving': 'Saving…',
    'auth.savePassword': 'Save password',
    'auth.callbackTitle': 'Confirm email',
    'auth.callbackDescription': 'Checking the link in your email.',
    'auth.signedIn': 'You are signed in.',
    'auth.openGoals': 'Open goals',
    'auth.returnSignIn': 'Back to sign in',
    'auth.invalidCredentials': 'Incorrect email or password',
    'auth.emailNotConfirmed': 'Confirm your email using the link we sent',
    'auth.rateLimit': 'Too many attempts. Try again later',
    'auth.requestError': 'Could not complete the request. Please try again',
    'error.request': 'Could not complete the request. Please try again.',
    'error.balance': 'There is not enough money to withdraw.',
    'error.history':
      'Deleting this transaction would make the historical balance negative.',
    'error.concurrent':
      'Data changed in another tab at the same time. Please try again.',
    'error.goalMissing': 'This goal no longer exists. Refresh your data.',
    'error.transactionMissing':
      'This transaction no longer exists. Refresh your data.',
    'error.badData': 'The server returned invalid data.',
    'error.unavailable': 'Cloud accounts are not configured yet.',
    'error.session': 'Could not start a session.',
    'error.signInRequired': 'Sign in to continue.',
    'goal.createTitle': 'New goal',
    'goal.editTitle': 'Edit goal',
    'goal.titleLabel': 'Name',
    'goal.titleRequiredCreate': 'Enter a goal name',
    'goal.titleRequiredEdit': 'Enter a goal name',
    'goal.amountLabel': 'Amount',
    'goal.amountRequiredCreate': 'Enter a positive whole amount',
    'goal.amountRequiredEdit': 'Enter a positive whole amount',
    'goal.monthLabel': 'Target month',
    'goal.monthInvalid': 'Enter a valid month',
    'goal.descriptionLabel': 'Description',
    'goal.descriptionPlaceholder': 'Describe why this goal matters to you',
    'goal.createAction': 'Create',
    'goal.saveAction': 'Save',
    'goal.saving': 'Saving…',
    'goal.createError': 'Could not create the goal. Please try again.',
    'goal.saveError': 'Could not save the goal. Please try again.',
    'goal.summaryTitle': 'Description',
    'goal.saved': 'Saved',
    'goal.target': 'Target',
    'goal.progress': 'Progress',
    'goal.progressLabel': 'Progress toward {title}',
    'plan.title': 'Savings plan',
    'plan.active': 'On track',
    'plan.overdue': 'Past the target month',
    'plan.completed': 'Goal reached',
    'plan.noDeadline': 'No target month',
    'plan.targetMonth': 'Target month: {month}',
    'plan.monthlyContribution': '{amount} per month',
    'plan.overdueHint': 'Change the target month or try a new monthly amount.',
    'plan.noDeadlineHint':
      'Add a target month to see the monthly amount needed.',
    'plan.whatIfLabel': 'If saving each month',
    'plan.whatIfPlaceholder': 'For example, 5000',
    'plan.whatIfHint':
      'Enter a positive whole amount in rubles to see a forecast.',
    'plan.forecast': 'Forecast: {month}',
  },
} as const;

export type MessageKey = keyof typeof messages.ru;

export const resolveLocale = (
  saved: string | null,
  browserLanguage: string
): Locale => {
  if (saved === 'ru' || saved === 'en') return saved;
  return browserLanguage.toLowerCase().startsWith('ru') ? 'ru' : 'en';
};

const readInitialLocale = (): Locale => {
  const browserLanguage =
    typeof navigator === 'undefined' ? 'en' : navigator.language;
  try {
    return resolveLocale(localStorage.getItem(storageKey), browserLanguage);
  } catch {
    return resolveLocale(null, browserLanguage);
  }
};

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
};

const interpolate = (
  message: string,
  params?: Record<string, string | number>
) =>
  message.replace(/\{([^}]+)\}/g, (_match, name: string) =>
    String(params?.[name] ?? '')
  );

const I18nContext = createContext<I18nValue>({
  locale: 'ru',
  setLocale: () => undefined,
  t: (key, params) => interpolate(messages.ru[key], params),
});

export const LocaleProvider = ({ children }: PropsWithChildren) => {
  const [locale, setLocale] = useState<Locale>(readInitialLocale);

  useEffect(() => {
    const previous = document.documentElement.lang;
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    const previousDescription = description?.content;
    document.documentElement.lang = locale;
    document.title = messages[locale]['app.title'];
    if (description) description.content = messages[locale]['app.description'];
    try {
      localStorage.setItem(storageKey, locale);
    } catch {
      // The language still works for this visit when storage is disabled.
    }
    return () => {
      document.documentElement.lang = previous;
      document.title = previousTitle;
      if (description && previousDescription !== undefined) {
        description.content = previousDescription;
      }
    };
  }, [locale]);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => interpolate(messages[locale][key], params),
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nValue => useContext(I18nContext);
