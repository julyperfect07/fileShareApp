"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Languages, Wifi } from "lucide-react";

interface HeaderProps {
  lang: "en" | "ar";
  setLang: (lang: "en" | "ar") => void;
}

export function Header({ lang, setLang }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
      {/* logo */}
      <div className="flex items-center gap-2">
        <Wifi size={18} className="text-teal-400" />
        <span className="text-teal-400 font-semibold text-sm tracking-wide">
          GoFile Share
        </span>
      </div>

      {/* right side buttons */}
      <div className="flex items-center gap-2">
        {/* language toggle */}
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 text-black/50 hover:text-black hover:bg-black/10"
          title={lang === "en" ? "Switch to Arabic" : "Switch to English"}
        >
          <Languages size={16} />
        </button>

        {/* theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 text-black/50 hover:text-black hover:bg-black/10"
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
      </div>
    </header>
  );
}
