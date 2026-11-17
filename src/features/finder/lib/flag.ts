/** The experimental finder is on unless NEXT_PUBLIC_ENABLE_FINDER=false (inlined at build time). */
export const finderEnabled = process.env.NEXT_PUBLIC_ENABLE_FINDER !== "false"
