export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "loop-theme";
export const THEME_ATTRIBUTE = "data-theme";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(!t)t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";document.documentElement.setAttribute("${THEME_ATTRIBUTE}",t)}catch(e){document.documentElement.setAttribute("${THEME_ATTRIBUTE}","light")}})()`;
