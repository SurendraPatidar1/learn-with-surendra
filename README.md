# Surendra's Learn Hub

Build a complete, production-ready, premium digital education marketplace called “Learn With Surendra” where I can sell my own educational PDF notes, study material, ebooks, interview preparation material, and eventually courses.

The application must be built with a clean, scalable architecture and must be fully ready to connect with Supabase, Razorpay, and GitHub.

This is NOT a basic CRUD website. I want a premium SaaS/ed-tech marketplace experience with exceptional UI/UX, smooth animations, micro-interactions, responsive design, strong typography, excellent spacing, polished components, and a professional modern visual identity.

Do not create a generic template-looking website.

==================================================

TECHNOLOGY STACK
==================================================

Use:

React / Next.js architecture where supported

TypeScript

Tailwind CSS

Modern component architecture

Supabase for:

PostgreSQL database

Authentication

Storage

Razorpay-ready payment architecture

GitHub-ready project structure

Production-ready environment variable configuration

Clean reusable components

Proper loading, error, empty and success states

Do NOT hardcode secrets.

Create a .env.example file containing placeholders such as:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

Never expose secret keys in client-side code.

==================================================
2. BRAND

Brand name:

Learn With Surendra

Positioning:

“Learn smarter. Build stronger. Grow faster.”

The platform should feel like a premium Indian developer/education platform.

Primary audience:

B.Tech students

MCA students

CS/IT students

Java developers

Beginners learning programming

Interview preparation students

Students preparing for technical exams

Create a premium visual identity.

Use a sophisticated modern color system with a strong primary accent, dark/light surfaces, subtle gradients, glass effects where appropriate, excellent contrast, and accessibility.

Do NOT overuse gradients, glassmorphism, or flashy effects.

The result should feel premium, modern and trustworthy.

==================================================
3. MAIN WEBSITE PAGES

Create all of these pages:

PUBLIC:

Home

Notes / Products

Product Details

Categories

Search Results

About

Contact

FAQ

Login

Signup

Forgot Password

Terms & Conditions

Privacy Policy

Refund Policy

Order Success

Order Failed

404 page

AUTHENTICATED USER:

Student Dashboard

My Purchases

My Downloads

Profile

Account Settings

ADMIN:

Admin Dashboard

Admin Products

Add Product

Edit Product

Admin Orders

Admin Customers

Admin Categories

Admin Coupons

Admin Reviews

Admin Analytics

Admin Settings

==================================================
4. HOME PAGE

Make the homepage extremely polished.

Hero section:

Headline:

“Master Computer Science. Build Your Future.”

Supporting text:

“Premium notes, interview preparation, programming resources and practical learning material designed for students and developers.”

CTA:

“Explore Notes”

Secondary CTA:

“View Free Resources”

Hero should have subtle premium animated visual elements.

Use:

floating cards

subtle particles

animated gradients

smooth reveal animations

hover effects

soft background motion

Keep performance optimized.

Hero should NOT look like a random AI-generated landing page.

Create sections:

Featured Notes

Popular Categories

Why Learn With Surendra?

Best Selling Resources

Free Resources

Student Benefits

Testimonials

FAQ

CTA Banner

Footer

==================================================
5. PRODUCT / NOTES MARKETPLACE

Create a premium marketplace.

Product cards must contain:

Thumbnail

Product title

Short description

Category

Number of pages

Rating

Review count

Original price

Discounted price

Discount percentage

Free/Paid badge

Bestseller badge where applicable

View Details button

Buy Now button

Cards should have beautiful hover interactions.

Example:

Java Complete Notes
₹99
⭐ 4.9
150+ Pages

[View Details] [Buy Now]

Add:

Search

Category filtering

Price filtering

Rating filtering

Sort by:

Popular

Newest

Price low to high

Price high to low

Rating

Pagination / infinite loading

Empty states

Loading skeletons

==================================================
6. PRODUCT DETAILS PAGE

Create a highly premium product details page.

Include:

Large product preview

Product thumbnail/gallery

Title

Description

Category

Rating

Reviews

Page count

File format

Last updated date

What you'll learn

What's included

Requirements

Preview pages

Price

Discount

Buy Now CTA

Secure payment indicator

Instant access indicator

FAQ

Add sticky purchase card on desktop.

Mobile must have a sticky bottom purchase CTA.

==================================================
7. PDF PREVIEW

Users should be able to see selected preview pages before purchasing.

For paid products:

Only preview pages are accessible publicly.

Full PDF must NOT be publicly accessible.

Use private storage architecture.

After successful payment, authenticated users can access their purchased file.

Never expose the permanent private PDF URL publicly.

Use secure server-side access / signed URLs.

==================================================
8. AUTHENTICATION

Use Supabase Authentication.

Support:

Email/password signup

Login

Logout

Forgot password

Password reset

Protected routes

Session persistence

User profile

User profile fields:

Full name

Email

Profile photo

Phone optional

Joined date

==================================================
9. DATABASE DESIGN

