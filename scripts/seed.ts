import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "postgres",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

async function seed() {
  console.log("🌱 Starting database seed...\n");

  // Create tables
  console.log("📋 Creating tables...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS letters (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      business_unit VARCHAR(100),
      created_by VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS account_letters (
      id SERIAL PRIMARY KEY,
      account_id VARCHAR(50) NOT NULL,
      letter_id INTEGER REFERENCES letters(id),
      address TEXT,
      mailed_at TIMESTAMP,
      eta TIMESTAMP,
      status VARCHAR(50) DEFAULT 'not_sent',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tracking_events (
      id SERIAL PRIMARY KEY,
      account_letter_id INTEGER REFERENCES account_letters(id) ON DELETE CASCADE,
      status VARCHAR(100) NOT NULL,
      location VARCHAR(255),
      occurred_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("✅ Tables created\n");

  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await pool.query(
    "TRUNCATE tracking_events, account_letters, letters RESTART IDENTITY CASCADE"
  );
  console.log("✅ Data cleared\n");

  // Seed letters
  console.log("📝 Seeding letters...");
  const letters = [
    {
      name: "Welcome Letter",
      description: "Initial welcome package for new customers",
      category: "Onboarding",
      business_unit: "Customer Success",
      created_by: "john.doe@company.com",
    },
    {
      name: "Account Statement",
      description: "Monthly account statement with transaction history",
      category: "Financial",
      business_unit: "Finance",
      created_by: "jane.smith@company.com",
    },
    {
      name: "Policy Update Notice",
      description: "Notification about policy changes",
      category: "Compliance",
      business_unit: "Legal",
      created_by: "legal@company.com",
    },
    {
      name: "Renewal Reminder",
      description: "Annual renewal reminder for subscriptions",
      category: "Marketing",
      business_unit: "Sales",
      created_by: "sales@company.com",
    },
    {
      name: "Tax Document 1099",
      description: "Annual tax document for investment accounts",
      category: "Tax",
      business_unit: "Finance",
      created_by: "tax@company.com",
    },
    {
      name: "Rate Change Notice",
      description: "Notification of interest rate changes",
      category: "Financial",
      business_unit: "Finance",
      created_by: "rates@company.com",
    },
    {
      name: "Privacy Policy Update",
      description: "Updated privacy policy notification",
      category: "Compliance",
      business_unit: "Legal",
      created_by: "privacy@company.com",
    },
    {
      name: "Promotional Offer",
      description: "Special promotional offer for loyal customers",
      category: "Marketing",
      business_unit: "Marketing",
      created_by: "marketing@company.com",
    },
    {
      name: "Account Closure Confirmation",
      description: "Confirmation of account closure request",
      category: "Service",
      business_unit: "Operations",
      created_by: "ops@company.com",
    },
    {
      name: "Beneficiary Update Form",
      description: "Form to update account beneficiaries",
      category: "Service",
      business_unit: "Operations",
      created_by: "ops@company.com",
    },
  ];

  for (const letter of letters) {
    await pool.query(
      `INSERT INTO letters (name, description, category, business_unit, created_by) VALUES ($1, $2, $3, $4, $5)`,
      [
        letter.name,
        letter.description,
        letter.category,
        letter.business_unit,
        letter.created_by,
      ]
    );
  }
  console.log(`✅ Seeded ${letters.length} letters\n`);

  // Seed account letters
  console.log("📮 Seeding account letters...");
  const addresses = [
    "123 Main St, New York, NY 10001",
    "456 Oak Ave, Los Angeles, CA 90001",
    "789 Pine Rd, Chicago, IL 60601",
    "321 Elm St, Houston, TX 77001",
    "654 Maple Dr, Phoenix, AZ 85001",
    "987 Cedar Ln, Philadelphia, PA 19101",
    "147 Birch Way, San Antonio, TX 78201",
    "258 Walnut Blvd, San Diego, CA 92101",
    "369 Spruce Ct, Dallas, TX 75201",
    "741 Ash St, San Jose, CA 95101",
  ];

  const statuses = ["not_sent", "shipped", "delivered"];
  const accountLetterIds: number[] = [];

  for (let i = 0; i < 50; i++) {
    const accountId = `ACC-${String(100000 + i).slice(1)}`;
    const letterId = (i % 10) + 1;
    const address = addresses[i % addresses.length];
    const status = statuses[Math.floor(Math.random() * 3)];

    // Set dates based on status
    let mailedAt = null;
    let eta = null;

    if (status === "shipped" || status === "delivered") {
      const daysAgo = Math.floor(Math.random() * 14) + 1;
      mailedAt = new Date();
      mailedAt.setDate(mailedAt.getDate() - daysAgo);

      eta = new Date(mailedAt);
      eta.setDate(eta.getDate() + 5);
    }

    const result = await pool.query(
      `INSERT INTO account_letters (account_id, letter_id, address, mailed_at, eta, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [accountId, letterId, address, mailedAt, eta, status]
    );
    accountLetterIds.push(result.rows[0].id);
  }
  console.log(`✅ Seeded ${accountLetterIds.length} account letters\n`);

  // Seed tracking events
  console.log("📍 Seeding tracking events...");
  const trackingStatuses = [
    {
      status: "received",
      locations: [
        "Processing Center - Dallas, TX",
        "Regional Hub - Atlanta, GA",
        "Main Facility - Memphis, TN",
      ],
    },
    {
      status: "processing",
      locations: [
        "Sort Facility - Dallas, TX",
        "Distribution Center - Houston, TX",
        "Mail Processing Center",
      ],
    },
    {
      status: "in_transit",
      locations: [
        "In transit to local facility",
        "En route to destination",
        "Departed regional facility",
      ],
    },
    {
      status: "out_for_delivery",
      locations: [
        "Out for delivery - Local Post Office",
        "With carrier for delivery",
        "Final delivery in progress",
      ],
    },
    {
      status: "delivered",
      locations: [
        "Delivered - Front Door",
        "Delivered - Mailbox",
        "Delivered - Recipient",
      ],
    },
  ];

  let trackingCount = 0;

  // Get account letters with their status
  const accountLettersResult = await pool.query(
    "SELECT id, status, mailed_at FROM account_letters WHERE status != 'not_sent'"
  );

  for (const accountLetter of accountLettersResult.rows) {
    const numEvents =
      accountLetter.status === "delivered"
        ? 5
        : Math.floor(Math.random() * 4) + 1;
    let eventDate = new Date(accountLetter.mailed_at);

    for (let i = 0; i < numEvents; i++) {
      const trackingInfo = trackingStatuses[i];
      const location =
        trackingInfo.locations[
          Math.floor(Math.random() * trackingInfo.locations.length)
        ];

      // Add some hours between events
      eventDate = new Date(eventDate);
      eventDate.setHours(
        eventDate.getHours() + Math.floor(Math.random() * 24) + 4
      );

      await pool.query(
        `INSERT INTO tracking_events (account_letter_id, status, location, occurred_at) VALUES ($1, $2, $3, $4)`,
        [accountLetter.id, trackingInfo.status, location, eventDate]
      );
      trackingCount++;
    }
  }
  console.log(`✅ Seeded ${trackingCount} tracking events\n`);

  console.log("🎉 Database seeding complete!");

  // Print summary
  const letterCount = await pool.query("SELECT COUNT(*) FROM letters");
  const accountLetterCount = await pool.query(
    "SELECT COUNT(*) FROM account_letters"
  );
  const trackingEventCount = await pool.query(
    "SELECT COUNT(*) FROM tracking_events"
  );

  console.log("\n📊 Summary:");
  console.log(`   Letters: ${letterCount.rows[0].count}`);
  console.log(`   Account Letters: ${accountLetterCount.rows[0].count}`);
  console.log(`   Tracking Events: ${trackingEventCount.rows[0].count}`);

  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
