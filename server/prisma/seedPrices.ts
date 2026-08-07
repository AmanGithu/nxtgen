import { PrismaClient } from '@prisma/client';
import { SELLABLE_TOOLS, skuKeyForPackage, skuKeyForTool, skuKeyForCourse, SKU_JOB_SUPPORT } from '../src/lib/skus';

const prisma = new PrismaClient();

/**
 * Seeds the placeholder price list.
 *
 * Every number here is provisional — the team lead's instruction was to build
 * the gateway now and cost the product later, so these exist to make checkout
 * testable, not to be correct. They are seeded rather than hardcoded precisely
 * so that revising them later is an admin edit and not a release.
 *
 * Non-INR amounts are deliberate round numbers rather than conversions of the
 * rupee price. A live rate would quote A$12.37 today and A$12.51 tomorrow, and
 * a refund issued at a different rate than the charge leaves the books short.
 *
 * Re-runnable: upserts on the (skuKey, currency, interval) unique key, so it
 * will not duplicate rows or clobber an amount an admin has since changed
 * unless that row is listed here.
 */

type Row = Record<string, number>;

/** Major units per currency. Converted to minor units on write. */
const PACKAGE_PRICES: Record<string, Row> = {
  BASIC: { INR: 299, USD: 9, GBP: 8, EUR: 9, AUD: 14, CAD: 13, AED: 35, SGD: 13 },
  PRO: { INR: 499, USD: 19, GBP: 16, EUR: 18, AUD: 29, CAD: 26, AED: 70, SGD: 25 },
  ENTERPRISE: { INR: 999, USD: 39, GBP: 32, EUR: 36, AUD: 59, CAD: 53, AED: 145, SGD: 52 },
};

/** Same for every tool — the lead's instruction was a flat ₹200 per service. */
const TOOL_PRICE: Row = { INR: 200, USD: 6, GBP: 5, EUR: 6, AUD: 9, CAD: 8, AED: 22, SGD: 8 };

const JOB_SUPPORT_PRICE: Row = { INR: 1999, USD: 59, GBP: 49, EUR: 55, AUD: 89, CAD: 79, AED: 219, SGD: 79 };

/** Per course seat. One-time, not recurring — a batch is bought once. */
const COURSE_PRICE: Row = { INR: 10000, USD: 299, GBP: 249, EUR: 279, AUD: 449, CAD: 399, AED: 1099, SGD: 399 };

async function upsertRow(
  skuKey: string,
  skuType: 'PACKAGE' | 'TOOL' | 'BATCH' | 'JOB_SUPPORT',
  currency: string,
  major: number,
  interval: 'MONTH' | 'ONE_TIME'
) {
  const amountMinor = Math.round(major * 100);
  await prisma.price.upsert({
    where: { skuKey_currency_interval: { skuKey, currency, interval } },
    update: { amountMinor, skuType, isActive: true },
    create: { skuKey, skuType, currency, amountMinor, interval, taxBehavior: 'INCLUSIVE', isActive: true },
  });
}

async function seedPrices() {
  let count = 0;

  for (const [plan, prices] of Object.entries(PACKAGE_PRICES)) {
    for (const [currency, major] of Object.entries(prices)) {
      await upsertRow(skuKeyForPackage(plan), 'PACKAGE', currency, major, 'MONTH');
      count++;
    }
  }

  for (const tool of SELLABLE_TOOLS) {
    for (const [currency, major] of Object.entries(TOOL_PRICE)) {
      await upsertRow(skuKeyForTool(tool.key), 'TOOL', currency, major, 'MONTH');
      count++;
    }
  }

  for (const [currency, major] of Object.entries(JOB_SUPPORT_PRICE)) {
    await upsertRow(SKU_JOB_SUPPORT, 'JOB_SUPPORT', currency, major, 'MONTH');
    count++;
  }

  /* Courses are priced per course, and a purchase buys a seat in one of its
     batches. Seeding every existing course keeps the catalogue complete
     without an admin having to fill each one in by hand first. */
  const courses = await prisma.course.findMany({ select: { id: true, title: true } });
  for (const course of courses) {
    for (const [currency, major] of Object.entries(COURSE_PRICE)) {
      await upsertRow(skuKeyForCourse(course.id), 'BATCH', currency, major, 'ONE_TIME');
      count++;
    }
  }

  console.log(`✅ Seeded ${count} price rows across ${courses.length} course(s).`);
  console.log('   All amounts are placeholders pending real costing.');
}

seedPrices()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
