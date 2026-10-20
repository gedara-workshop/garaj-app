// localStorage comes from expo-sqlite; installing it here too means this file can load first.
import "expo-sqlite/localStorage/install";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { en, type StringKey } from "./en";
import { si } from "./si";

// Small in-house translation layer: English is the source, Sinhala is written natively for each
// key (not word for word). Tamil plugs in here as another dictionary once its font is loaded.

export type Lang = "en" | "si";
export const languages: { lang: Lang; label: string }[] = [
  { lang: "en", label: "English" },
  { lang: "si", label: "සිංහල" },
];

const dictionaries: Record<Lang, Record<StringKey, string>> = { en, si };
const KEY = "garaj.language";

function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "si" ? "si" : "en";
  } catch {
    return "en";
  }
}

// Kept at module level too, so code outside React (dates, reminder notifications) can translate.
let current: Lang = loadLang();
export const currentLang = () => current;

type Vars = Record<string, string | number>;

/** t("home.overdue", { n: 2 }): fills {n}. Keys ending in _one/_other are picked by count with tn(). */
export function translate(key: StringKey, vars?: Vars, lang: Lang = current) {
  const text = dictionaries[lang][key] ?? en[key];
  return vars ? text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? "")) : text;
}

type PluralBase<K> = K extends `${infer B}_one` ? B : never;
export type PluralKey = PluralBase<StringKey>;

export function translatePlural(key: PluralKey, n: number, vars?: Vars, lang: Lang = current) {
  return translate(`${key}_${Math.abs(n) === 1 ? "one" : "other"}` as StringKey, { n, ...vars }, lang);
}

type I18n = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey, vars?: Vars) => string;
  tn: (key: PluralKey, n: number, vars?: Vars) => string;
};

const I18nContext = createContext<I18n | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);

  const setLang = useCallback((next: Lang) => {
    current = next;
    setLangState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Falls back to English next launch.
    }
  }, []);

  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(key, vars, lang),
      tn: (key, n, vars) => translatePlural(key, n, vars, lang),
    }),
    [lang, setLang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx;
}
