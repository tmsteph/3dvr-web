const RATE_TABLE = {
  lead: { label: 'lead technician', dayRate: 750 },
  support: { label: 'support technician', dayRate: 500 },
};

const level = document.getElementById('level');
const technicians = document.getElementById('technicians');
const days = document.getElementById('days');
const hoursPerDay = document.getElementById('hoursPerDay');
const estimateTotal = document.getElementById('estimateTotal');
const estimateBreakdown = document.getElementById('estimateBreakdown');
const bookingForm = document.getElementById('bookingForm');
const submitButton = document.getElementById('submitButton');
const formStatus = document.getElementById('formStatus');
const eventDate = document.getElementById('eventDate');

function clampInteger(value, minimum, maximum, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(Math.max(parsed, minimum), maximum);
}

function calculateEstimate() {
  const selectedRate = RATE_TABLE[level.value] || RATE_TABLE.lead;
  const crewSize = clampInteger(technicians.value, 1, 8, 1);
  const eventDays = clampInteger(days.value, 1, 14, 1);
  const dailyHours = clampInteger(hoursPerDay.value, 4, 18, 10);
  const overtimeHours = Math.max(dailyHours - 10, 0);
  const overtimeRate = (selectedRate.dayRate / 10) * 1.5;
  const baseTotal = selectedRate.dayRate * crewSize * eventDays;
  const overtimeTotal = Math.round(overtimeHours * overtimeRate * crewSize * eventDays);

  return {
    selectedRate,
    crewSize,
    eventDays,
    dailyHours,
    overtimeHours,
    total: baseTotal + overtimeTotal,
  };
}

function renderEstimate() {
  const estimate = calculateEstimate();
  estimateTotal.textContent = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(estimate.total);

  const crewLabel = estimate.crewSize === 1
    ? estimate.selectedRate.label
    : estimate.selectedRate.label.replace('technician', 'technicians');
  const dayLabel = estimate.eventDays === 1 ? 'day' : 'days';
  const overtimeCopy = estimate.overtimeHours > 0
    ? ` · ${estimate.overtimeHours} OT hr/day estimated`
    : '';
  estimateBreakdown.textContent = `${estimate.crewSize} ${crewLabel} · ${estimate.eventDays} ${dayLabel} · ${estimate.dailyHours} hr/day${overtimeCopy}`;
}

function isAllowedPortalOrigin(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(host)) return url.origin;
    if (url.protocol !== 'https:') return '';
    if (host === 'portal.3dvr.tech' || host === 'portal-staging.3dvr.tech') return url.origin;
    if (host.endsWith('.vercel.app') && host.includes('3dvr-portal')) return url.origin;
  } catch {
    return '';
  }
  return '';
}

function resolvePortalOrigin() {
  const queryOrigin = new URLSearchParams(window.location.search).get('portalOrigin');
  const metaOrigin = document.querySelector('meta[name="3dvr:portal-origin"]')?.content;
  return isAllowedPortalOrigin(queryOrigin)
    || isAllowedPortalOrigin(metaOrigin)
    || 'https://portal.3dvr.tech';
}

async function submitBooking(event) {
  event.preventDefault();
  if (!bookingForm.reportValidity()) return;

  submitButton.disabled = true;
  formStatus.textContent = 'Sending…';
  formStatus.dataset.state = 'working';

  const formData = new FormData(bookingForm);
  const estimate = calculateEstimate();
  const payload = {
    kind: 'av-booking-request',
    source: '3dvr.tech/hire-av',
    name: formData.get('name'),
    email: formData.get('email'),
    company: formData.get('company'),
    phone: formData.get('phone'),
    eventDate: formData.get('eventDate'),
    venue: formData.get('venue'),
    role: formData.get('role'),
    notes: formData.get('notes'),
    companyWebsite: formData.get('companyWebsite'),
    level: level.value,
    technicians: estimate.crewSize,
    days: estimate.eventDays,
    hoursPerDay: estimate.dailyHours,
  };

  try {
    const response = await fetch(`${resolvePortalOrigin()}/api/trial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || 'Could not send the booking request.');
    }

    formStatus.textContent = 'Request sent. We’ll reply by email.';
    formStatus.dataset.state = 'success';
    bookingForm.reset();
    level.value = 'lead';
    technicians.value = '1';
    days.value = '1';
    hoursPerDay.value = '10';
    renderEstimate();
  } catch (error) {
    formStatus.textContent = error.message || 'Could not send the booking request.';
    formStatus.dataset.state = 'error';
  } finally {
    submitButton.disabled = false;
  }
}

[level, technicians, days, hoursPerDay].forEach((control) => {
  control.addEventListener('input', renderEstimate);
  control.addEventListener('change', renderEstimate);
});

bookingForm.addEventListener('submit', submitBooking);

const today = new Date();
const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60 * 1000))
  .toISOString()
  .slice(0, 10);
eventDate.min = localDate;
renderEstimate();
