"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slot {
  id: string;
  time: string;
  available: boolean;
}

interface DaySlots {
  date: string;        // "2025-04-28"
  label: string;       // "Mon, Apr 28"
  slots: Slot[];
}

interface BookingPayload {
  name: string;
  age: string;
  address: string;
  ailment: string;
  slotId: string;
  slotLabel: string;
  phone?: string;
}

interface BookingResponse {
  success: boolean;
  bookingRef: string;
  message: string;
}

// ─── Placeholder API helpers ───────────────────────────────────────────────────
// Replace these with real fetch() calls to your Next.js API routes.

async function fetchAvailableSlots(): Promise<DaySlots[]> {
  // TODO: replace with → const res = await fetch("/api/slots"); return res.json();
  await new Promise((r) => setTimeout(r, 600));
  const today = new Date();
  const days: DaySlots[] = [];
  const timeOptions = [
    "09:00 AM", "09:20 AM", "09:40 AM",
    "10:00 AM", "10:20 AM", "10:40 AM",
    "11:00 AM", "11:20 AM",
    "12:00 PM", "12:20 PM",
    "02:00 PM", "02:20 PM", "02:40 PM",
    "03:00 PM", "03:20 PM",
  ];
  for (let i = 1; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 0) continue; // skip Sundays
    const label = d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
    const date = d.toISOString().split("T")[0];
    const slotCount = 8 + Math.floor(Math.random() * 4);
    const picked = [...timeOptions].sort(() => Math.random() - 0.5).slice(0, slotCount).sort();
    days.push({
      date,
      label,
      slots: picked.map((time, idx) => ({
        id: `${date}-${idx}`,
        time,
        available: Math.random() > 0.25,
      })),
    });
  }
  return days;
}

async function submitBooking(payload: BookingPayload): Promise<BookingResponse> {
  // TODO: replace with →
  // const res = await fetch("/api/book", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
  // return res.json();
  await new Promise((r) => setTimeout(r, 1400));
  const ref = `CLN-${Date.now().toString().slice(-6)}`;
  return { success: true, bookingRef: ref, message: "Booking confirmed. Check your WhatsApp for confirmation." };
}

// ─── Ailment suggestions ───────────────────────────────────────────────────────



