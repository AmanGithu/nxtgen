import { prisma } from '../lib/prisma';
import {
  currencyForCountry,
  isSupportedCurrency,
  formatAmount,
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  type Currency,
} from '../lib/currency';
import { SELLABLE_TOOLS, skuKeyForPackage, skuKeyForTool, skuKeyForCourse, SKU_JOB_SUPPORT } from '../lib/skus';

/** A price as the client should render it. Both the raw minor amount and the
    formatted string, so the UI never has to know about minor units or symbols. */
export interface PricedItem {
  skuKey: string;
  currency: Currency;
  amountMinor: number;
  formatted: string;
  interval: string;
  taxBehavior: string;
}

const PLANS = ['BASIC', 'PRO', 'ENTERPRISE'] as const;

export class PricingService {
  /**
   * The full catalogue in one currency.
   *
   * One query for every price rather than one per SKU: the pricing page is the
   * highest-traffic authenticated-or-not endpoint we have, and it renders
   * roughly thirty prices.
   */
  async catalogue(country: string | null, currencyOverride?: string | null) {
    /* An explicit currency beats the country guess. Both are display-only —
       nothing here decides what is actually charged. */
    const currency: Currency = isSupportedCurrency(currencyOverride)
      ? (currencyOverride!.toUpperCase() as Currency)
      : currencyForCountry(country);

    const rows = await prisma.price.findMany({
      where: { currency, isActive: true },
    });

    const byKey = new Map(rows.map((r) => [r.skuKey, r]));

    const priced = (skuKey: string): PricedItem | null => {
      const row = byKey.get(skuKey);
      if (!row) return null;
      return {
        skuKey,
        currency,
        amountMinor: row.amountMinor,
        formatted: formatAmount(row.amountMinor, currency),
        interval: row.interval,
        taxBehavior: row.taxBehavior,
      };
    };

    const packages = PLANS.map((plan) => ({
      plan,
      price: priced(skuKeyForPackage(plan)),
    })).filter((p) => p.price);

    const tools = SELLABLE_TOOLS.map((t) => ({
      key: t.key,
      name: t.name,
      price: priced(skuKeyForTool(t.key)),
    })).filter((t) => t.price);

    /* Only batches a person could actually join are worth showing a price
       against: a DRAFT batch is not public, a full one cannot take another
       seat, and one that has already ended is not a product. */
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        slug: true,
        batches: {
          where: { isPublished: true, status: 'ACTIVE', endDate: { gt: new Date() } },
          select: { id: true, name: true, startDate: true, endDate: true, maxStudents: true, seatsTaken: true },
          orderBy: { startDate: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const pricedCourses = courses
      .map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        price: priced(skuKeyForCourse(c.id)),
        batches: c.batches.map((b) => ({
          id: b.id,
          name: b.name,
          startDate: b.startDate,
          endDate: b.endDate,
          seatsLeft: Math.max(0, b.maxStudents - b.seatsTaken),
        })),
      }))
      .filter((c) => c.price && c.batches.length > 0);

    return {
      country,
      currency,
      /* Tells the UI whether to say "showing prices for India" confidently or
         to present the switcher more prominently. */
      detected: !!country,
      currencies: SUPPORTED_CURRENCIES,
      defaultCurrency: DEFAULT_CURRENCY,
      packages,
      tools,
      jobSupport: priced(SKU_JOB_SUPPORT),
      courses: pricedCourses,
    };
  }

  /** Look up specific SKUs in one currency — used when building a checkout so
      the amount charged comes from the database, never from the client. */
  async resolve(skuKeys: string[], currency: Currency) {
    if (!skuKeys.length) return [];
    return prisma.price.findMany({
      where: { skuKey: { in: skuKeys }, currency, isActive: true },
    });
  }
}

export const pricingService = new PricingService();
