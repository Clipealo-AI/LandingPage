"use client"

import * as React from "react"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { InteractionFeedback } from "@/components/shared/interaction-feedback"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Los jobs de render se consultan por polling; 30 s evita refetch en cada foco
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient()
  // Un unico cliente por pestaña: recrearlo en cada render tira la cache
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

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
    <QueryClientProvider client={queryClient}>
      {/* Claro es el tema del producto: el oscuro existe, pero es una eleccion
          explicita del usuario, no algo que se herede del sistema operativo.
          `enableSystem` mantiene la opcion "Sistema" en el selector. */}
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
        storageKey="clipealo-theme"
      >
        <NuqsAdapter>
          <TooltipProvider delayDuration={200} skipDelayDuration={400}>
            {children}
            <Toaster position="bottom-right" closeButton richColors={false} />
            {/* Sonido y marca de recorte al pulsar lo que lo merece */}
            <InteractionFeedback />
          </TooltipProvider>
        </NuqsAdapter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
