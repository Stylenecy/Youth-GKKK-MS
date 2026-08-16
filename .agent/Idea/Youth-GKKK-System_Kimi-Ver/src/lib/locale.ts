import { id, enUS } from "date-fns/locale";

export function getLocale(lang: string) {
  return lang === "id" ? id : enUS;
}
