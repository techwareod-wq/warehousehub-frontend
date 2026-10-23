/**
 * Clerk's widgets (sign-in / sign-up pages, the sign-in modal, the user
 * menu) in the site's liquid glass. Passed per component on the public site
 * only; the admin's Clerk widgets keep Clerk's defaults. Both the current
 * and the legacy variable names are set (Clerk renamed several).
 */
export const glassClerkAppearance = {
  variables: {
    colorPrimary: "#3b82f6",
    colorPrimaryForeground: "#ffffff",
    colorBackground: "#131d31",
    colorForeground: "#ffffff",
    colorText: "#ffffff",
    colorMutedForeground: "rgb(255 255 255 / 70%)",
    colorTextSecondary: "rgb(255 255 255 / 70%)",
    colorMuted: "rgb(255 255 255 / 6%)",
    colorInput: "rgb(255 255 255 / 6%)",
    colorInputBackground: "rgb(255 255 255 / 6%)",
    colorInputForeground: "#ffffff",
    colorInputText: "#ffffff",
    colorNeutral: "#ffffff",
    colorBorder: "rgb(255 255 255 / 14%)",
    colorRing: "#3b82f6",
    colorShadow: "rgb(0 0 0 / 35%)",
    colorModalBackdrop: "rgb(0 0 0 / 50%)",
    borderRadius: "14px",
  },
  elements: {
    cardBox: { borderRadius: "24px", border: "1px solid rgb(255 255 255 / 14%)", boxShadow: "inset 0 1px 0 rgb(255 255 255 / 18%), 0 12px 40px rgb(0 0 0 / 35%)" },
    card: { backgroundColor: "rgb(19 29 49 / 88%)", backdropFilter: "blur(28px) saturate(160%)" },
    footer: { background: "rgb(255 255 255 / 4%)" },
    formButtonPrimary: { color: "#ffffff", fontWeight: 600 },
    socialButtonsBlockButton: { backgroundColor: "rgb(255 255 255 / 6%)", border: "1px solid rgb(255 255 255 / 14%)" },
  },
}
