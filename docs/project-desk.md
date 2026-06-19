# 3DVR Project Desk

## Working Product Documentation

**Status:** Draft / living spec  
**Owner:** 3DVR / tmsteph  
**Core idea:** Small projects want their basic digital infrastructure handled: web address, email identity, contact form, booking requests, payments, and simple follow-up.

3DVR Project Desk is a managed launch layer for small projects, artists, crews, startups, side businesses, pop-ups, local operators, and experimental brands.

The customer should not have to understand DNS, MX records, Vercel, SMTP, DKIM, calendars, form backends, or payment links. They should be able to say:

> “Here is my project. Can people find me, contact me, book me, and pay me?”

3DVR answers:

> “Yes. We handled it.”

---

## 1. Product Summary

### Simple description

3DVR Project Desk gives a small project a professional web identity and a simple operating layer.

Example:

```txt
Project: SDDT
Website: sddt.3dvr.tech
Email: sddt@3dvr.tech
Contact form: sddt.3dvr.tech/contact
Booking page: sddt.3dvr.tech/book
Dashboard: 3dvr.tech/admin/projects/sddt
```

### What it handles

- Project subdomain
- Project email address or alias
- Landing page or microsite
- Contact form
- Booking request form or calendar embed
- Lead notifications
- Optional payment links
- Optional client/project dashboard
- Optional AI-drafted responses with human approval
- Optional managed inbox or ticket queue

### What it is not, at first

3DVR should not initially position itself as a full email hosting company.

Instead, email is one feature inside a larger managed project layer.

The value is not just:

```txt
We give you an email address.
```

The value is:

```txt
People can find you, contact you, request bookings, and pay you without you setting up tech.
```

---

## 2. Customer Problem

Small projects repeatedly need the same infrastructure:

- A basic website
- A professional-looking email address
- A way for people to contact them
- A way for people to request bookings
- A way to collect payments or deposits
- A simple way to reply and follow up
- A way to look real before they are large enough for full business tooling

The pain is that every step requires technical decisions:

```txt
Domain registrar
DNS records
Subdomains
Vercel deployment
SSL
MX records
Email forwarding
SMTP
DKIM / SPF / DMARC
Contact forms
Spam protection
Calendar tools
Stripe links
CRM setup
```

Most small projects do not want to think about this. They want a simple, managed result.

---

## 3. Target Users

Initial target users:

- Local service providers
- Event crews
- Artists and performers
- Pop-up vendors
- Resellers
- Micro-startups
- Hobby projects becoming real
- Small community organizations
- Side businesses
- Friends/contacts who need a quick professional web presence

Good early use cases:

- `sddt.3dvr.tech`
- `victor.3dvr.tech`
- local event project pages
- simple reseller microsites
- booking/contact pages for service businesses
- one-page launch pages for experimental projects

---

## 4. Core Concepts

### 4.1 Project identity

Each project gets a short slug.

Example:

```txt
sddt
victor
events
cruisers
```

The slug can create:

```txt
sddt.3dvr.tech
sddt@3dvr.tech
3dvr.tech/sddt
3dvr.tech/admin/projects/sddt
```

Subdomains should be the preferred public URL for projects that feel like separate entities.

Paths can be used for simpler internal routing or fallback pages.

---

### 4.2 Project website

Default project website:

```txt
https://sddt.3dvr.tech
```

Possible implementation:

- Vercel project per customer
- One shared Next.js app with dynamic subdomain routing
- Static microsite generated from project data
- Optional custom domain later

Minimum content:

- Project name
- Short description
- Main call to action
- Contact button
- Booking/request button
- Optional payment button
- Optional gallery/files
- Optional 3DVR footer depending on plan

---

### 4.3 Project email

Example:

```txt
sddt@3dvr.tech
```

There should be multiple levels of email support.

#### Level A: Email forwarding

Incoming mail to `sddt@3dvr.tech` forwards to the project owner’s existing email.

Pros:

