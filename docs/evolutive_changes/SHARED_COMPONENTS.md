# Shared Components Guide

This file documents repeated UI pieces across multiple pages for future componentization (React) and API mapping (Express + Prisma + MySQL).

## Global Navigation (top-nav)
Common classes: `top-nav`, `top-nav__inner`, `brand-*`, `nav-links`, `nav-link`, `nav-icon`, `btn-cta`, `nav-toggle`.
- Used in: `index.html`, `franquias.html`, `checkout.html`, `admin.html`

## Global Footer (site-footer)
Common classes: `site-footer`, `footer-grid`, `footer-card`, `social-link`, `footer-input`, `footer-submit`, `footer-bottom`, `footer-link`.
- Used in: `index.html`, `franquias.html`, `checkout.html`

## Brand Block
Logo + title group:
- `brand-link`, `brand-mark`, `brand-img`, `brand-title`
- Used in: navs and admin sidebar header.

## CTA Button Pattern
Primary CTA styling:
- `btn-cta` (nav)
- Various section CTAs use similar uppercase/rounded styles.
- Used in: `index.html`, `franquias.html`, `checkout.html`

## Cart Modal (Home)
Slide-over cart with items list, quantity controls, subtotal:
- `index.html` only (candidate reusable component).

## API Mapping Notes (Express + Prisma + MySQL)
- Component data should be sourced from Node/Express endpoints and MySQL tables via Prisma.
- Keep UI structure intact; swap static text/images for API-fed props.

## Metric Cards
Admin KPI tiles:
- `metric-card`, `metric-card-icon`, `metric-badge`
- Used in: `admin.html`

## Admin Sidebar
Navigation list in admin views:
- `sidebar-item`, `sidebar-item--active`, `sidebar-item--inactive`, `sidebar-label`
- Used in: `admin.html`

## Tables
Leads table in admin:
- `table-head-cell`, `table-cell`
- Used in: `admin.html`

## Product Collection Carousel
Horizontal collection with floating arrows:
- `collection-arrow`, `gridprodutos`
- Used in: `index.html`

## Forms
Repeated form patterns:
- Newsletter form in footer: `footer-input` + `footer-submit`
- Franchise lead form: `franquias.html`
- Checkout payment form: `checkout.html`

## Section Layout Patterns
Common layout structures:
- Hero sections (full-bleed image + overlay + CTA)
- Grid-based cards (services/products)
- CTA band (large banner with button)
- Used in: `index.html`, `franquias.html`
