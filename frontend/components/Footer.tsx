import { FaHeart, FaGithub, FaLinkedin } from "react-icons/fa";

interface FooterProps {
  isDark: boolean;
}

export function Footer({ isDark }: FooterProps) {
  return (
    <footer
      className={`
        hidden
        sm:flex
        absolute bottom-3 left-3 z-50
         flex-wrap items-center gap-2
        max-w-[calc(100vw-24px)]
        px-3 py-2 rounded-lg
        text-xs sm:text-sm
        backdrop-blur-md border
        ${
          isDark
            ? "bg-white/5 border-white/10 text-gray-300"
            : "bg-white/70 border-black/10 text-gray-700"
        }
      `}
    >
      <span className="flex items-center gap-1 whitespace-nowrap">
        Made with
        <FaHeart className="text-red-500" />
        by
        <span className="font-semibold">Abood</span>
      </span>

      <div className="flex items-center gap-2">
        <a
          href="https://github.com/julyperfect07"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="transition-transform hover:scale-110"
        >
          <FaGithub size={18} />
        </a>

        <a
          href="https://www.linkedin.com/in/abdallah-yousef-3143b2288/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="transition-transform hover:scale-110"
        >
          <FaLinkedin size={18} />
        </a>
      </div>
    </footer>
  );
}
