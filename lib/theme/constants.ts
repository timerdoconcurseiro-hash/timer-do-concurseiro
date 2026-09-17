export const THEME_STORAGE_KEY = "tc:theme";
export type ThemePreference = "system" | "light" | "dark";

/**
 * Roda inline no <head>, antes da primeira pintura, para aplicar o tema
 * salvo sem "flash" do tema errado. Precisa ser uma string (script inline),
 * não um módulo importado — por isso fica isolado deste arquivo.
 */
export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;
