import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Marcas de las redes de destino.
 *
 * Los trazos vienen de simple-icons (MIT) y están incrustados a propósito: seis
 * logotipos no justifican una dependencia en tiempo de ejecución, y así el kit
 * sigue siendo autocontenido. LinkedIn se dibujó aparte porque simple-icons lo
 * retiró a petición de la marca.
 *
 * Dos tonos:
 * - `current` (por defecto): silueta de un solo color que hereda currentColor.
 *   Para listados densos y sitios donde seis logotipos a todo color competirían
 *   con el naranja de la marca.
 * - `official`: el logotipo tal como lo publica cada red en su manual. Rojo con
 *   el triángulo blanco en YouTube, degradado en Instagram, «in» blanca sobre
 *   azul en LinkedIn, «f» blanca sobre azul en Facebook y la nota con los
 *   desfases cian y rojo en TikTok. X y el cuerpo de TikTok son negros en su
 *   manual y aquí heredan currentColor: el contenedor decide (negro sobre
 *   blanco, blanco sobre oscuro).
 *
 * Se usan de forma nominativa, para identificar el destino de publicación.
 */
export type SocialIconProps = React.ComponentProps<"svg"> & {
  /** `official` pinta el logotipo a todo color; por defecto hereda currentColor. */
  tone?: "current" | "official"
}

