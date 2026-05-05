export function getWelcomeSuggestionButtonClass(index: number): string {
  return `welcome-card welcome-suggestion-pill group relative flex items-center gap-2 sm:gap-3 md:gap-3 xl:gap-3.5 2xl:gap-3.5 rounded-xl border px-3 py-2 sm:px-4 sm:py-3 text-left cursor-pointer transition-all duration-300 overflow-hidden${
    index >= 2 ? " hidden sm:flex" : ""
  }`;
}
