/**
 * Hand-curated Hebrew/English aliases for free-text and chip values.
 * Matching still uses exact canonical keys, not embeddings.
 * Canonical keys are English; aliases include the official option labels
 * plus common custom chips people actually type.
 */
export const VALUE_SYNONYMS: Record<string, string[]> = {
  compensation: [
    "compensation",
    "higher compensation",
    "money",
    "salary",
    "pay",
    "wages",
    "paycheck",
    "package",
    "כסף",
    "משכורת",
    "שכר",
    "תשלום",
    "תגמול",
  ],
  growth: [
    "growth",
    "development",
    "career development",
    "career growth",
    "צמיחה",
    "התפתחות",
    "התפתחות מקצועית",
  ],
  learning: [
    "learning",
    "learning opportunities",
    "curiosity",
    "למידה",
    "הזדמנויות ללמידה",
  ],
  flexibility: ["flexibility", "flexible", "גמישות", "גמיש"],
  work_life_balance: [
    "work life balance",
    "balance",
    "איזון",
    "איזון בית עבודה",
  ],
  culture: [
    "company culture",
    "culture",
    "culture fit",
    "תרבות",
    "התאמה תרבותית",
  ],
  leadership: ["leadership", "better leadership", "מנהיגות", "הנהלה"],
  meaningful_work: [
    "meaningful work",
    "purpose",
    "עבודה משמעותית",
    "משמעות",
    "תכלית",
  ],
  impact: ["impact", "השפעה"],
  mission: ["mission", "משימה", "ייעוד"],
  stability: ["stability", "יציבות", "ביטחון תעסוקתי"],
  ownership: [
    "ownership",
    "ownership driven",
    "high ownership",
    "בעלות",
    "אחריות מלאה",
  ],
  mentorship: ["mentorship", "mentorship heavy", "חונכות", "מנטורינג"],
  craft: ["craft", "מקצועיות", "אומנות"],
  team_quality: ["team quality", "איכות צוות", "צוות חזק"],
  title: ["title", "title step up", "תפקיד", "קידום בתפקיד"],
  location: ["location", "מיקום", "מיקום גאוגרפי"],
  autonomy: [
    "autonomy",
    "autonomous",
    "independent",
    "עצמאות",
    "עצמאי",
  ],
  collaboration: [
    "collaboration",
    "collaborative",
    "שיתוף פעולה",
    "שיתופי",
  ],
  fast_paced: ["fast paced", "קצב מהיר"],
  structured: ["structured", "process first", "מובנה", "תהליכים"],
  remote: [
    "remote",
    "remote first",
    "remote first company",
    "remote friendly",
    "מרחוק",
    "עבודה מהבית",
  ],
  hybrid: ["hybrid", "היברידי"],
  office: ["office based", "in person energy", "במשרד", "פרונטלי"],
  async: ["async", "async by default", "אסינכרוני"],
  data_driven: ["data driven", "מבוסס דאטה"],
  quiet_focus: ["quiet focus", "מיקוד שקט"],
  customer_facing: ["customer facing", "מול לקוחות"],
  transparency: ["transparency", "שקיפות"],
  innovation: ["innovation", "experiment first", "חדשנות"],
  integrity: ["integrity", "יושרה"],
  diversity: ["diversity", "inclusion", "גיוון", "הכללה"],
  excellence: ["excellence", "מצוינות"],
  accountability: ["accountability", "אחריותיות"],
  trust: ["trust", "אמון"],
  ambition: ["ambition", "שאפתנות"],
  humility: ["humility", "ענווה"],
  kindness: ["kindness", "אדיבות"],
  creativity: ["creativity", "creative", "יצירתיות"],
  challenge: ["challenge", "new challenges", "אתגר", "אתגרים חדשים"],
  belonging: ["belonging", "שייכות"],
  recognition: ["recognition", "status", "הכרה"],
  potential: ["potential", "פוטנציאל"],
  skills: ["skills", "כישורים"],
  experience: ["experience", "ניסיון"],
  communication: ["communication", "clarity", "תקשורת", "בהירות"],
  reliability: ["reliability", "אמינות"],
  coachability: ["coachability", "יכולת ללמוד"],
  startup: ["startup", "סטארטאפ", "סטארט אפ"],
  scale_up: ["scale up", "high growth", "סקייל אפ"],
  established: ["established company", "established", "חברה מבוססת"],
  enterprise: ["enterprise", "ארגון גדול"],
  agency: ["agency", "סוכנות"],
  nonprofit: ["nonprofit", "מלכ״ר", "עמותה"],
  consultancy: ["consultancy", "ייעוץ"],
  public_sector: ["public sector", "מגזר ציבורי"],
  bootstrapped: ["bootstrapped", "בוטסטראפ"],
  local: ["local company", "חברה מקומית"],
  international: [
    "international company",
    "international work",
    "חברה בינלאומית",
    "עבודה בינלאומית",
  ],
  product: ["product", "product roles", "מוצר"],
  engineering: [
    "engineering roles",
    "technology",
    "פיתוח",
    "הנדסה",
    "טכנולוגיה",
  ],
  design: ["design", "design roles", "עיצוב"],
  data: ["data", "data roles", "דאטה"],
  sales: ["sales", "sales roles", "מכירות"],
  marketing: ["marketing", "marketing roles", "שיווק"],
  operations: ["operations", "operations roles", "תפעול"],
  customer_success: ["customer success", "הצלחת לקוח"],
  finance: ["finance", "כספים", "פיננסים"],
  hr: ["hr", "people ops", "people and culture", "משאבי אנוש"],
  legal: ["legal", "משפטים", "משפטי"],
  support: ["support", "תמיכה"],
  research: ["research", "מחקר"],
  leadership_roles: ["leadership roles", "management", "ניהול"],
  founders: ["founders", "founding team", "מייסדים"],
};

const ALIAS_TO_CANONICAL = new Map<string, string>();

for (const [canonical, synonyms] of Object.entries(VALUE_SYNONYMS)) {
  ALIAS_TO_CANONICAL.set(canonical.toLowerCase(), canonical);
  for (const synonym of synonyms) {
    ALIAS_TO_CANONICAL.set(synonym.toLowerCase(), canonical);
  }
}

export function canonicalize(value: string): string {
  const lower = value.trim().toLowerCase();
  return ALIAS_TO_CANONICAL.get(lower) ?? lower;
}

export function overlapCanonical(a: string[], b: string[]): string[] {
  const bCanon = new Set(b.map(canonicalize));
  const seen = new Set<string>();
  return a.filter((item) => {
    const key = canonicalize(item);
    if (!bCanon.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
