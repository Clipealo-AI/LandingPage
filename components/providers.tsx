"use client"

import * as React from "react"
import { ThemeProvider } from "next-themes"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { InteractionFeedback } from "@/components/shared/interaction-feedback"

export function Providers({ children }: { children: React.ReactNode }) {
  /**
   * Marca de hidratación.
   *
   * Hasta que React no hidrata, los controles pintados en el servidor parecen
   * interactivos pero no responden. El atributo permite a los tests esperar el
   * momento real —no un `waitForTimeout` a ojo— y deja un enganche de CSS para
   * lo que solo deba mostrarse cuando la página ya responde.
   */
  React.useEffect(() => {
    document.documentElement.dataset.hydrated = "true"
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="clipealo-theme"
    >
      {/* Claro es el tema inicial; el usuario puede elegir modo oscuro o seguir
          la preferencia del sistema. */}
      <TooltipProvider delayDuration={200} skipDelayDuration={400}>
        {children}
        <Toaster position="bottom-right" closeButton richColors={false} />
        <InteractionFeedback />
      </TooltipProvider>
    </ThemeProvider>
  )
}