- Easy
- Cheap
- Good MVP
- Avoids managing mailboxes

Cons:

- Replies may come from the owner’s personal email unless send-as is configured
- Limited professional polish

Good for:

```txt
$5/month tier
```

#### Level B: Forwarding + send-as

Incoming mail forwards to the owner’s existing Gmail/Outlook/etc.

The owner can reply as:

```txt
sddt@3dvr.tech
```

This likely requires an outbound SMTP provider and correct SPF/DKIM/DMARC setup.

Pros:

- Good user experience
- Customer keeps their existing inbox
- Replies look professional
- Lower support burden than full mailbox hosting

Good for:

```txt
$20/month tier or setup add-on
```

#### Level C: 3DVR shared managed inbox / ticket view

Instead of giving customers direct mailbox login, incoming messages become leads/tickets in a 3DVR dashboard.

Example:

```txt
New message for SDDT
From: maria@example.com
Subject: Booking request
Actions: Reply, Mark Done, Send Invoice, Create Booking
```

Pros:

- Turns email into workflow
- More valuable than raw email hosting
- Supports AI-drafted replies
- Supports human approval before sending
- Can become a CRM-lite system

Good for:

```txt
$50/month+
```

#### Level D: Full real mailbox

A real mailbox with webmail/IMAP/SMTP.

Examples:

```txt
sddt@3dvr.tech
booking@sddt.3dvr.tech
info@sddt.3dvr.tech
```

Could be powered by:

- Google Workspace
- Microsoft 365
- Zoho Mail
- Fastmail
- Proton for Business
- Other managed email provider

Pros:

- Most familiar to business users
- Cleanest email identity

Cons:

- Usually costs per mailbox/user
- Support burden
- Passwords and account recovery
- Abuse risk
- Deliverability management

Good for:

```txt
$200/month+ managed plan
```

---

## 5. Contact Forms

Every project should be able to have a contact form.

Default URL:

```txt
https://sddt.3dvr.tech/contact
```

Basic fields:

```txt
Name
Email
Phone
Message
Project/service needed
Preferred contact method
Consent checkbox
```

Optional fields:

```txt
Budget range
Timeline
Upload file/photo
Company/organization
Location
Urgency
Referral source
```

Form submission should create:

- A lead record
- An email notification to the project owner or 3DVR
- Optional autoresponder to the submitter
- Optional dashboard item
- Optional CRM/contact record

Suggested lead object:

```json
{
  "id": "lead_123",
  "projectSlug": "sddt",
  "name": "Maria",
  "email": "maria@example.com",
  "phone": "+1-555-000-0000",
  "message": "I want to book Saturday.",
  "source": "contact_form",
  "status": "new",
  "createdAt": "2026-06-11T12:00:00-07:00"
}
```

---

## 6. Booking Requests

Many users want people to fill out a form or calendar on their website for booking requests.

Default URL:

```txt
https://sddt.3dvr.tech/book
```

There are two levels:

### 6.1 Booking request form

This is the best MVP.

The visitor submits preferred dates/times, but the booking is not automatically confirmed.

Fields:

```txt
Name
Email
Phone
Service needed
Preferred date
Preferred time window
Backup date/time
Location
Estimated budget
Notes
```

Flow:

```txt
Visitor submits booking request
↓
Project owner receives notification
↓
Owner approves, replies, invoices, or schedules manually
```

This avoids calendar complexity at the start.

### 6.2 Calendar scheduling

Later, integrate real scheduling.

Possible options:

- Cal.com embed/API
- Calendly embed
- Google Calendar API
- 3DVR-native availability system

Flow:

```txt
Visitor picks available time
↓
Booking is created or requested
↓
Calendar event is created
↓
Notifications are sent
↓
Optional payment/deposit is collected
```

MVP recommendation:

```txt
Start with booking request forms.
Add real calendar scheduling only after the request workflow is useful.
```

---

## 7. Payments

Payment support should begin simply.

Initial options:

