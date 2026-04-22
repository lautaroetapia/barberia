import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type DbJoinRequest = {
  id: string;
  barbershop_id: string;
  status: "pending" | "approved" | "rejected";
};

type DbInvitation = {
  id: string;
  barbershop_id: string;
  expires_at: string;
  status: "pending" | "expired";
};

export const getCurrentUserPendingJoinRequestShopIds = async () => {
  if (!isSupabaseConfigured) {
    return [] as string[];
  }

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user?.id) {
    return [] as string[];
  }

  const { data, error } = await supabase
    .from("join_requests")
    .select("barbershop_id, status")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .returns<Array<{ barbershop_id: string; status: "pending" }>>();

  if (error || !data) {
    return [] as string[];
  }

  return data.map((item) => item.barbershop_id);
};

export const submitJoinRequestForShop = async (barbershopId: string) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase no está configurado en esta app.");
  }

  const normalizedShopId = barbershopId.trim();
  if (!normalizedShopId) {
    throw new Error("No se encontró la barbería para enviar la solicitud.");
  }

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user?.id) {
    throw new Error("Debes iniciar sesión para enviar la solicitud.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("join_requests")
    .select("id, barbershop_id, status")
    .eq("user_id", user.id)
    .eq("barbershop_id", normalizedShopId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<DbJoinRequest>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.status === "pending") {
    return {
      created: false,
      alreadyPending: true,
      barbershopId: normalizedShopId,
    };
  }

  if (existing?.status === "approved") {
    return {
      created: false,
      alreadyPending: false,
      alreadyApproved: true,
      barbershopId: normalizedShopId,
    };
  }

  const { error: insertError } = await supabase.from("join_requests").insert({
    user_id: user.id,
    barbershop_id: normalizedShopId,
    status: "pending",
  });

  if (!insertError) {
    return {
      created: true,
      alreadyPending: false,
      barbershopId: normalizedShopId,
    };
  }

  const duplicateDetected =
    /duplicate key|unique constraint|already exists/i.test(insertError.message);

  if (duplicateDetected && existing?.id) {
    const { error: updateError } = await supabase
      .from("join_requests")
      .update({ status: "pending" })
      .eq("id", existing.id)
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return {
      created: true,
      alreadyPending: false,
      barbershopId: normalizedShopId,
    };
  }

  throw new Error(insertError.message);
};

export const submitJoinRequestByInvitationCode = async (rawCode: string) => {
  const manualCode = rawCode.trim().toUpperCase();

  if (!manualCode) {
    throw new Error("Ingresa un código de invitación.");
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("barber_invitations")
    .select("id, barbershop_id, expires_at, status")
    .eq("manual_code", manualCode)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<DbInvitation>();

  if (invitationError) {
    throw new Error(invitationError.message);
  }

  if (!invitation?.barbershop_id) {
    throw new Error("Código inválido o vencido.");
  }

  return submitJoinRequestForShop(invitation.barbershop_id);
};
