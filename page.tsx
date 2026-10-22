// app/card/[cardId]/page.tsx
// Public page (Server Component): ไม่มี auth / middleware ใดๆ ครอบ route นี้
// ถ้า middleware.ts ของคุณป้องกันทั้งเว็บ ให้ยกเว้น path "/card/:path*"
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CardViewer, { type CardData } from "./CardViewer";

// ───────── แก้ตรงนี้ให้ดึงจากฐานข้อมูลของคุณ (Prisma / Supabase / Firebase / REST) ─────────
// ตัวอย่าง Prisma:
//   const c = await prisma.card.findUnique({ where: { id } });
// ตัวอย่าง Supabase (ต้องเปิด RLS policy ให้ select ได้แบบ public เฉพาะ cards):
//   const { data } = await supabase.from("cards").select("*").eq("id", id).single();
async function getCard(id: string): Promise<CardData | null> {
  const c: any = null; // ← แทนที่ด้วยผลลัพธ์จากฐานข้อมูล
  if (!c) return null;
  return {
    id: c.id,
    category: c.category ?? "love",   // love | congrat | thanks | sorry | birthday | anniv | cheer | miss
    images: c.images ?? [],           // string[] URL ของรูป
    videoUrl: c.videoUrl ?? null,
    message: c.message ?? "",
    musicUrl: c.musicUrl ?? null,
  };
}

export const dynamic = "force-dynamic"; // ให้เห็นข้อมูลล่าสุดเสมอ

type Props = { params: Promise<{ cardId: string }> }; // Next 14: ใช้ { params: { cardId: string } } แล้วไม่ต้อง await

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await params;
  return { title: "มีบางอย่างส่งถึงคุณ", robots: { index: false, follow: false } };
}

export default async function CardPage({ params }: Props) {
  const { cardId } = await params;
  const card = await getCard(cardId);
  if (!card) notFound();
  return <CardViewer card={card} />;
}