function Marca({
  title,
  className,
  children,
  ...props
}: React.ComponentProps<"svg"> & { title: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={cn("size-5 shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  )
}

/** `useId` devuelve separadores que rompen `url(#…)`; se dejan solo letras y cifras. */
function useSvgId(prefijo: string) {
  return `${prefijo}-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
}

const TIKTOK =
  "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"

export function TikTokIcon({ tone = "current", ...props }: SocialIconProps) {
  if (tone !== "official") {
    return (
      <Marca title="TikTok" {...props}>
        <path d={TIKTOK} fill="currentColor" />
      </Marca>
    )
  }
  // La nota se encoge un poco para que los dos desfases quepan en la caja.
  return (
    <Marca title="TikTok" {...props}>
      <g transform="translate(1.2 1.2) scale(0.9)">
        <path d={TIKTOK} fill="#25F4EE" transform="translate(-0.9 -0.9)" />
        <path d={TIKTOK} fill="#FE2C55" transform="translate(0.9 0.9)" />
        <path d={TIKTOK} fill="currentColor" />
      </g>
    </Marca>
  )
}

const INSTAGRAM =
  "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"

export function InstagramIcon({ tone = "current", ...props }: SocialIconProps) {
  const id = useSvgId("ig")
  if (tone !== "official") {
    return (
      <Marca title="Instagram" {...props}>
        <path d={INSTAGRAM} fill="currentColor" />
      </Marca>
    )
  }
  // Degradado del glifo de 2016: amarillo abajo a la izquierda, magenta en el
  // centro y violeta arriba a la derecha.
  return (
    <Marca title="Instagram" {...props}>
      <defs>
        <radialGradient id={id} cx="0.3" cy="1.07" r="1.3">
          <stop offset="0" stopColor="#FDF497" />
          <stop offset="0.05" stopColor="#FDF497" />
          <stop offset="0.45" stopColor="#FD5949" />
          <stop offset="0.6" stopColor="#D6249F" />
          <stop offset="0.9" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <path d={INSTAGRAM} fill={`url(#${id})`} />
    </Marca>
  )
}

const YOUTUBE_CUERPO =
  "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
const YOUTUBE_TRIANGULO = "M9.545 15.568V8.432L15.818 12l-6.273 3.568z"

export function YouTubeIcon({ tone = "current", ...props }: SocialIconProps) {
  if (tone !== "official") {
    return (
      <Marca title="YouTube" {...props}>
        <path
          d={`${YOUTUBE_CUERPO}${YOUTUBE_TRIANGULO}`}
          fill="currentColor"
          fillRule="evenodd"
        />
      </Marca>
    )
  }
  return (
    <Marca title="YouTube" {...props}>
      <path d={YOUTUBE_CUERPO} fill="#FF0000" />
      <path d={YOUTUBE_TRIANGULO} fill="#FFFFFF" />
    </Marca>
  )
}

const X =
  "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"

/** El logotipo de X es negro sobre claro y blanco sobre oscuro: los dos tonos heredan. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- `tone` se extrae para no llegar al <svg>
export function XIcon({ tone, ...props }: SocialIconProps) {
  return (
    <Marca title="X" {...props}>
      <path d={X} fill="currentColor" />
    </Marca>
  )
}

/** Cuadrado con las letras vaciadas: sobre un fondo blanco las letras salen blancas. */
const LINKEDIN =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"

export function LinkedInIcon({ tone = "current", ...props }: SocialIconProps) {
  return (
    <Marca title="LinkedIn" {...props}>
      {tone === "official" && <rect width="24" height="24" rx="1.75" fill="#FFFFFF" />}
      <path d={LINKEDIN} fill={tone === "official" ? "#0A66C2" : "currentColor"} />
    </Marca>
  )
}

/** Círculo con la «f» vaciada hasta el borde: sobre blanco, la «f» sale blanca. */
const FACEBOOK =
  "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"

export function FacebookIcon({ tone = "current", ...props }: SocialIconProps) {
  return (
    <Marca title="Facebook" {...props}>
      {tone === "official" && <circle cx="12" cy="12" r="12" fill="#FFFFFF" />}
      <path d={FACEBOOK} fill={tone === "official" ? "#0866FF" : "currentColor"} />
    </Marca>
  )
}

/*
 * Plataformas de directo. No son destinos de publicación (no están en
 * `lib/social.ts`): son de donde viene el video, y el perfil las usa para saber
 * dónde transmite el creador.
 */

/** Globo con los ojos vaciados: sobre blanco, los ojos salen blancos. */
const TWITCH =
  "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"

export function TwitchIcon({ tone = "current", ...props }: SocialIconProps) {
  return (
    <Marca title="Twitch" {...props}>
      {tone === "official" && (
        <path
          d="M6.857 1.714h13.714v9.429l-3.428 3.428h-3.429l-3 3v-3H6.857z"
          fill="#FFFFFF"
        />
      )}
      <path d={TWITCH} fill={tone === "official" ? "#9146FF" : "currentColor"} />
    </Marca>
  )
}

const KICK =
  "M1.333 0h8v5.333H12V2.667h2.667V0h8v8H20v2.667h-2.667v2.666H20V16h2.667v8h-8v-2.667H12v-2.666H9.333V24h-8Z"

/**
 * La «K» de Kick es verde neón y su manual la pone sobre negro: sobre blanco el
 * verde no se distingue. El tono oficial la pinta dentro de su cuadrado negro,
 * como el icono de la app.
 */
export function KickIcon({ tone = "current", ...props }: SocialIconProps) {
  if (tone !== "official") {
    return (
      <Marca title="Kick" {...props}>
        <path d={KICK} fill="currentColor" />
      </Marca>
    )
  }
  return (
    <Marca title="Kick" {...props}>
      <rect width="24" height="24" rx="5" fill="#0B0E0F" />
      <path d={KICK} fill="#53FC18" transform="translate(5 5) scale(0.5833)" />
    </Marca>
  )
}

/*
 * Proveedores de acceso. No son redes de destino: van en los botones de
 * Botones de acceso a la aplicación.
 */

/** La «G» de cuatro colores de las pautas de marca de Google para el botón de acceso. */
function GoogleIcon({ tone = "official", ...props }: SocialIconProps) {
  if (tone !== "official") {
    return (
      <Marca title="Google" {...props}>
        <path
          fill="currentColor"
          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        />
      </Marca>
    )
  }
  return (
    <Marca title="Google" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Marca>
  )
}

const APPLE =
  "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"

/** La manzana es negra sobre claro y blanca sobre oscuro en su manual: hereda. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- `tone` se extrae para no llegar al <svg>
function AppleIcon({ tone, ...props }: SocialIconProps) {
  return (
    <Marca title="Apple" {...props}>
      <path d={APPLE} fill="currentColor" />
    </Marca>
  )
}
