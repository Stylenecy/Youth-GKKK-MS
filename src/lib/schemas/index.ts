import { z } from "zod";

export const eventSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  // Optional: falls back to the ministry's fixed 17:00 WIB slot.
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format jam harus HH:MM")
    .optional()
    .or(z.literal("")),
  weeklyTheme: z.string().min(3, "Tema minimal 3 karakter"),
  eventType: z.enum(["worship", "cross", "talkshow", "movie", "sports", "retreat", "special"]),
  picId: z.string().min(1, "PIC wajib dipilih"),
  speakerName: z.string().min(1, "Nama pembicara wajib diisi"),
  description: z.string().optional(),
});

export const financeSchema = z.object({
  amount: z.coerce.number().positive("Jumlah harus positif"),
  type: z.enum(["income", "expense"]),
  account: z.enum(["kas_besar", "kas_kecil"]),
  category: z.string().min(1, "Kategori wajib dipilih"),
  description: z.string().min(3, "Deskripsi minimal 3 karakter"),
  eventId: z.string().optional(),
});
