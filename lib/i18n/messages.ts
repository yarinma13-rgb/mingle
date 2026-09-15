import type { AppLocale } from "@/lib/i18n/locale";

export type AppMessages = {
  lang: { aria: string; en: string; he: string };
  auth: {
    welcomeBack: string;
    signInHeadline: string;
    signInSub: string;
    signupGenericEyebrow: string;
    signupGenericHeadline: string;
    signupGenericSub: string;
    talentEyebrow: string;
    talentHeadline: string;
    talentSub: string;
    companyEyebrow: string;
    companyHeadline: string;
    companySub: string;
    email: string;
    password: string;
    continue: string;
    signIn: string;
    creating: string;
    signingIn: string;
    or: string;
    continueGoogle: string;
    forgotPassword: string;
    sending: string;
    resetSent: string;
    choosePath: string;
    choosePathContinue: string;
    confirmTalent: string;
    confirmCompany: string;
    switchToCompany: string;
    switchToTalent: string;
    segmentTalent: string;
    segmentCompany: string;
    checkEmailTitle: string;
    checkEmailBody: string;
    haveAccount: string;
    needAccount: string;
    alreadyAccount: string;
    emailExists: string;
  };
  shell: {
    settings: string;
    help: string;
    search: string;
    searchCandidates: string;
    searchCompanies: string;
    recruiter: string;
    talent: string;
    discover: string;
    conversations: string;
    connections: string;
    board: string;
    roles: string;
    team: string;
  };
  settings: {
    title: string;
    search: string;
    noMatch: string;
    account: string;
    signedInAs: string;
    path: string;
    editProfile: string;
    editProfileBody: string;
    openProfile: string;
    security: string;
    password: string;
    passwordBody: string;
    notifications: string;
    emailAlerts: string;
    emailAlertsBody: string;
    privacy: string;
    visibility: string;
    visibilityTalent: string;
    visibilityCompany: string;
    support: string;
    reportProblem: string;
    reportProblemBody: string;
    openSupport: string;
    language: string;
    languageBody: string;
    danger: string;
    deleteAccount: string;
    deleteAccountBody: string;
    deleteAccountCta: string;
    deleteTitle: string;
    deleteWarn: string;
    deleteConfirm: string;
    deleteCancel: string;
    deleteWorking: string;
    restored: string;
  };
  onboarding: {
    continue: string;
    skip: string;
    back: string;
    done: string;
    talentEyebrow: string;
    talentHeadline: string;
    talentSub: string;
    companyEyebrow: string;
    companyHeadline: string;
    companySub: string;
  };
};