Create a scalable Supabase PostgreSQL schema.

Tables:

users / profiles
products
categories
product_previews
orders
order_items
payments
downloads
reviews
coupons
coupon_usage
wishlist
notifications

Products should contain fields similar to:

id
title
slug
description
short_description
category_id
price
compare_at_price
discount_percentage
thumbnail_url
file_path
page_count
file_size
format
is_free
is_featured
is_bestseller
is_published
created_at
updated_at

Orders:

id
user_id
total_amount
currency
status
razorpay_order_id
created_at

Payments:

id
order_id
user_id
razorpay_payment_id
razorpay_order_id
razorpay_signature
amount
status
created_at

Reviews:

id
product_id
user_id
rating
review
status
created_at

Add appropriate indexes, foreign keys and timestamps.

==================================================
10. ROW LEVEL SECURITY

Implement proper Supabase RLS policies.

Rules:

Users can read published products.

Users can read their own profile.

Users can read their own orders.

Users can read their own purchased products.

Users cannot access another user's purchases.

Paid PDF files cannot be publicly accessible.

Admin-only operations must require admin authorization.

Users can review products they purchased.

Users cannot modify payment records.

Do not simply rely on frontend hiding buttons.

Authorization must be enforced server-side/database-side.

==================================================
11. PAYMENT ARCHITECTURE

Integrate the website in a Razorpay-ready way.

Payment flow:

User clicks:

BUY NOW

↓

Create order on server

↓

Razorpay Checkout

↓

Payment

↓

Verify Razorpay signature server-side

↓

Store payment/order information

↓

Mark order as PAID

↓

Grant product access

↓

Show success page

↓

Product appears in My Purchases

Important:

Do NOT trust frontend payment success.

Payment verification must happen server-side.

Create placeholders / service functions for:

createRazorpayOrder()
verifyRazorpayPayment()
handleRazorpayWebhook()

Create webhook-ready architecture.

For the first generated version, provide a safe TEST / MOCK mode if Razorpay credentials are unavailable.

Clearly separate:

development mode

production mode

Never place RAZORPAY_KEY_SECRET in frontend code.

==================================================
12. DOWNLOAD SECURITY

Paid PDFs must be stored in a private Supabase Storage bucket.

Flow:

Authenticated user
+
Verified purchase
↓
Server checks entitlement
↓
Generate temporary signed URL
↓
Allow download

Users who haven't purchased a product must not be able to access its full PDF.

Create a reusable entitlement/access-control service.

Also create a download record.

==================================================
13. ADMIN DASHBOARD

Create a beautiful premium admin dashboard.

Dashboard cards:

Total Revenue
Total Orders
Total Customers
Total Products
Paid Orders
Pending Orders
Refunded Orders

Charts:

Revenue over time

Orders over time

Top products

Category performance

Customer growth

Use clean interactive charts.

Admin sidebar:

Dashboard
Products
Orders
Customers
Categories
Coupons
Reviews
Analytics
Settings

==================================================
14. ADMIN PRODUCT MANAGEMENT

Admin can:

Create product

Edit product

Delete product

Publish/unpublish

Upload thumbnail

Upload PDF

Upload preview pages

Set price

Set discount

Set category

Mark bestseller

Mark featured

Mark free

Set page count

Set file information

Product upload form must have validation.

Show upload progress.

Show success/error states.

==================================================
15. ADMIN ORDER MANAGEMENT

Admin can see:

Order ID
Customer
Product
Amount
Payment ID
Payment status
Order status
Date

Filters:

Paid

Pending

Failed

Refunded

Search by:

Order ID

Customer email

Payment ID

==================================================
16. COUPONS

Implement coupon system.

Fields:

Coupon code
Discount type
Percentage / fixed
Discount value
Minimum order value
Maximum discount
Usage limit
Expiry date
Active/inactive

Apply coupon during checkout.

Validate coupons server-side.

==================================================
17. STUDENT DASHBOARD

Create premium student dashboard.

Show:

Welcome message

“Welcome back, Surendra 👋”

Cards:

Purchased Notes
Total Downloads
Recent Purchases
Saved Products

Sections:

Continue Learning
Recent Purchases
Recommended Notes

My Purchases page:

Product
Purchase date
Amount
Access button
Download button

==================================================
18. WISHLIST

Allow authenticated users to add products to wishlist.

Create:

Add to wishlist
Remove from wishlist
Wishlist page

==================================================
19. REVIEWS

Only verified purchasers can review a paid product.

Show:

Average rating
Rating distribution
Review count

Admin can moderate reviews.

==================================================
20. SEARCH

Create a powerful global search.

Search products by:

title

description

category

tags

Add:

search suggestions
recent searches
empty state
no-result recommendations

==================================================
21. ANIMATIONS

This is extremely important.

Use high-quality, subtle animations throughout the site.

Use:

page transitions

scroll reveal

fade-up

slide-in

scale

hover elevation

button micro-interactions

animated counters

skeleton loaders

