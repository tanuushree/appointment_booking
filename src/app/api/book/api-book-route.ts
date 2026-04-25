// app/api/book/route.ts
// POST /api/book
// Creates a confirmed appointment and triggers WhatsApp notification.
//
// ── Database schema (PostgreSQL) ──────────────────────────────────────────────
//
//   CREATE TABLE bookings (
//     id           SERIAL PRIMARY KEY,
//     booking_ref  TEXT UNIQUE NOT NULL,           -- e.g. CLN-20250428-4821
//     patient_name TEXT NOT NULL,
//     patient_age  INT,
//     patient_address TEXT,
//     ailment      TEXT,
//     phone        TEXT,
//     slot_id      TEXT REFERENCES slots(id),
//     slot_label   TEXT,                           -- human-readable slot string
//     status       TEXT DEFAULT 'confirmed',        -- confirmed | cancelled | completed
//     created_at   TIMESTAMPTZ DEFAULT NOW()
//   );
//
// ── WhatsApp integration ──────────────────────────────────────────────────────
//   After saving the booking, call the Meta WhatsApp Cloud API to send a
//   confirmation message. See sendWhatsAppConfirmation() below.
//
// ── Slot locking ─────────────────────────────────────────────────────────────
//   Use an atomic UPDATE ... WHERE is_booked = false ... RETURNING id to
//   prevent double-bookings (see lockSlot() below).
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { format } from "date-fns";

interface BookingRequestBody {
  name: string;
  age: string;
  address: string;
  ailment: string;
  phone?: string;
  slotId: string;
  slotLabel: string;
}

// ── Slot locking (replace mock with real DB) ──────────────────────────────────
async function lockSlot(slotId: string): Promise<boolean> {
  // TODO: replace with atomic DB update
  // const result = await db.query(
  //   `UPDATE slots SET is_booked = true WHERE id = $1 AND is_booked = false RETURNING id`,
  //   [slotId]
  // );
  // return result.rows.length > 0;
  return true; // mock: always succeeds
}

// ── WhatsApp notification (replace with real Meta API call) ───────────────────
async function sendWhatsAppConfirmation(params: {
  phone: string;
  name: string;
  bookingRef: string;
  slotLabel: string;
  ailment: string;
}): Promise<void> {
  // TODO: uncomment and fill in your credentials
  //
  // const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID!;
  // const WA_TOKEN = process.env.WA_SYSTEM_USER_TOKEN!;
  //
  // const message =
  // `✅ *Booking Confirmed — Sinha Care Clinic*\n\n` +
  // `📋 Ref: *${params.bookingRef}*\n` +
  // `👤 Patient: ${params.name}\n` +
  // `📅 Slot: ${params.slotLabel}\n` +
  // `🩺 Concern: ${params.ailment}\n\n` +
  // `📍 123 Park Street, Kolkata\n` +
  // `Please arrive 10 minutes early.\n\n` +
  // `To cancel: reply CANCEL ${params.bookingRef}`;
  //
  // await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${WA_TOKEN}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     messaging_product: "whatsapp",
  //     to: `91${params.phone}`,
  //     type: "text",
  //     text: { body: message },
  //   }),
  // });

  console.log(`[WhatsApp] Would send confirmation to +91${params.phone} for booking ${params.bookingRef}`);
}

// ── Booking reference generator ───────────────────────────────────────────────
function generateRef(): string {
  const datePart = format(new Date(), "yyyyMMdd");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CLN-${datePart}-${rand}`;
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body: BookingRequestBody = await request.json();
    const { name, age, address, ailment, phone, slotId, slotLabel } = body;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!name || !age || !address || !ailment || !slotId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ── Try to lock the slot (prevents double bookings) ───────────────────────
    const locked = await lockSlot(slotId);
    if (!locked) {
      return NextResponse.json(
        { success: false, error: "This slot was just taken. Please choose another time." },
        { status: 409 }
      );
    }

    // ── Generate booking reference ────────────────────────────────────────────
    const bookingRef = generateRef();

    // ── Save to database (replace with real DB insert) ────────────────────────
    // await db.query(
    //   `INSERT INTO bookings
    //     (booking_ref, patient_name, patient_age, patient_address, ailment, phone, slot_id, slot_label)
    //    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    //   [bookingRef, name, Number(age), address, ailment, phone ?? null, slotId, slotLabel]
    // );
    console.log(`[DB] Booking saved: ${bookingRef}`, { name, age, ailment, slotLabel });

    // ── Send WhatsApp confirmation (if phone provided) ────────────────────────
    if (phone) {
      await sendWhatsAppConfirmation({ phone, name, bookingRef, slotLabel, ailment });
    }

    // ── Respond to client ─────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      bookingRef,
      message: "Appointment confirmed. Check your WhatsApp for the confirmation.",
      data: {
        bookingRef,
        name,
        slotLabel,
        ailment,
        phone: phone ?? null,
      },
    });

  } catch (error) {
    console.error("[POST /api/book]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
