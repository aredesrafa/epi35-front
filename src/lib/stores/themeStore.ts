import { writable } from "svelte/store";
import { browser } from "$app/environment";

type Theme = "light" | "dark";

function createThemeStore() {
  const { subscribe, set: setStore, update } = writable<Theme>("light");

  return {
    subscribe,
    initialize: () => {
      if (!browser) return;

      // Verificar se há tema salvo no localStorage
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setStore(savedTheme);
        document.documentElement.classList.toggle(
          "dark",
          savedTheme === "dark",
        );
        return;
      }

      // Verificar preferência do sistema - IGNORAR, forçar Light Mode por padrão
      // const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      // const theme = prefersDark ? "dark" : "light";
      
      const theme = "light"; // Default explícito
      setStore(theme);
      document.documentElement.classList.toggle("dark", false);
    },
    toggle: () => {
      update((theme) => {
        const newTheme = theme === "light" ? "dark" : "light";
        if (browser) {
          localStorage.setItem("theme", newTheme);
          document.documentElement.classList.toggle(
            "dark",
            newTheme === "dark",
          );
        }
        return newTheme;
      });
    },
    set: (theme: Theme) => {
      if (browser) {
        localStorage.setItem("theme", theme);
        document.documentElement.classList.toggle("dark", theme === "dark");
      }
      setStore(theme);
    },
  };
}

export const themeStore = createThemeStore();
