import { PrismaClient, TradeMode, PaymentStatus, DeliveryStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { deriveStatus } from "../lib/transaction-status";

// Seed a demo workspace with commodities and sample trades so the dashboard and reports show
// real data on first boot. Repeatable: it clears the demo tenant by slug, then recreates it.
const prisma = new PrismaClient();

const SLUG = "ace-commodities";

async function main() {
  await prisma.tenant.deleteMany({ where: { slug: { in: [SLUG, "highland-feeds"] } } });
  // Clear demo and operator accounts from a previous seed so reseeding is repeatable.
  await prisma.user.deleteMany({ where: { email: { in: ["demo@acme.test", "admin@ace.test"] } } });

  const tenant = await prisma.tenant.create({
    data: {
      name: "Ace Commodities",
      slug: SLUG,
      legalName: "Ace Commodities Ltd",
      currency: "GHS",
      address: "Tamale, Northern Region, Ghana",
    },
  });

  await prisma.user.create({
    data: {
      email: "demo@acme.test",
      name: "Kwame Asante",
      role: "ADMIN",
      tenantId: tenant.id,
      passwordHash: await bcrypt.hash("password123", 10),
    },
  });

  async function makeCommodity(name: string, grades: string[], quality: [string, string, number][]) {
    return prisma.commodity.create({
      data: {
        tenantId: tenant.id,
        name,
        baseUnit: "kg",
        units: ["kg", "bag", "MT"],
        grades: { create: grades.map((g, i) => ({ tenantId: tenant.id, name: g, order: i })) },
        qualityParams: {
          create: quality.map(([qn, unit, max], i) => ({
            tenantId: tenant.id,
            name: qn,
            unit,
            maxAcceptable: max,
            order: i,
          })),
        },
      },
    });
  }

  const maize = await makeCommodity("Maize", ["Grade A", "Grade B"], [["Moisture", "%", 13.5], ["Foreign matter", "%", 2]]);
  const cocoa = await makeCommodity("Cocoa", ["Main crop", "Light crop"], [["Moisture", "%", 7.5]]);
  const cashew = await makeCommodity("Cashew", ["Grade A", "Grade B"], [["Out-turn", "lbs", 48]]);
  const soybean = await makeCommodity("Soybean", ["Grade 1", "Grade 2"], [["Moisture", "%", 12]]);

  // tradeDate uses fixed dates around the seed reference month so month to date figures populate.
  const d = (iso: string) => new Date(iso);

  type Sample = {
    ref: string;
    mode: TradeMode;
    commodityId: string;
    commodityName: string;
    grade: string;
    qty: number;
    counterparty: string;
    date: Date;
    buyPrice?: number;
    sellPrice?: number;
    capitalSource?: string;
    commission?: number;
    payment: PaymentStatus;
    delivery: DeliveryStatus;
  };

  const samples: Sample[] = [
    {
      ref: "TXN-2026-0312",
      mode: TradeMode.OWNER,
      commodityId: maize.id,
      commodityName: "Maize",
      grade: "Grade A",
      qty: 85,
      counterparty: "Accra Grain Mills Ltd",
      date: d("2026-06-12"),
      buyPrice: 6000,
      sellPrice: 7200,
      capitalSource: "Own funds",
      payment: PaymentStatus.PARTIAL,
      delivery: DeliveryStatus.IN_TRANSIT,
    },
    {
      ref: "TXN-2026-0301",
      mode: TradeMode.OWNER,
      commodityId: cashew.id,
      commodityName: "Cashew",
      grade: "Grade A",
      qty: 120,
      counterparty: "Tamale Cashew Co-op",
      date: d("2026-06-08"),
      buyPrice: 8000,
      sellPrice: 9150,
      capitalSource: "Bank loan",
      payment: PaymentStatus.PARTIAL,
      delivery: DeliveryStatus.IN_TRANSIT,
    },
    {
      ref: "TXN-2026-0309",
      mode: TradeMode.BROKER,
      commodityId: cocoa.id,
      commodityName: "Cocoa",
      grade: "Main crop",
      qty: 40,
      counterparty: "Kumasi Cocoa Buyers",
      date: d("2026-06-15"),
      commission: 18250,
      payment: PaymentStatus.UNPAID,
      delivery: DeliveryStatus.PENDING,
    },
    {
      ref: "TXN-2026-0294",
      mode: TradeMode.OWNER,
      commodityId: soybean.id,
      commodityName: "Soybean",
      grade: "Grade 1",
      qty: 60,
      counterparty: "Northern Feeds Ltd",
      date: d("2026-06-02"),
      buyPrice: 4800,
      sellPrice: 5400,
      capitalSource: "Own funds",
      payment: PaymentStatus.PAID,
      delivery: DeliveryStatus.DELIVERED,
    },
    {
      ref: "TXN-2026-0288",
      mode: TradeMode.BROKER,
      commodityId: maize.id,
      commodityName: "Maize",
      grade: "Grade B",
      qty: 200,
      counterparty: "Coastal Mills Ltd",
      date: d("2026-06-05"),
      commission: 17000,
      payment: PaymentStatus.PAID,
      delivery: DeliveryStatus.DELIVERED,
    },
    {
      ref: "TXN-2026-0277",
      mode: TradeMode.OWNER,
      commodityId: cocoa.id,
      commodityName: "Cocoa",
      grade: "Main crop",
      qty: 25,
      counterparty: "Takoradi Export Co",
      date: d("2026-05-26"),
      buyPrice: 22000,
      sellPrice: 24100,
      capitalSource: "Own funds",
      payment: PaymentStatus.PAID,
      delivery: DeliveryStatus.DELIVERED,
    },
  ];

  for (const s of samples) {
    await prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        reference: s.ref,
        mode: s.mode,
        commodityId: s.commodityId,
        commodityName: s.commodityName,
        grade: s.grade,
        quantity: s.qty,
        unit: "MT",
        counterparty: s.counterparty,
        tradeDate: s.date,
        buyPrice: s.buyPrice ?? null,
        sellPrice: s.sellPrice ?? null,
        capitalSource: s.capitalSource ?? null,
        commission: s.commission ?? null,
        paymentStatus: s.payment,
        deliveryStatus: s.delivery,
        statusOverride: null,
        status: deriveStatus(s.payment, s.delivery, null),
      },
    });
  }

  // Platform operator (super admin), belongs to no tenant.
  await prisma.user.create({
    data: {
      email: "admin@ace.test",
      name: "Platform Operator",
      isPlatformAdmin: true,
      passwordHash: await bcrypt.hash("password123", 10),
    },
  });

  // Clients and farmers.
  await prisma.counterparty.createMany({
    data: [
      { tenantId: tenant.id, type: "CLIENT", name: "Accra Grain Mills Ltd", phone: "024 000 1111", location: "Accra" },
      { tenantId: tenant.id, type: "CLIENT", name: "Tamale Cashew Co-op", location: "Tamale" },
      { tenantId: tenant.id, type: "FARMER", name: "Kofi Mensah", location: "Yendi" },
      { tenantId: tenant.id, type: "FARMER", name: "Abena Owusu", location: "Savelugu" },
    ],
  });

  // A couple of lots in stock so the stock and logistics screens have data.
  await prisma.inventoryLot.createMany({
    data: [
      { tenantId: tenant.id, reference: "LOT-2026-0001", commodityName: "Maize", grade: "Grade A", location: "Tamale warehouse", unit: "kg", netWeight: 40000, remainingWeight: 40000, costPerUnit: 6, totalCost: 240000, farmerName: "Kofi Mensah" },
      { tenantId: tenant.id, reference: "LOT-2026-0002", commodityName: "Soybean", grade: "Grade 1", location: "Tamale warehouse", unit: "kg", netWeight: 25000, remainingWeight: 25000, costPerUnit: 4.8, totalCost: 120000, farmerName: "Abena Owusu" },
    ],
  });

  // A lead in the pipeline.
  await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      clientName: "Coastal Mills Ltd",
      commodityName: "Maize",
      source: "WHATSAPP",
      stage: "NEGOTIATING",
      estimatedValue: 350000,
      message: "Wants 50 MT Grade A maize delivered to Accra in July.",
    },
  });

  // A second workspace so the marketplace board shows another trader.
  const highland = await prisma.tenant.create({
    data: { name: "Highland Feeds", slug: "highland-feeds", currency: "GHS", address: "Kumasi" },
  });
  await prisma.user.create({
    data: {
      email: "highland@ace.test",
      name: "Highland Buyer",
      role: "ADMIN",
      tenantId: highland.id,
      passwordHash: await bcrypt.hash("password123", 10),
    },
  });
  await prisma.marketplaceListing.createMany({
    data: [
      { tenantId: highland.id, ownerName: "Highland Feeds", type: "BUY", commodityName: "Soybean", grade: "Grade 1", quantity: 30, unit: "MT", price: 5350, region: "Kumasi", note: "Need feed-grade soybean" },
      { tenantId: tenant.id, ownerName: "Ace Commodities", type: "SELL", commodityName: "Maize", grade: "Grade A", quantity: 50, unit: "MT", price: 7100, region: "Tamale", note: "Fresh harvest, dried to 13.5 percent" },
    ],
  });

  console.log("Seeded Ace Commodities, Highland Feeds, and the operator account.");
  console.log("Trader login:   demo@acme.test / password123");
  console.log("Operator login: admin@ace.test / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