export const APP_MESSAGES: Record<AppLocale, AppMessages> = {
  en: {
    lang: { aria: "Language", en: "EN", he: "עב" },
    auth: {
      welcomeBack: "Welcome back",
      signInHeadline: "Sign in to mingle",
      signInSub: "Pick up where you left off.",
      signupGenericEyebrow: "Get started — it’s free for talent",
      signupGenericHeadline: "Welcome to mingle",
      signupGenericSub: "No credit card needed. Choose how you’re joining.",
      talentEyebrow: "Continuing as talent",
      talentHeadline: "Welcome to mingle",
      talentSub: "Get matched with roles that fit — free for talent.",
      companyEyebrow: "Continuing as a company",
      companyHeadline: "Welcome to mingle",
      companySub: "See the few people worth talking to, with clear reasons.",
      email: "Email",
      password: "Password",
      continue: "Continue",
      signIn: "Sign in",
      creating: "Creating account…",
      signingIn: "Signing in…",
      or: "or",
      continueGoogle: "Continue with Google",
      forgotPassword: "Forgot password",
      sending: "Sending…",
      resetSent: "If that email is on mingle, we sent a reset link.",
      choosePath: "Choose talent or company to create your account.",
      choosePathContinue: "Choose Talent or Company to continue.",
      confirmTalent: "Confirm Talent",
      confirmCompany: "Confirm Company",
      switchToCompany: "Switch to Company",
      switchToTalent: "Switch to Talent",
      segmentTalent: "Talent",
      segmentCompany: "Company",
      checkEmailTitle: "Check your email",
      checkEmailBody:
        "We sent a confirmation link to your inbox. Confirm your email, then come back and continue.",
      haveAccount: "Already have an account? Sign in",
      needAccount: "New here? Create an account",
      alreadyAccount: "That email already has an account. Sign in instead.",
      emailExists: "That email already has an account. Sign in instead.",
    },
    shell: {
      settings: "Settings",
      help: "Help",
      search: "Search",
      searchCandidates: "Search candidates or roles",
      searchCompanies: "Search companies",
      recruiter: "Recruiter",
      talent: "Talent",
      discover: "Discover",
      conversations: "Conversations",
      connections: "Connections",
      board: "Board",
      roles: "Roles",
      team: "Team",
    },
    settings: {
      title: "Settings",
      search: "Search settings",
      noMatch: "No settings match that search.",
      account: "Account",
      signedInAs: "Signed in as",
      path: "Path",
      editProfile: "Edit profile",
      editProfileBody: "Update the profile companies and talent see.",
      openProfile: "Open profile",
      security: "Security",
      password: "Password",
      passwordBody: "Change the password for this account.",
      notifications: "Notifications",
      emailAlerts: "Email alerts",
      emailAlertsBody:
        "Coming soon — connection and conversation emails stay on for everyone right now.",
      privacy: "Privacy",
      visibility: "Profile visibility",
      visibilityTalent:
        "Coming soon — your talent profile is visible to companies on mingle today. A pause toggle will land here.",
      visibilityCompany:
        "Coming soon — your company profile is visible to talent on mingle today.",
      support: "Support",
      reportProblem: "Report a problem",
      reportProblemBody:
        "Something broke or looks wrong? Send us a note from inside the app.",
      openSupport: "Open support",
      language: "Language",
      languageBody: "Switch the app between English and Hebrew.",
      danger: "Danger zone",
      deleteAccount: "Delete account",
      deleteAccountBody:
        "Schedule permanent deletion. You’ll have 14 days to sign back in and keep your profile.",
      deleteAccountCta: "Delete account",
      deleteTitle: "Delete your mingle account?",
      deleteWarn:
        "All your details will be permanently deleted in the next 14 days. If you deleted by mistake — or change your mind — just sign in again within those 14 days and we’ll restore your account at the same point, with your existing profile. After 14 days your Gmail/Google link and data are removed.",
      deleteConfirm: "Yes, schedule deletion",
      deleteCancel: "Keep my account",
      deleteWorking: "Scheduling…",
      restored:
        "Welcome back — your account deletion was cancelled. You’re continuing with your existing profile.",
    },
    onboarding: {
      continue: "Continue",
      skip: "Skip for now",
      back: "Back",
      done: "All set",
      talentEyebrow: "Your profile",
      talentHeadline: "Let’s get to know you",
      talentSub: "Two sharp signals — skip anything that can wait.",
      companyEyebrow: "Company profile",
      companyHeadline: "Let’s find the right people",
      companySub:
        "Two sharp signals that actually feed matching — skip what can wait.",
    },
  },
  he: {
    lang: { aria: "שפה", en: "EN", he: "עב" },
    auth: {
      welcomeBack: "ברוכים השבים",
      signInHeadline: "התחברות ל־mingle",
      signInSub: "ממשיכים בדיוק איפה שעצרתם.",
      signupGenericEyebrow: "מתחילים — בחינם לטאלנט",
      signupGenericHeadline: "ברוכים הבאים ל־mingle",
      signupGenericSub: "בלי כרטיס אשראי. בחרו איך אתם מצטרפים.",
      talentEyebrow: "ממשיכים כטאלנט",
      talentHeadline: "ברוכים הבאים ל־mingle",
      talentSub: "התאמה לתפקידים שמתאימים לכם — בחינם לטאלנט.",
      companyEyebrow: "ממשיכים כחברה",
      companyHeadline: "ברוכים הבאים ל־mingle",
      companySub: "רואים את האנשים ששווה לדבר איתם — עם סיבות ברורות.",
      email: "אימייל",
      password: "סיסמה",
      continue: "המשך",
      signIn: "התחברות",
      creating: "יוצרים חשבון…",
      signingIn: "מתחברים…",
      or: "או",
      continueGoogle: "המשך עם Google",
      forgotPassword: "שכחתי סיסמה",
      sending: "שולחים…",
      resetSent: "אם האימייל קיים ב־mingle, שלחנו קישור לאיפוס.",
      choosePath: "בחרו טאלנט או חברה כדי ליצור חשבון.",
      choosePathContinue: "בחרו טאלנט או חברה כדי להמשיך.",
      confirmTalent: "אישור טאלנט",
      confirmCompany: "אישור חברה",
      switchToCompany: "מעבר לחברה",
      switchToTalent: "מעבר לטאלנט",
      segmentTalent: "טאלנט",
      segmentCompany: "חברה",
      checkEmailTitle: "בדקו את האימייל",
      checkEmailBody:
        "שלחנו קישור אישור לתיבה שלכם. אשרו את האימייל ואז חזרו להמשיך.",
      haveAccount: "כבר יש חשבון? התחברות",
      needAccount: "חדשים כאן? יצירת חשבון",
      alreadyAccount: "לאימייל הזה כבר יש חשבון. התחברו במקום.",
      emailExists: "לאימייל הזה כבר יש חשבון. התחברו במקום.",
    },
    shell: {
      settings: "הגדרות",
      help: "עזרה",
      search: "חיפוש",
      searchCandidates: "חיפוש מועמדים או תפקידים",
      searchCompanies: "חיפוש חברות",
      recruiter: "מגייסים",
      talent: "טאלנט",
      discover: "גילוי",
      conversations: "שיחות",
      connections: "קשרים",
      board: "לוח",
      roles: "תפקידים",
      team: "צוות",
    },
    settings: {
      title: "הגדרות",
      search: "חיפוש בהגדרות",
      noMatch: "אין הגדרות שתואמות לחיפוש.",
      account: "חשבון",
      signedInAs: "מחוברים כ־",
      path: "מסלול",
      editProfile: "עריכת פרופיל",
      editProfileBody: "עדכון הפרופיל שחברות וטאלנט רואים.",
      openProfile: "פתיחת פרופיל",
      security: "אבטחה",
      password: "סיסמה",
      passwordBody: "שינוי הסיסמה לחשבון הזה.",
      notifications: "התראות",
      emailAlerts: "התראות במייל",
      emailAlertsBody:
        "בקרוב — כרגע מיילי קשר ושיחה פעילים לכולם.",
      privacy: "פרטיות",
      visibility: "נראות פרופיל",
      visibilityTalent:
        "בקרוב — כרגע הפרופיל שלכם גלוי לחברות ב־mingle. מתג השהיה יגיע לכאן.",
      visibilityCompany:
        "בקרוב — כרגע פרופיל החברה גלוי לטאלנט ב־mingle.",
      support: "תמיכה",
      reportProblem: "דיווח על בעיה",
      reportProblemBody: "משהו נשבר או נראה לא נכון? שלחו לנו הודעה מהאפליקציה.",
      openSupport: "פתיחת תמיכה",
      language: "שפה",
      languageBody: "מעבר בין אנגלית לעברית באפליקציה.",
      danger: "אזור מסוכן",
      deleteAccount: "מחיקת חשבון",
      deleteAccountBody:
        "תזמון מחיקה סופית. יש לכם 14 יום להתחבר מחדש ולשמור על הפרופיל.",
      deleteAccountCta: "מחיקת חשבון",
      deleteTitle: "למחוק את חשבון mingle?",
      deleteWarn:
        "כל הפרטים יימחקו לצמיתות בתוך 14 הימים הקרובים. אם מחקתם בטעות — או התחרטתם — פשוט התחברו שוב בתוך 14 הימים ונשחזר את החשבון מאותה נקודה, עם הפרופיל הקיים. אחרי 14 יום הקישור ל־Gmail/Google והנתונים יוסרו.",
      deleteConfirm: "כן, לתזמן מחיקה",
      deleteCancel: "להשאיר את החשבון",
      deleteWorking: "מתזמנים…",
      restored:
        "ברוכים השבים — ביטלנו את מחיקת החשבון. ממשיכים עם הפרופיל הקיים.",
    },
    onboarding: {
      continue: "המשך",
      skip: "דלג בינתיים",
      back: "חזרה",
      done: "הכול מוכן",
      talentEyebrow: "הפרופיל שלכם",
      talentHeadline: "בואו נכיר אתכם",
      talentSub: "שני סיגנלים חדים — אפשר לדלג על מה שיכול לחכות.",
      companyEyebrow: "פרופיל חברה",
      companyHeadline: "בואו נמצא את האנשים הנכונים",
      companySub: "שני סיגנלים שמזינים באמת את ההתאמה — דלגו על מה שיכול לחכות.",
    },
  },
};

export function messagesFor(locale: AppLocale): AppMessages {
  return APP_MESSAGES[locale];
}