const AILMENTS = {
  "Preventive & Basic Care": [
    "Teeth Cleaning (Scaling & Polishing)",
    "Fluoride Treatments",
    "Dental Sealants",
  ],
  "Restorative Treatments": [
    "Single Sitting Root Canal Treatment (RCT)",
    "GIC Restorations (Glass Ionomer Cement Fillings)",
    "Composite Restorations (Aesthetic Fillings)",
    "Inlays and Onlays",
    "Tooth Jewellery",
  ],
  "Cosmetic Dentistry": [
    "Teeth Whitening",
    "Veneers",
    "Bonding",
    "Invisalign",
  ],
  "Surgical Procedures": [
    "Tooth Extraction (Normal & Surgical)",
    "Dental Implants",
    "Apicoectomy (Root-End Surgery)",
    "Scaling & Root Planing (Deep Cleaning)",
    "Orthognathic (Corrective Jaw) Surgery",
  ],
  "Pediatric Dentistry": [
    "Fluoride Varnish",
    "Space Maintainers",
    "Dental Sealants",
    "Pulp Therapy (Pulpotomy/Pulpectomy)",
    "Strip Crowns",
    "Restorations for Children",
  ],
};

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          style={{
            width: s === step ? 28 : 8,
            height: 8,
            borderRadius: 4,
            background: s === step ? "#0f766e" : s < step ? "#5eead4" : "#d1faf5",
            transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ClinicPage() {
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=details, 2=slots, 3=confirm
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
 
const [department, setDepartment] = useState<"dental" | "derma" | "">("");
const [primaryAilment, setPrimaryAilment] = useState<keyof typeof AILMENTS | "">("");
  const [ailment, setAilment] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});


  


  // Slot state
  const [daySlots, setDaySlots] = useState<DaySlots[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedDayLabel, setSelectedDayLabel] = useState<string>("");

  // Confirmation
  const [bookingRef, setBookingRef] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Load slots when moving to step 2
  useEffect(() => {
    if (step === 2 && daySlots.length === 0) {
      setSlotsLoading(true);
      fetchAvailableSlots().then((data) => {
        setDaySlots(data);
        if (data.length > 0) {
          setSelectedDay(data[0].date);
          setSelectedDayLabel(data[0].label);
        }
        setSlotsLoading(false);
      });
    }
  }, [step]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!age.trim() || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120) e.age = "Enter a valid age";
    if (!address.trim()) e.address = "Address is required";
    if (!ailment) e.ailment = "Please select an ailment";
    if (phone && !/^\d{10}$/.test(phone)) e.phone = "Enter a valid 10-digit number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    setStep(2);
  }

  async function handleBook() {
    if (!selectedSlot) return;
    setLoading(true);
    try {
      const res = await submitBooking({
        name, age, address, ailment, phone,
        slotId: selectedSlot.id,
        slotLabel: `${selectedDayLabel} at ${selectedSlot.time}`,
      });
      if (res.success) {
        setBookingRef(res.bookingRef);
        setConfirmed(true);
        setStep(3);
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setShowForm(false);
    setStep(1);
    setName(""); setAge(""); setAddress(""); setAilment(""); setPhone("");
    setErrors({});
    setDaySlots([]); setSelectedDay(null); setSelectedSlot(null);
    setConfirmed(false); setBookingRef("");
  }

  const activeDayData = daySlots.find((d) => d.date === selectedDay);

  // ── Render ──

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #f0fdf8;
          min-height: 100vh;
          color: #0d3330;
        }

        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 40px 20px;
        }

        .hero-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 20%, #ccfbf180 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 80%, #a7f3d040 0%, transparent 60%),
            #f0fdf8;
        }

        .cross-mark {
          position: absolute;
          top: 52px; right: 60px;
          font-size: 48px;
          color: #0f766e;
          opacity: 0.12;
          font-family: 'Fraunces', serif;
          font-weight: 300;
          user-select: none;
        }

        .hero-inner {
          position: relative; z-index: 1;
          text-align: center;
          max-width: 680px;
        }

        .badge {
          display: inline-block;
          background: #ccfbf1;
          color: #0f766e;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 100px;
          margin-bottom: 28px;
          border: 1px solid #99f6e4;
        }

        .clinic-name {
          font-family: 'Fraunces', serif;
          font-weight: 400;
          font-size: clamp(42px, 8vw, 80px);
          line-height: 1.05;
          color: #0d3330;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .clinic-name em {
          font-style: italic;
          color: #0f766e;
        }

        .tagline {
          font-size: 16px;
          color: #2d6a66;
          margin-bottom: 48px;
          font-weight: 300;
          letter-spacing: 0.01em;
        }

        .book-btn {
          background: #0f766e;
          color: white;
          border: none;
          padding: 18px 48px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          border-radius: 100px;
          cursor: pointer;
          letter-spacing: 0.04em;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 24px #0f766e44;
        }
        .book-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px #0f766e55;
        }
        .book-btn:active { transform: translateY(0); }

        .trust-row {
          display: flex; gap: 32px; margin-top: 56px;
          justify-content: center; flex-wrap: wrap;
        }
        .trust-item { text-align: center; }
        .trust-num {
          font-family: 'Fraunces', serif;
          font-size: 28px; font-weight: 400;
          color: #0f766e;
        }
        .trust-label {
          font-size: 12px; color: #2d6a66;
          font-weight: 500; letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* ── Modal overlay ── */
        .overlay {
          position: fixed; inset: 0;
          background: rgba(5, 30, 28, 0.55);
          backdrop-filter: blur(6px);
          z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal {
          background: #fff;
          border-radius: 20px;
          width: 100%; max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 40px;
          position: relative;
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 32px 80px rgba(5, 30, 28, 0.2);
        }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }

        .close-btn {
          position: absolute; top: 16px; right: 20px;
          background: none; border: none;
          font-size: 22px; cursor: pointer;
          color: #9ca3af; line-height: 1;
          padding: 4px 8px; border-radius: 6px;
        }
        .close-btn:hover { background: #f3f4f6; color: #374151; }

        .modal-title {
          font-family: 'Fraunces', serif;
          font-size: 26px; font-weight: 400;
          color: #0d3330; margin-bottom: 4px;
        }
        .modal-subtitle {
          font-size: 13px; color: #6b9e9a;
          margin-bottom: 28px;
        }

        /* ── Form fields ── */
        .field { margin-bottom: 18px; }
        .field label {
          display: block;
          font-size: 12px; font-weight: 600;
          color: #2d6a66; letter-spacing: 0.06em;
          text-transform: uppercase; margin-bottom: 6px;
        }
        .field input, .field select, .field textarea {
          width: 100%;
          border: 1.5px solid #d1faf5;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          color: #0d3330;
          background: #f8fffd;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
        }
        .field input:focus, .field select:focus, .field textarea:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 3px #0f766e18;
          background: #fff;
        }
        .field .err { font-size: 12px; color: #dc2626; margin-top: 4px; }

        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        /* ── Slot picker ── */
        .day-tabs {
          display: flex; gap: 8px; overflow-x: auto;
          padding-bottom: 8px; margin-bottom: 20px;
          scrollbar-width: none;
        }
        .day-tabs::-webkit-scrollbar { display: none; }
        .day-tab {
          flex-shrink: 0;
          padding: 8px 16px;
          border-radius: 100px;
          border: 1.5px solid #d1faf5;
          background: #f8fffd;
          font-size: 13px; font-weight: 500;
          color: #2d6a66; cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .day-tab.active {
          background: #0f766e; color: white;
          border-color: #0f766e;
          box-shadow: 0 2px 12px #0f766e33;
        }
        .day-tab:hover:not(.active) {
          border-color: #0f766e; color: #0f766e;
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
          margin-bottom: 20px;
        }
        .slot-btn {
          padding: 10px 8px;
          border-radius: 10px;
          border: 1.5px solid #d1faf5;
          background: #f8fffd;
          font-size: 13px; font-weight: 500;
          color: #2d6a66; cursor: pointer;
          transition: all 0.18s;
          text-align: center;
        }
        .slot-btn:hover:not(.taken) { border-color: #0f766e; color: #0f766e; background: #f0fdf8; }
        .slot-btn.selected {
          background: #0f766e; color: white;
          border-color: #0f766e;
          box-shadow: 0 2px 10px #0f766e33;
          transform: scale(1.03);
        }
        .slot-btn.taken {
          opacity: 0.38; cursor: not-allowed;
          text-decoration: line-through;
        }

        .selected-notice {
          background: #f0fdf8;
          border: 1.5px solid #5eead4;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 14px;
          color: #0f766e;
          font-weight: 500;
          margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }
        .selected-notice::before { content: "✓"; font-weight: 700; font-size: 16px; }

        /* ── Action buttons ── */
        .action-row {
          display: flex; gap: 12px; justify-content: flex-end;
          margin-top: 4px;
        }
        .btn-secondary {
          background: none; border: 1.5px solid #d1faf5;
          color: #2d6a66; padding: 12px 28px;
          border-radius: 100px; font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: #0f766e; color: #0f766e; }
        .btn-primary {
          background: #0f766e; color: white;
          border: none; padding: 12px 32px;
          border-radius: 100px; font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600; cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 14px #0f766e33;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover:not(:disabled) {
          background: #0d5e57;
          box-shadow: 0 4px 20px #0f766e44;
          transform: translateY(-1px);
        }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* ── Confirmation ── */
        .confirm-screen {
          text-align: center;
          padding: 16px 0 8px;
        }
        .confirm-icon {
          width: 80px; height: 80px;
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; margin: 0 auto 24px;
          animation: pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .confirm-title {
          font-family: 'Fraunces', serif;
          font-size: 30px; font-weight: 400;
          color: #0d3330; margin-bottom: 8px;
        }
        .confirm-ref {
          display: inline-block;
          background: #f0fdf8; border: 1.5px solid #5eead4;
          border-radius: 8px; padding: 8px 20px;
          font-size: 13px; color: #0f766e;
          font-weight: 600; letter-spacing: 0.08em;
          margin-bottom: 16px;
        }
        .confirm-msg {
          font-size: 15px; color: #2d6a66;
          line-height: 1.6; margin-bottom: 32px;
          max-width: 380px; margin-inline: auto;
        }
        .confirm-whatsapp {
          background: #25D366; color: white;
          border: none; padding: 14px 36px;
          border-radius: 100px; font-size: 15px;
          font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px #25D36644;
        }
        .confirm-whatsapp:hover {
          background: #1da851;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px #25D36655;
        }
        .confirm-details {
          margin-top: 24px;
          border: 1.5px solid #d1faf5;
          border-radius: 12px;
          padding: 16px;
          text-align: left;
        }
        .confirm-row {
          display: flex; justify-content: space-between;
          font-size: 13px; padding: 6px 0;
          border-bottom: 1px solid #f0fdf8;
        }
        .confirm-row:last-child { border: none; }
        .confirm-row span:first-child { color: #6b9e9a; font-weight: 500; }
        .confirm-row span:last-child { color: #0d3330; font-weight: 600; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .loading-slots {
          text-align: center; padding: 40px;
          color: #6b9e9a; font-size: 14px;
        }
        .loading-dots::after {
          content: '';
          animation: dots 1.2s infinite;
        }
        @keyframes dots {
          0%   { content: ''; }
          33%  { content: '.'; }
          66%  { content: '..'; }
          100% { content: '...'; }
        }

        @media (max-width: 480px) {
          .modal { padding: 28px 20px; }
          .row-2 { grid-template-columns: 1fr; }
          .trust-row { gap: 20px; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="cross-mark">✚</div>
        <div className="hero-inner">
          <div className="badge">Reliable Dental Care Experts</div>
          <h1 className="clinic-name">
            The Dental<em>Clinic</em><br />
          </h1>
          <h3>Our expert dentists deliver advanced care for a healthy, confident smile.</h3>
          <p className="tagline">
           Experience world-class dental care right here in Kolkata.
          </p>
          <button className="book-btn" onClick={() => setShowForm(true)}>
            Book an Appointment
          </button>
          <div className="trust-row">
            <div className="trust-item">
              <div className="trust-num">4,000
+</div>
              <div className="trust-label">Happy Patients</div>
            </div>
            <div className="trust-item">
              <div className="trust-num">8+</div>
              <div className="trust-label">Years of Experience</div>
            </div>
            <div className="trust-item">
              <div className="trust-num">10+</div>
              <div className="trust-label">Dentists</div>
            </div>
            {/* <div className="trust-item">
              <div className="trust-num">Mon–Sat</div>
              <div className="trust-label">10:00am – 2:00pm</div>
            </div> */}
          </div>
        </div>
      </section>

      {/* ── Modal ── */}
      {showForm && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && reset()}>
          <div className="modal">
            <button className="close-btn" onClick={reset}>✕</button>

            {step !== 3 && <StepDots step={step} />}

            {/* ── Step 1: Patient Details ── */}
            {step === 1 && (
              <>
                <p className="modal-title">Your details</p>
                <p className="modal-subtitle">Step 1 of 2 — Fill in your information</p>

                <div className="row-2">
                  <div className="field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    {errors.name && <div className="err">{errors.name}</div>}
                  </div>
                  <div className="field">
                    <label>Age *</label>
                    <input
                      type="number"
                      placeholder=""
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min={1} max={120}
                    />
                    {errors.age && <div className="err">{errors.age}</div>}
                  </div>
                </div>

                <div className="field">
                  <label>Address *</label>
                  <input
                    type="text"
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  {errors.address && <div className="err">{errors.address}</div>}
                </div>

                 {/* Step 1: Primary Ailment */}
                <div className="field">
                  <label>Primary Ailment *</label>
                  <select value={primaryAilment} onChange={(e) => setPrimaryAilment(e.target.value as keyof typeof AILMENTS | "")}>
                    <option value="">— Select a primary ailment —</option>
                    {Object.keys(AILMENTS).map((key) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                  {errors.primaryAilment && <div className="err">{errors.primaryAilment}</div>}
                </div>

                {/* Step 2: Sub-Ailment (shown only after primary is selected) */}
                {primaryAilment && (
                  <div className="field">
                    <label>Service *</label>
                    <select value={ailment} onChange={(e) => setAilment(e.target.value)}>
                      <option value="">— Select a service —</option>
                      {AILMENTS[primaryAilment].map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    {errors.ailment && <div className="err">{errors.ailment}</div>}
                  </div>
                )}

                <div className="field">
                  <label>WhatsApp Number (for confirmation)</label>
                  <input
                    type="tel"
                    placeholder="0000000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                  />
                  {errors.phone && <div className="err">{errors.phone}</div>}
                </div>

                <div className="action-row">
                  <button className="btn-secondary" onClick={reset}>Cancel</button>
                  <button className="btn-primary" onClick={handleNext}>
                    Choose Slot →
                  </button>
                </div>
              </>
            )}

            {/* ── Step 2: Slot Picker ── */}
            {step === 2 && (
              <>
                <p className="modal-title">Pick a slot</p>
                <p className="modal-subtitle">Step 2 of 2 — Choose an available time</p>

                {slotsLoading ? (
                  <div className="loading-slots">
                    <p className="loading-dots">Loading available slots</p>
                  </div>
                ) : (
                  <>
                    {/* Day tabs */}
                    <div className="day-tabs">
                      {daySlots.map((day) => (
                        <button
                          key={day.date}
                          className={`day-tab ${selectedDay === day.date ? "active" : ""}`}
                          onClick={() => {
                            setSelectedDay(day.date);
                            setSelectedDayLabel(day.label);
                            setSelectedSlot(null);
                          }}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>

                    {/* Slots grid */}
                    {activeDayData && (
                      <div className="slots-grid">
                        {activeDayData.slots.map((slot) => (
                          <button
                            key={slot.id}
                            className={`slot-btn ${!slot.available ? "taken" : ""} ${selectedSlot?.id === slot.id ? "selected" : ""}`}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected notice */}
                    {selectedSlot && (
                      <div className="selected-notice">
                        {selectedDayLabel} at {selectedSlot.time} selected
                      </div>
                    )}
                  </>
                )}

                <div className="action-row">
                  <button className="btn-secondary" onClick={() => { setStep(1); setSelectedSlot(null); }}>
                    ← Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleBook}
                    disabled={!selectedSlot || loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner" />
                        Booking…
                      </>
                    ) : (
                      "Book your slot ✓"
                    )}
                  </button>
                </div>
              </>
            )}

            {/* ── Step 3: Confirmation ── */}
            {step === 3 && confirmed && (
              <div className="confirm-screen">
                <div className="confirm-icon">✓</div>
                <p className="confirm-title">You're all set!</p>
                <div className="confirm-ref">{bookingRef}</div>
                <p className="confirm-msg">
                  Your appointment has been confirmed. Check your phone — we're sending a WhatsApp confirmation with all the details.
                </p>

                <div className="confirm-details">
                  <div className="confirm-row">
                    <span>Patient</span>
                    <span>{name}, {age} yrs</span>
                  </div>
                  <div className="confirm-row">
                    <span>Ailment</span>
                    <span>{ailment}</span>
                  </div>
                  <div className="confirm-row">
                    <span>Appointment</span>
                    <span>{selectedDayLabel} · {selectedSlot?.time}</span>
                  </div>
                  {/* <div className="confirm-row">
                    <span>Clinic</span>
                    <span>Sinha Care Clinic</span>
                  </div> */}
                  {phone && (
                    <div className="confirm-row">
                      <span>WhatsApp</span>
                      <span>+91 {phone}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  {/* <button
                    className="confirm-whatsapp"
                    onClick={() => {
                      const msg = `Hi, I just booked an appointment at Sinha Care Clinic.\nRef: ${bookingRef}\nName: ${name}\nSlot: ${selectedDayLabel} at ${selectedSlot?.time}`;
                      window.open(`https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                  >
                    📱 Open WhatsApp
                  </button> */}
                  <button className="btn-secondary" onClick={reset} style={{ marginTop: 0 }}>
                    Book another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
