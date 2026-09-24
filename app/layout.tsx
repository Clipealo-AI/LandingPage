/**
 * El documento (`<html lang>`) lo pinta `app/[locale]/layout.tsx`, que conoce el
 * idioma. Este layout solo existe porque `app/not-found.tsx` lo exige.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