modal transitions

dropdown transitions

toast animations

card hover effects

image hover zoom

smooth accordion

mobile menu animation

Use Framer Motion / Motion where appropriate.

Animations must feel premium and intentional.

Do NOT animate everything excessively.

Respect:

prefers-reduced-motion

==================================================
22. UI QUALITY

UI must be:

Premium

Minimal

Modern

Responsive

Accessible

Fast

Professional

Consistent

Use:

8px spacing system

consistent border radius

consistent shadows

premium typography hierarchy

responsive grids

polished buttons

proper hover/focus states

No broken layouts.

No horizontal scrolling on mobile.

No tiny text.

No poor contrast.

==================================================
23. DARK MODE

Support:

Light mode
Dark mode
System preference

Add a polished theme switcher.

Ensure every component supports both themes.

==================================================
24. RESPONSIVE DESIGN

Must work perfectly on:

Mobile

Tablet

Laptop

Desktop

Large desktop

Mobile-first approach.

Test:

360px
390px
768px
1024px
1440px
1920px

==================================================
25. SEO

Implement SEO-ready architecture.

Every product should have:

unique title

meta description

canonical URL

Open Graph metadata

Twitter metadata

structured data where appropriate

Create:

sitemap
robots.txt

Use clean SEO-friendly URLs:

/notes
/notes/java-complete-notes
/category/java

==================================================
26. PERFORMANCE

Optimize for:

fast loading

lazy loading

image optimization

code splitting

minimal unnecessary requests

caching where appropriate

optimized PDF delivery

responsive images

Do not load huge libraries unnecessarily.

==================================================
27. ERROR HANDLING

Create professional error states.

Examples:

Payment failed
Payment pending
Product not found
Unauthorized
Session expired
Network error
Upload failed
Download failed
No products
No purchases
No search results

Never show raw technical errors to users.

==================================================
28. NOTIFICATIONS

Create toast notifications for:

Login successful
Product added
Wishlist updated
Payment successful
Payment failed
Coupon applied
Profile updated
Product uploaded
Product published

==================================================
29. FOOTER

Footer sections:

Learn With Surendra
Quick Links
Categories
Resources
Support
Legal
Social Links

Include:

Copyright © Learn With Surendra

==================================================
30. SAMPLE DATA

Populate the development environment with realistic sample products:

Java Complete Notes
Java 8 Interview Notes
DSA in Java
SQL Complete Notes
DBMS Notes
Operating System Notes
Computer Networks Notes
Spring Boot Notes
Microservices Notes
System Design Notes

Use realistic prices such as:

₹49
₹79
₹99
₹149
₹199

Some products should be free.

Do NOT use lorem ipsum.

==================================================
31. ADMIN DEMO

Create a safe development admin role mechanism.

Clearly document how the first admin user is created.

Never hardcode a production admin password.

==================================================
32. SECURITY

Follow secure development practices.

Protect against:

unauthorized access

insecure direct object references

exposing private files

client-side payment manipulation

invalid coupon manipulation

unauthorized admin access

unsafe database queries

XSS

CSRF where applicable

leaking environment variables

Never expose:

RAZORPAY_KEY_SECRET
service_role keys
database credentials

==================================================
33. PROJECT STRUCTURE

Keep code modular and maintainable.

Organize:

components/
pages/ or app/
lib/
services/
hooks/
types/
utils/
supabase/
api/
admin/
public/

Separate:

UI
business logic
database access
payment services
authentication
storage services

Do not put everything into one giant component.

==================================================
34. README

Create a detailed README.md containing:

Project overview
Features
Tech stack
Local setup
Environment variables
Supabase setup
Database setup
Storage bucket setup
RLS setup
Razorpay setup
Webhook setup
Admin setup
Development mode
Production deployment
GitHub setup

Include exact commands for:

npm install
npm run dev
npm run build
npm run lint

==================================================
35. GITHUB READY

Make the entire project ready to push to GitHub.

Create:

.gitignore
.env.example
README.md

Ensure:

.env
secrets
API keys
private credentials

are NOT committed.

Before finishing, check for:

TypeScript errors

build errors

broken imports

unused critical dependencies

missing environment variables

broken routes

responsive issues

authentication issues

==================================================
36. FINAL UX REQUIREMENT

The website should feel like a real premium commercial product, not a college project.

Think of the quality bar as:

Premium EdTech
+
Modern SaaS
+
Digital Marketplace
+
Creator Economy Platform

Every important interaction should feel polished.

Prioritize:

UI/UX quality

Security

Payment architecture

PDF access control

Admin experience

Performance

Mobile responsiveness

Maintainable code

Do not remove important functionality just to simplify the implementation.

If a real external credential is required, create the complete integration structure and clearly mark the exact environment variable/configuration that needs to be provided later.

Build the application now as a complete working system with realistic sample data and a polished production-grade interface.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://learn-with-surendra.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e678ba6a-c5b3-5b0f-8ee6-c0ed61938580).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
