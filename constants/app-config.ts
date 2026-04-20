export const APP_ROLES = {
  CLIENT: "cliente",
  BARBER: "barbero",
  OWNER: "dueno",
} as const;

export type AppRoleValue = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export const APP_ROLE_VALUES: readonly AppRoleValue[] = [
  APP_ROLES.CLIENT,
  APP_ROLES.BARBER,
  APP_ROLES.OWNER,
];

export const ROLE_HOME_ROUTES: Record<AppRoleValue, string> = {
  [APP_ROLES.CLIENT]: "/(tabs)",
  [APP_ROLES.BARBER]: "/barber/barber-my-agenda",
  [APP_ROLES.OWNER]: "/barber/dashboard-owner",
};

export const STORAGE_KEYS = {
  ACTIVE_ROLE: "active_role",
  POST_SIGNUP_WELCOME_EMAIL: "post_signup_welcome_email",
} as const;

export const APPOINTMENT_STATUS = {
  PENDING: "pendiente",
  IN_PROGRESS: "en_progreso",
  COMPLETED: "completado",
  NO_SHOW: "no_asistio",
  FREE: "libre",
} as const;

export const BOOKING_DEFAULTS = {
  SHOP_ID: "shop-1",
  BARBER_PROFILE_IMAGE:
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop",
  BARBER_RATING_SUMMARY: "4.9 · 120 resenas",
  BARBER_SPECIALTIES: ["Fade", "Barba", "Toalla caliente"] as const,
  BARBER_BIO:
    "Perfil detallista, enfocado en estilos modernos y acabados prolijos para cada cliente.",
} as const;

export const SUPABASE_FALLBACK = {
  URL: "https://example.supabase.co",
  ANON_KEY: "public-anon-key",
} as const;