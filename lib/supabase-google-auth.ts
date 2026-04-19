import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { isSupabaseConfigured, supabase } from "./supabase";

if (typeof window !== "undefined") {
  WebBrowser.maybeCompleteAuthSession();
}

type GoogleAuthSuccess = {
  ok: true;
};

type GoogleAuthFailure = {
  ok: false;
  message: string;
};

type GoogleAuthResult = GoogleAuthSuccess | GoogleAuthFailure;

function getParamFromUrl(url: string, key: string) {
  const hashPart = url.split("#")[1] ?? "";
  const queryPart = url.split("?")[1]?.split("#")[0] ?? "";

  const hashParams = new URLSearchParams(hashPart);
  const queryParams = new URLSearchParams(queryPart);

  return hashParams.get(key) ?? queryParams.get(key);
}

export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message:
        "Falta configurar Supabase. Agrega EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const redirectTo = makeRedirectUri({
    scheme: "barberia",
    path: "auth/callback",
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: "openid profile email",
      queryParams: {
        prompt: "consent",
      },
    },
  });

  if (error || !data?.url) {
    return {
      ok: false,
      message: error?.message ?? "No se pudo iniciar autenticacion con Google.",
    };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success") {
    return {
      ok: false,
      message: "Inicio con Google cancelado.",
    };
  }

  const callbackUrl = result.url;
  const callbackError =
    getParamFromUrl(callbackUrl, "error_description") ??
    getParamFromUrl(callbackUrl, "error");

  if (callbackError) {
    return {
      ok: false,
      message: callbackError,
    };
  }

  const accessToken = getParamFromUrl(callbackUrl, "access_token");
  const refreshToken = getParamFromUrl(callbackUrl, "refresh_token");

  if (!accessToken || !refreshToken) {
    return {
      ok: false,
      message:
        "No recibimos los tokens de Google. Revisa Redirect URLs en Supabase.",
    };
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    return {
      ok: false,
      message: sessionError.message,
    };
  }

  return { ok: true };
}
