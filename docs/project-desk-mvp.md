# Build 3DVR Project Desk MVP

We are building the first MVP of **3DVR Project Desk** inside the 3DVR web app.

## Product Concept

3DVR Project Desk gives small projects a simple managed web presence:

- `project.3dvr.tech`
- `project@3dvr.tech`
- Landing page
- Contact form
- Booking request form
- Payment link
- Lead/booking dashboard

The MVP should focus on letting 3DVR manually create project records, render project pages from those records,
collect contact/booking requests, and view them in an admin dashboard.

Do **not** build full email hosting, real mailboxes, AI agents, Stripe Connect, complex CRM, or calendar sync yet.

## MVP Goals

Build:

1. Project records
2. Subdomain/slug-based project pages
3. Project landing page template
4. Contact form
5. Booking request form
6. Lead storage
7. Booking request storage
8. Admin dashboard
9. Payment link display
10. Simple project settings

## Recommended Stack

Use the existing app if present. Otherwise use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Server Actions or API routes
- Supabase/Postgres if already configured
- If no database is configured yet, create a simple local mock data layer that can later be swapped for a database

Do not overcomplicate auth yet. If auth already exists, protect the dashboard. If auth does not exist, create the
dashboard routes but clearly mark them as admin-only placeholders.

## Main Routes

Public project routes:

```txt
/[projectSlug]
/[projectSlug]/contact
/[projectSlug]/book
/[projectSlug]/pay
/[projectSlug]/thank-you
```

Admin routes:

```txt
/dashboard
/dashboard/projects
/dashboard/projects/new
/dashboard/projects/[projectSlug]
/dashboard/projects/[projectSlug]/leads
/dashboard/projects/[projectSlug]/bookings
/dashboard/projects/[projectSlug]/settings
```

For now, use slug-based routing such as `/sddt`. Later this can be adapted to wildcard subdomains like
`sddt.3dvr.tech`.

## Data Models

Create TypeScript types for:

```ts
export type ProjectPlan = "free" | "address" | "desk" | "managed" | "business_os";

export type ProjectStatus = "draft" | "active" | "paused" | "archived";

export type Project = {
  id: string;
  slug: string;
  name: string;
  description: string;
  tagline?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  emailAlias?: string;
  subdomain?: string;
  plan: ProjectPlan;
  status: ProjectStatus;
  services: string[];
  paymentLinks: PaymentLink[];
  createdAt: string;
  updatedAt: string;
};

export type LeadStatus = "new" | "contacted" | "qualified" | "closed" | "lost";

export type Lead = {
  id: string;
  projectId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredContactMethod?: string;
  source: "contact_form";
  status: LeadStatus;
  createdAt: string;
};

export type BookingStatus = "requested" | "confirmed" | "declined" | "completed" | "cancelled";

export type BookingRequest = {
  id: string;
  projectId: string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  preferredDate?: string;
  preferredTime?: string;
  location?: string;
  budgetRange?: string;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
};

export type PaymentLink = {
  id: string;
  label: string;
  url: string;
  description?: string;
  amount?: number;
  currency?: "usd";
  status: "active" | "inactive";
};
```

## Seed Project

Create a seed project for SDDT:

```ts
const sddtProject = {
  id: "project_sddt",
  slug: "sddt",
  name: "SDDT",
  tagline: "A small project powered by 3DVR Project Desk.",
  description:
    "SDDT is using 3DVR Project Desk for its web presence, contact flow, booking requests, and payment links.",
  ownerName: "Project Owner",
  ownerEmail: "owner@example.com",
  emailAlias: "sddt@3dvr.tech",
  subdomain: "sddt.3dvr.tech",
  plan: "desk",
  status: "active",
  services: ["General inquiries", "Booking requests", "Project support"],
  paymentLinks: [
    {
      id: "payment_sddt_deposit",
      label: "Pay Deposit",
      url: "https://buy.stripe.com/test_placeholder",
      description: "Use this link to pay a project deposit.",
      amount: 5000,
      currency: "usd",
      status: "active"
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
```

## Public Project Page

The project landing page should show:

- Project name
- Tagline
- Description
- Services
- Project email alias, if available
- Buttons for Contact, Book, and Pay
- "Powered by 3DVR Project Desk" footer

Use clean responsive styling.

## Contact Form

Create a contact form with:

- Name
- Email
- Phone optional
- Preferred contact method optional
- Message
- Hidden honeypot spam field

On submit:

1. Validate required fields.
2. Reject spam if honeypot is filled.
3. Create a `Lead` record.
4. Redirect to thank-you page.
5. In the future this will send an email notification.

For now, if there is no database, simulate persistence in a local mock store and leave TODO comments for database
integration.

## Booking Request Form

Create a booking request form with:

- Name
- Email
- Phone optional
- Service
- Preferred date
- Preferred time
- Location optional
- Budget range optional
- Notes

Make it clear on the page:

> This is a booking request, not a confirmed booking.

On submit:

1. Validate required fields.
2. Create a `BookingRequest` record.
3. Redirect to thank-you page.
4. In the future this will send an email notification.

## Payment Page

Create a `/[projectSlug]/pay` page that lists active payment links for the project.

Each payment link card should show:

- Label
- Description
- Amount if available
- Button linking to Stripe/payment URL

If no payment links exist, show a friendly message.

## Dashboard

Create a simple admin dashboard.

Dashboard home:

- Total projects
- Active projects
- New leads
- Requested bookings

Projects page:

- List projects
- Name
- Slug
- Plan
- Status
- Owner email
- Quick links

Project detail page:

- Project summary
- Public page link
- Contact page link
- Booking page link
- Pay page link
- Email alias
- Plan
- Status

Leads page:

- List leads for project
- Name
- Email
- Phone
- Message preview
- Status
- Created date

Bookings page:

- List booking requests for project
- Name
- Email
- Service
- Preferred date
- Preferred time
- Status
- Created date

Settings page:

- Show project fields
- Include editable UI if easy
- Otherwise display current settings and TODO comments for edit/save

## Design Direction

The UI should feel:

- Clean
- Human
- Lightweight
- Futuristic but not overbuilt
- Small-business friendly
- Mobile responsive

Use simple cards, clear buttons, and readable spacing.

Avoid a giant enterprise CRM feel.

## Important Constraints

Do not build:

- Full email hosting
- Real mailbox login
- Mass email sending
- Stripe Connect
- AI auto replies
- Google Calendar sync
- Complex CRM
- Multi-tenant permissions
- Public self-serve billing

Keep the MVP small and working.

## Definition Of Done

The MVP is done when:

1. `/sddt` renders a public project page.
2. `/sddt/contact` accepts a contact request.
3. `/sddt/book` accepts a booking request.
4. `/sddt/pay` shows the project payment link.
5. `/dashboard/projects` lists the seed project.
6. `/dashboard/projects/sddt/leads` shows submitted leads.
7. `/dashboard/projects/sddt/bookings` shows submitted booking requests.
8. The code is organized so the mock data layer can later be replaced with Supabase/Postgres.
9. There are TODO comments where email notifications, auth, real database storage, and subdomain routing should be added.

## Implementation Preference

Start by creating the data types, mock data layer, and route structure. Then build the public project pages. Then build
the forms. Then build the dashboard.

Prefer simple working code over abstract architecture.
