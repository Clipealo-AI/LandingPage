import type { Area, Endpoint, Rol } from "@/lib/wiki/tipos"

/** Cómo se llama cada área en la wiki y qué cubre. */
export const AREA_INFO: Record<Area, { titulo: string; descripcion: string }> = {
  acceso: {
    titulo: "Acceso",
    descripcion:
      "Entrar, crear cuenta, recuperar la contraseña y entrar con Google, Apple o TikTok.",
  },
  onboarding: {
    titulo: "Bienvenida",
    descripcion:
      "«Tu primer corte»: las tomas del alta, el exprés por invitación, las micropreguntas y las misiones.",
  },
  proyectos: {
    titulo: "Proyectos y clips",
    descripcion:
      "Subir un video, seguir su proceso, revisar los clips y editarlos en el estudio.",
  },
  operaciones: {
    titulo: "Operaciones",
    descripcion:
      "Recortar, reducir, hacer variantes, preparar la publicación y revisar derechos.",
  },
  publicar: {
    titulo: "Publicar",
    descripcion:
      "Publicar un clip en las cuentas conectadas, con su texto por red y sus plantillas.",
  },
  calendario: {
    titulo: "Calendario",
    descripcion: "Programar, mover y cancelar publicaciones, y atender las que fallaron.",
  },
  analiticas: {
    titulo: "Analíticas",
    descripcion:
      "Vistas, crecimiento y rendimiento por red y por publicación, con el límite del plan.",
  },
  campanas: {
    titulo: "Campañas · clipero",
    descripcion:
      "Encontrar campañas, entrar con código, comprometerse, enviar clips y cobrar por sus vistas.",
  },
  agencias: {
    titulo: "Agencias",
    descripcion:
      "Pedir el perfil de agencia, crear y publicar campañas y revisar lo que envían los cliperos.",
  },
  wallet: {
    titulo: "Wallet",
    descripcion:
      "Lo ganado, lo pendiente y los retiros, con los métodos de pago de cada país.",
  },
  planes: {
    titulo: "Planes y cobro",
    descripcion:
      "Los escalones, qué desbloquea cada uno, los minutos incluidos y la facturación.",
  },
  formacion: {
    titulo: "Formación",
    descripcion:
      "Rutas y clases, el progreso de cada persona y la ruta que se le recomienda.",
  },
  cuenta: {
    titulo: "Cuenta y ajustes",
    descripcion:
      "Perfil, público, redes conectadas, avisos, datos y privacidad, y las preferencias de interfaz.",
  },
  ayuda: {
    titulo: "Ayuda",
    descripcion:
      "Escribirle al equipo, leer sus respuestas y buscar en toda la app con ⌘K.",
  },
  backoffice: {
    titulo: "Backoffice",
    descripcion:
      "Lo que opera el equipo: métricas, usuarios, costes, ingresos, planes, agencias y disputas.",
  },
}

export const ROL_INFO: Record<Rol, string> = {
  visitante: "Visitante",
  clipero: "Clipero",
  agencia: "Agencia",
  admin: "Equipo",
}

export const AUTH_INFO: Record<
  Endpoint["auth"],
  { titulo: string; descripcion: string }
> = {
  publico: { titulo: "Pública", descripcion: "Sin sesión." },
  sesion: {
    titulo: "Con sesión",
    descripcion: "Cualquier cuenta con la sesión iniciada.",
  },
  agencia: {
    titulo: "Agencia",
    descripcion: "Solo cuentas con el perfil de agencia concedido.",
  },
  admin: {
    titulo: "Equipo",
    descripcion: "Solo el equipo de Clipealo, desde el backoffice.",
  },
}

export const PLAN_INFO: Record<"free" | "creator" | "business", string> = {
  free: "Prueba",
  creator: "Creador",
  business: "Negocio",
}
