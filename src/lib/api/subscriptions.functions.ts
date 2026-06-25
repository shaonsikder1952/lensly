import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  saveSubscriptionServer,
  getSubscriptionsServer,
  updateSubscriptionStatusServer,
} from "../subscriptions.server";

export const saveSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
      fullName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      birthDate: z.string().min(1),
      birthPlace: z.string().min(1),
      profession: z.string().min(1),
      paymentMethod: z.enum(["sepa", "wallet"]),
      maskedIban: z.string().optional(),
      signatureType: z.enum(["draw", "type"]),
      signatureData: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const saved = await saveSubscriptionServer({
      contract_id: data.contractId,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      birth_date: data.birthDate,
      birth_place: data.birthPlace,
      profession: data.profession,
      payment_method: data.paymentMethod,
      masked_iban: data.maskedIban,
      signature_type: data.signatureType,
      signature_data: data.signatureData,
    });
    return {
      contractId: saved.contract_id,
      fullName: saved.full_name,
      email: saved.email,
      phone: saved.phone,
      birthDate: saved.birth_date,
      birthPlace: saved.birth_place,
      profession: saved.profession,
      paymentMethod: saved.payment_method,
      maskedIban: saved.masked_iban,
      signatureType: saved.signature_type,
      signatureData: saved.signature_data,
      status: saved.status,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
  });

export const getSubscriptions = createServerFn({ method: "GET" }).handler(async () => {
  const list = await getSubscriptionsServer();
  return list.map((item) => ({
    id: item.id,
    contractId: item.contract_id,
    fullName: item.full_name,
    email: item.email,
    phone: item.phone,
    birthDate: item.birth_date,
    birthPlace: item.birth_place,
    profession: item.profession,
    paymentMethod: item.payment_method,
    maskedIban: item.masked_iban,
    signatureType: item.signature_type,
    signatureData: item.signature_data,
    status: item.status,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
});

export const updateSubscriptionStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      contractId: z.string().min(1),
      email: z.string().email(),
      status: z.enum(["active", "cancelled", "withdrawn"]),
    }),
  )
  .handler(async ({ data }) => {
    return await updateSubscriptionStatusServer(data.contractId, data.email, data.status);
  });
