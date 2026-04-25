// app/api/slots/route.ts
// GET /api/slots
// Returns available appointment slots for the next 6 days.
//
// ── Replace the mock data below with real DB queries ──────────────────────────
// Suggested DB schema (PostgreSQL):
//
//   CREATE TABLE doctors (
//     id SERIAL PRIMARY KEY,
//     name TEXT NOT NULL,
//     specialty TEXT
//   );
//
//   CREATE TABLE slots (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     doctor_id INT REFERENCES doctors(id),
//     slot_datetime TIMESTAMPTZ NOT NULL,
//     duration_minutes INT DEFAULT 20,
//     is_booked BOOLEAN DEFAULT false
//   );
//
// Query example (replace mock below):
//   const rows = await db.query(`
//     SELECT id, slot_datetime, is_booked
//     FROM slots
//     WHERE slot_datetime >= NOW()
//       AND slot_datetime <= NOW() + INTERVAL '7 days'
//       AND doctor_id = $1
//     ORDER BY slot_datetime
//   `, [doctorId]);
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { addDays, format, setHours, setMinutes } from "date-fns";

interface Slot {
  id: string;
  time: string;
  available: boolean;
}

interface DaySlots {
  date: string;   // "YYYY-MM-DD"
  label: string;  // "Mon, Apr 28"
  slots: Slot[];
}

// Slot times your clinic offers
const SLOT_TIMES = [
  { h: 9,  m: 0  },
  { h: 9,  m: 20 },
  { h: 9,  m: 40 },
  { h: 10, m: 0  },
  { h: 10, m: 20 },
  { h: 10, m: 40 },
  { h: 11, m: 0  },
  { h: 11, m: 20 },
  { h: 12, m: 0  },
  { h: 12, m: 20 },
  { h: 14, m: 0  },
  { h: 14, m: 20 },
  { h: 14, m: 40 },
  { h: 15, m: 0  },
  { h: 15, m: 20 },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const _doctorId = searchParams.get("doctorId") ?? "1"; // for future multi-doctor support

    // ── TODO: Replace with DB query using _doctorId ──────────────────────────
    // const slots = await db.query(
    //   `SELECT * FROM slots WHERE doctor_id = $1 AND slot_datetime > NOW() AND is_booked = false ORDER BY slot_datetime`,
    //   [_doctorId]
    // );
    // ─────────────────────────────────────────────────────────────────────────

    const today = new Date();
    const days: DaySlots[] = [];

    for (let i = 1; i <= 7; i++) {
      const date = addDays(today, i);
      if (date.getDay() === 0) continue; // skip Sundays

      const dateStr = format(date, "yyyy-MM-dd");
      const label = format(date, "EEE, MMM d");

      const slots: Slot[] = SLOT_TIMES.map(({ h, m }, idx) => {
        const dt = setMinutes(setHours(new Date(date), h), m);
        return {
          id: `${dateStr}-${idx}`,
          time: format(dt, "hh:mm aa"),
          // TODO: replace with actual DB availability check
          available: Math.random() > 0.3,
        };
      });

      days.push({ date: dateStr, label, slots });
    }

    return NextResponse.json({
      success: true,
      data: days,
    });

  } catch (error) {
    console.error("[GET /api/slots]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch slots" }, { status: 500 });
  }
}