- Stripe Payment Link
- Stripe Invoice
- One-time payment button
- Deposit link
- Subscription checkout for recurring 3DVR customers

Example:

```txt
sddt.3dvr.tech/pay
```

Payment actions:

```txt
Send payment link
Request deposit
Mark lead as paid
Attach payment to booking
Create invoice
```

Future dashboard action:

```txt
[Send Deposit Request]
```

---

## 8. Dashboard

Internal/admin dashboard:

```txt
https://3dvr.tech/admin/projects/sddt
```

Customer-facing dashboard later:

```txt
https://3dvr.tech/desk/sddt
```

MVP dashboard sections:

- Project info
- Website status
- Email forwarding destination
- Contact submissions
- Booking requests
- Payment links
- Notes
- Plan/status

Future dashboard sections:

- Inbox/tickets
- AI reply drafts
- Approval queue
- Contacts/CRM-lite
- Invoices/payments
- Calendar events
- Automations
- Analytics

---

## 9. AI / Agentic Workflow

This product connects directly to the 3DVR agentic business OS idea.

Useful AI features:

- Summarize incoming messages
- Draft replies
- Classify leads
- Suggest next actions
- Create quote/proposal drafts
- Generate microsite copy
- Generate FAQ answers
- Remind owner to follow up
- Create support ticket summaries

Important pattern:

```txt
AI drafts.
Human approves.
Then it sends.
```

Delayed send / approval pattern:

```txt
AI prepares outbound reply
↓
Human gets notification
↓
Human chooses thumbs up or thumbs down
↓
Thumbs up sends immediately
↓
Thumbs down cancels and asks for redraft
↓
No response can optionally auto-send after timeout for approved workflows only
```

This should be treated as a premium feature.

---

## 10. Pricing Ladder

Use the existing 3DVR ladder.

### $0/month — Demo / trial

- Demo page
- 3DVR-branded URL
- No custom email
- 3DVR footer/branding
- Manual setup only

Example:

```txt
demo.3dvr.tech/project-name
```

### $5/month — Project Address

- `project.3dvr.tech`
- `project@3dvr.tech` forwarding
- Basic contact form
- Email notifications
- Simple landing page

### $20/month — Project Desk

- Branded microsite
- Contact form
- Booking request form
- Basic lead records
- Reply templates
- Stripe payment/request link
- Optional send-as setup support

### $50/month — Managed Client Flow

- Managed inbox or ticket view
- Calendar booking requests
- Form routing
- Follow-up reminders
- Monthly updates
- Human-approved AI reply drafts
- Basic CRM/contact list

### $200/month — Business OS

- Full managed project operating layer
- Website, email, forms, booking, payments
- CRM-lite
- Invoices
- Automations
- AI assistant workflows
- Custom domain/email setup
- Priority support

### Add-ons

- Custom domain setup
- Real mailbox setup
- Google Workspace setup
- Microsoft 365 setup
- Zoho/Fastmail setup
- Additional project email aliases
- Custom booking flow
- Custom form fields
- Extra microsite pages
- One-time launch package

---

## 11. Technical Architecture

### 11.1 Core stack

Likely stack:

```txt
Next.js / React
Vercel
Postgres / Supabase / Firebase / SQLite-to-Postgres path
Stripe
Email routing provider
Transactional email provider
Calendar integration later
```

### 11.2 Website routing

Options:

#### Option A: One Vercel project per customer

Pros:

- Simple mental model
- Easy isolation
- Easy custom design per client

Cons:

- Harder to scale many small projects
- More manual deployment management

#### Option B: One shared app with dynamic subdomains

Example:

```txt
sddt.3dvr.tech → shared app reads projectSlug=sddt
victor.3dvr.tech → shared app reads projectSlug=victor
```

Pros:

- Scales better
- Easier to maintain templates
- Dashboard can update content dynamically

Cons:

- Requires more upfront engineering

Recommended path:

