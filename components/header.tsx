import { ModeSwitcher } from "@/components/mode-switcher";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  return (
    <header className="absolute top-0 right-0 flex justify-end items-center gap-2 p-4">
      <LanguageSwitcher />
      <ModeSwitcher />
    </header>
  );
}