```txt
Start with simple Vercel projects or a shared template.
Move toward dynamic subdomain routing as projects grow.
```

### 11.3 Email receiving

MVP options:

- Cloudflare Email Routing for forwarding
- ImprovMX-style forwarding
- Mailgun inbound routes
- SendGrid inbound parse
- Postmark inbound
- Resend inbound if suitable

For dashboard/ticket workflow, use an inbound parse provider that posts emails to a webhook.

Flow:

```txt
Incoming email to project@3dvr.tech
↓
Email provider receives it
↓
Webhook posts to 3DVR API
↓
Message is stored as lead/ticket
↓
Notification is sent to owner
```

### 11.4 Email sending

For outbound messages:

- Transactional email provider
- Proper SPF/DKIM/DMARC records
- Human approval before AI-generated sends
- Domain reputation protection

Important:

```txt
Do not let untrusted users freely send bulk mail from 3dvr.tech.
```

Anti-abuse controls needed:

- Manual approval for new projects
- Rate limits
- Verified recipients or approved sending
- Spam monitoring
- Logs
- Ability to disable a project

### 11.5 Forms

Form submission flow:

```txt
Visitor submits form
↓
API validates data
↓
Spam checks
↓
Lead saved to database
↓
Notification email sent
↓
Optional autoresponder sent
↓
Dashboard updated
```

Spam protection options:

- Honeypot field
- Turnstile / CAPTCHA
- Rate limiting
- Email validation
- Blocklist

### 11.6 Booking

MVP booking request form:

```txt
/book → form → booking_request record → notification
```

Future real calendar integration:

```txt
availability rules
calendar sync
booking confirmation
Google Calendar event creation
reschedule/cancel links
payment/deposit requirement
```

---

## 12. Data Model Draft

### Project

```json
{
  "id": "project_123",
  "slug": "sddt",
  "name": "SDDT",
  "description": "Short project description",
  "ownerName": "Project Owner",
  "ownerEmail": "owner@example.com",
  "plan": "project_desk_20",
  "status": "active",
  "subdomain": "sddt.3dvr.tech",
  "emailAddress": "sddt@3dvr.tech",
  "emailForwardTo": "owner@example.com",
  "createdAt": "2026-06-11T12:00:00-07:00"
}
```

### Lead

```json
{
  "id": "lead_123",
  "projectId": "project_123",
  "source": "contact_form",
  "name": "Maria",
  "email": "maria@example.com",
  "phone": "+1-555-000-0000",
  "message": "I want more information.",
  "status": "new",
  "createdAt": "2026-06-11T12:05:00-07:00"
}
```

### BookingRequest

```json
{
  "id": "booking_123",
  "projectId": "project_123",
  "name": "Maria",
  "email": "maria@example.com",
  "phone": "+1-555-000-0000",
  "service": "Event support",
  "preferredDate": "2026-07-01",
  "preferredTimeWindow": "Afternoon",
  "location": "San Diego",
  "budgetRange": "$500-$1000",
  "notes": "Need help with setup.",
  "status": "requested",
  "createdAt": "2026-06-11T12:10:00-07:00"
}
```

### Message

```json
{
  "id": "message_123",
  "projectId": "project_123",
  "fromEmail": "maria@example.com",
  "toEmail": "sddt@3dvr.tech",
  "subject": "Booking question",
  "body": "Are you available Saturday?",
  "status": "new",
  "source": "inbound_email",
  "createdAt": "2026-06-11T12:15:00-07:00"
}
```

### ApprovalQueueItem

```json
{
  "id": "approval_123",
  "projectId": "project_123",
  "type": "email_reply",
  "draftBody": "Hi Maria, thanks for reaching out...",
  "status": "pending_approval",
  "createdBy": "ai",
  "createdAt": "2026-06-11T12:20:00-07:00"
}
```

---

## 13. MVP Build Plan

### Phase 1: Manual but sellable

Goal: Sell the first version before overbuilding.

Features:

- Create project record manually
- Create Vercel subdomain manually
- Create simple landing page from template
- Create email forwarding alias
- Add contact form
- Add booking request form
- Send form notifications to owner
- Use Stripe Payment Links manually

Deliverable:

```txt
A customer can have project.3dvr.tech, project@3dvr.tech forwarding, contact form, and booking request page.
```

### Phase 2: Internal admin dashboard

Features:

- Project list
- Create/edit project
- View contact submissions
- View booking requests
- Copy payment links
- Track project plan/status
- Basic notes

Deliverable:

```txt
3DVR can manage multiple small project desks from one admin panel.
```

### Phase 3: Customer dashboard

Features:

- Customer login
- View leads
- View booking requests
- Mark done
- Reply template copy/paste
- Notification preferences

Deliverable:

```txt
Project owners can manage requests without needing a full inbox.
```

### Phase 4: Managed inbox / reply system

Features:

- Inbound email webhook
- Store emails as messages
- Reply from dashboard
- AI draft replies
- Human approval before send
- Audit log

Deliverable:

```txt
3DVR Project Desk becomes a lightweight shared inbox and lead manager.
```

### Phase 5: Business OS

Features:

- CRM-lite
- Invoices
- Payments
- Automated follow-ups
- Proposal generator
- Booking calendar integration
- Multi-user access
- Custom domains
- Full mailbox add-ons

Deliverable:

```txt
3DVR becomes an AI-assisted digital operating system for small projects.
```

---

## 14. Immediate Implementation Checklist

### Product decisions

- [ ] Choose first customer/project example
- [ ] Choose slug format rules
- [ ] Decide whether low-tier projects show 3DVR branding
- [ ] Decide whether `project@3dvr.tech` is allowed for all projects
- [ ] Decide whether certain reserved names are blocked
- [ ] Decide support policy for email forwarding

### Technical decisions

- [ ] Choose shared app vs project-per-customer for MVP
- [ ] Choose database
- [ ] Choose email forwarding provider
- [ ] Choose transactional email provider
- [ ] Choose form spam protection
- [ ] Choose booking MVP: request form or calendar embed
- [ ] Choose Stripe payment flow

### Build tasks

- [ ] Create project data schema
- [ ] Create microsite template
- [ ] Add dynamic project page
- [ ] Add contact form
- [ ] Add booking request form
- [ ] Add email notifications
- [ ] Add basic admin page
- [ ] Add Stripe payment link field
- [ ] Add project status/plan field

---

## 15. Open Questions

1. Should project emails be `project@3dvr.tech` or `contact@project.3dvr.tech`?
2. Should low-tier customers be allowed to use `@3dvr.tech`, or should that be reserved for trusted projects?
3. Should 3DVR eventually support custom domains such as `project.com`?
4. Should booking start as a request form only, or integrate with Cal.com immediately?
5. Should replies happen through the customer's own email first, or through a 3DVR dashboard?
6. What abuse controls are needed before outbound email is offered?
7. Should $5/month include email forwarding, or only the subdomain and form?
8. Should the project dashboard be client-facing from the start, or internal-only at first?
9. Should this product be branded as “Launch Desk,” “3DVR Desk,” or something else?

---

## 16. Positioning

Possible headline:

> Launch your project without touching the tech.

Possible subheadline:

> 3DVR gives your project a web address, email identity, contact form, booking requests, and payments — all managed in one simple desk.

Possible offer:

```txt
Your project gets:
- project.3dvr.tech
- project@3dvr.tech
- a landing page
- a contact form
- a booking request page
- optional payment links
- simple lead notifications
```

Possible customer promise:

> You focus on the work. 3DVR handles the digital front desk.

---

## 17. Guiding Principle

This product should help people launch and operate small projects with less friction.

The deeper mission is not just profit. The mission is to help people wake up, build, communicate, and participate in a freer digital world.

Profit is the circulation system that keeps the help moving.

```txt
Help → Trust → Community → Value → Profit → More Help
```
