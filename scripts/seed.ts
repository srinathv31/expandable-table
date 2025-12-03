import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "postgres",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

// Types
type LetterStatus = "not_sent" | "shipped" | "delivered" | "returned";

interface AccountLetterData {
  letterId: number;
  daysAgo: number;
  status: LetterStatus;
}

interface AccountScenario {
  name: string;
  count: number;
  generator: () => AccountLetterData[];
}

// Letter IDs (matching the order they're inserted)
const LETTERS = {
  WELCOME: 1,
  STATEMENT: 2,
  POLICY_UPDATE: 3,
  RENEWAL: 4,
  TAX_1099: 5,
  RATE_CHANGE: 6,
  PRIVACY_UPDATE: 7,
  PROMO_OFFER: 8,
  CLOSURE_CONFIRM: 9,
  BENEFICIARY_FORM: 10,
};

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgoDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Pick random letters excluding specific ones
function pickRandomLetters(count: number, exclude: number[] = []): number[] {
  const available = Object.values(LETTERS).filter(
    (id) => !exclude.includes(id)
  );
  const result: number[] = [];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = randomInt(0, available.length - 1);
    result.push(available[idx]);
    available.splice(idx, 1);
  }
  return result;
}

// Scenario generators
const scenarios: AccountScenario[] = [
  // Brand New - Pending Welcome: Just signed up, welcome kit not sent yet (3 accounts)
  {
    name: "Brand New - Pending Welcome",
    count: 3,
    generator: () => [
      {
        letterId: LETTERS.WELCOME,
        daysAgo: 0,
        status: "not_sent" as LetterStatus,
      },
    ],
  },

  // New - Welcome In Transit: Welcome kit shipped but not delivered (4 accounts)
  {
    name: "New - Welcome In Transit",
    count: 4,
    generator: () => [
      {
        letterId: LETTERS.WELCOME,
        daysAgo: randomInt(1, 4),
        status: "shipped" as LetterStatus,
      },
    ],
  },

  // New - Welcome Only: Just received Welcome Kit (5 accounts)
  {
    name: "New - Welcome Only",
    count: 5,
    generator: () => [
      {
        letterId: LETTERS.WELCOME,
        daysAgo: randomInt(5, 14),
        status: "delivered" as LetterStatus,
      },
    ],
  },

  // New - Two Letters: Welcome Kit + one other (6 accounts)
  {
    name: "New - Two Letters",
    count: 6,
    generator: () => {
      const welcomeDays = randomInt(14, 30);
      const secondLetter = pickRandomLetters(1, [LETTERS.WELCOME])[0];
      const secondDays = randomInt(0, 5);
      // Recent letters have varied statuses
      let secondStatus: LetterStatus;
      if (secondDays === 0) {
        secondStatus = "not_sent";
      } else if (secondDays < 3) {
        secondStatus = "shipped";
      } else {
        secondStatus = "delivered";
      }

      return [
        {
          letterId: LETTERS.WELCOME,
          daysAgo: welcomeDays,
          status: "delivered",
        },
        {
          letterId: secondLetter,
          daysAgo: secondDays,
          status: secondStatus,
        },
      ];
    },
  },

  // Welcome Kit Retry: First Welcome returned, second delivered (2 accounts)
  {
    name: "Welcome Kit Retry",
    count: 2,
    generator: () => [
      {
        letterId: LETTERS.WELCOME,
        daysAgo: randomInt(25, 35),
        status: "returned" as LetterStatus,
      },
      {
        letterId: LETTERS.WELCOME,
        daysAgo: randomInt(10, 20),
        status: "delivered" as LetterStatus,
      },
    ],
  },

  // Active - Recent Mail Pending: Has history, new letter not sent yet (3 accounts)
  {
    name: "Active - Recent Mail Pending",
    count: 3,
    generator: () => {
      const letters: AccountLetterData[] = [];

      // Welcome Kit delivered months ago
      letters.push({
        letterId: LETTERS.WELCOME,
        daysAgo: randomInt(60, 120),
        status: "delivered",
      });

      // A delivered statement
      letters.push({
        letterId: LETTERS.STATEMENT,
        daysAgo: randomInt(20, 50),
        status: "delivered",
      });

      // New letter pending
      const pendingLetter = pickRandomLetters(1, [
        LETTERS.WELCOME,
        LETTERS.STATEMENT,
      ])[0];
      letters.push({
        letterId: pendingLetter,
        daysAgo: 0,
        status: "not_sent",
      });

      return letters.sort((a, b) => b.daysAgo - a.daysAgo);
    },
  },

  // Active - Letter In Transit: Has history, recent letter shipped (4 accounts)
  {
    name: "Active - Letter In Transit",
    count: 4,
    generator: () => {
      const letters: AccountLetterData[] = [];

      // Welcome Kit delivered months ago
      letters.push({
        letterId: LETTERS.WELCOME,
        daysAgo: randomInt(90, 150),
        status: "delivered",
      });

      // Some delivered letters
      letters.push({
        letterId: LETTERS.STATEMENT,
        daysAgo: randomInt(30, 60),
        status: "delivered",
      });

      // Recent letter in transit
      const shippedLetter = pickRandomLetters(1, [
        LETTERS.WELCOME,
        LETTERS.STATEMENT,
      ])[0];
      letters.push({
        letterId: shippedLetter,
        daysAgo: randomInt(1, 4),
        status: "shipped",
      });

      return letters.sort((a, b) => b.daysAgo - a.daysAgo);
    },
  },

  // Active Standard: Normal progression with 3-5 letters (8 accounts)
  {
    name: "Active Standard",
    count: 8,
    generator: () => {
      const letterCount = randomInt(3, 5);
      const letters: AccountLetterData[] = [];

      // Always start with Welcome Kit (3-6 months ago)
      letters.push({
        letterId: LETTERS.WELCOME,
        daysAgo: randomInt(90, 180),
        status: "delivered",
      });

      // Add statements and other letters spread over time
      const otherLetters = pickRandomLetters(letterCount - 1, [
        LETTERS.WELCOME,
      ]);

      for (let i = 0; i < otherLetters.length; i++) {
        const daysAgo = randomInt(7, 90 - i * 15);
        letters.push({
          letterId: otherLetters[i],
          daysAgo,
          status: "delivered",
        });
      }

      return letters.sort((a, b) => b.daysAgo - a.daysAgo);
    },
  },

  // Established Standard: Long history with 5-10 letters (6 accounts)
  {
    name: "Established Standard",
    count: 6,
    generator: () => {
      const letterCount = randomInt(5, 10);
      const letters: AccountLetterData[] = [];

      // Welcome Kit from 6-12 months ago
      letters.push({
        letterId: LETTERS.WELCOME,
        daysAgo: randomInt(180, 365),
        status: "delivered",
      });

      // Multiple statements (can repeat)
      const statementCount = randomInt(2, 4);
      for (let i = 0; i < statementCount; i++) {
        letters.push({
          letterId: LETTERS.STATEMENT,
          daysAgo: randomInt(30, 150) + i * 30,
          status: "delivered",
        });
      }

      // Fill remaining with various letter types
      const remaining = letterCount - 1 - statementCount;
      const otherLetters = pickRandomLetters(remaining, [
        LETTERS.WELCOME,
        LETTERS.STATEMENT,
      ]);

      for (const letterId of otherLetters) {
        const daysAgo = randomInt(14, 300);
        letters.push({ letterId, daysAgo, status: "delivered" });
      }

      return letters.sort((a, b) => b.daysAgo - a.daysAgo);
    },
  },

  // Went Paperless: Has statements but none in last 3 months (2 accounts)
  {
    name: "Went Paperless",
    count: 2,
    generator: () => {
      const letters: AccountLetterData[] = [];

      // Welcome Kit from 8-10 months ago
      letters.push({
        letterId: LETTERS.WELCOME,
        daysAgo: randomInt(240, 300),
        status: "delivered",
      });

      // Multiple statements, but all older than 90 days
      for (let i = 0; i < randomInt(3, 5); i++) {
        letters.push({
          letterId: LETTERS.STATEMENT,
          daysAgo: randomInt(95, 200) + i * 25,
          status: "delivered",
        });
      }

      // Maybe one other letter type
      if (Math.random() > 0.5) {
        const otherLetter = pickRandomLetters(1, [
          LETTERS.WELCOME,
          LETTERS.STATEMENT,
        ])[0];
        letters.push({
          letterId: otherLetter,
          daysAgo: randomInt(100, 180),
          status: "delivered",
        });
      }

      return letters.sort((a, b) => b.daysAgo - a.daysAgo);
    },
  },

  // Promo Not Received: Promotional Offer marked as returned (2 accounts)
  {
    name: "Promo Not Received",
    count: 2,
    generator: () => {
      const letters: AccountLetterData[] = [];

      // Welcome Kit delivered
      letters.push({
        letterId: LETTERS.WELCOME,
        daysAgo: randomInt(120, 200),
        status: "delivered",
      });

      // A couple of statements delivered
      letters.push({
        letterId: LETTERS.STATEMENT,
        daysAgo: randomInt(60, 100),
        status: "delivered",
      });
      letters.push({
        letterId: LETTERS.STATEMENT,
        daysAgo: randomInt(20, 50),
        status: "delivered",
      });

      // Promotional Offer returned
      letters.push({
        letterId: LETTERS.PROMO_OFFER,
        daysAgo: randomInt(10, 30),
        status: "returned",
      });

      return letters.sort((a, b) => b.daysAgo - a.daysAgo);
    },
  },

  // Letter Stuck in Transit: Shipped but way past ETA (2 accounts)
  {
    name: "Letter stuck in transit",
    count: 2,
    generator: () => {
      const letters: AccountLetterData[] = [];

      // Welcome Kit delivered months ago
      letters.push({
        letterId: LETTERS.WELCOME,
        daysAgo: randomInt(90, 150),
        status: "delivered",
      });

      // A letter shipped 30+ days ago (ETA is mailed_at + 5, so 25+ days overdue)
      const stuckLetter = pickRandomLetters(1, [LETTERS.WELCOME])[0];
      letters.push({
        letterId: stuckLetter,
        daysAgo: randomInt(30, 45), // 25-40 days past the 5-day ETA
        status: "shipped",
      });

      return letters.sort((a, b) => b.daysAgo - a.daysAgo);
    },
  },
];

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

  // Seed account letters using scenarios
  console.log("📮 Seeding account letters by scenario...");
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

  let accountIndex = 0;
  let totalAccountLetters = 0;
  const scenarioCounts: Record<string, number> = {};

  for (const scenario of scenarios) {
    console.log(`   Creating ${scenario.count} "${scenario.name}" accounts...`);
    scenarioCounts[scenario.name] = scenario.count;

    for (let i = 0; i < scenario.count; i++) {
      const accountId = `ACC-${String(100000 + accountIndex).slice(1)}`;
      const address = addresses[accountIndex % addresses.length];
      const accountLetters = scenario.generator();

      for (const letter of accountLetters) {
        const mailedAt = daysAgoDate(letter.daysAgo);
        const eta = new Date(mailedAt);
        eta.setDate(eta.getDate() + 5);

        await pool.query(
          `INSERT INTO account_letters (account_id, letter_id, address, mailed_at, eta, status) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            accountId,
            letter.letterId,
            address,
            letter.status === "not_sent" ? null : mailedAt,
            letter.status === "not_sent" ? null : eta,
            letter.status,
          ]
        );
        totalAccountLetters++;
      }

      accountIndex++;
    }
  }
  console.log(`✅ Seeded ${totalAccountLetters} account letters\n`);

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

  const returnedTrackingStatuses = [
    {
      status: "received",
      locations: [
        "Processing Center - Dallas, TX",
        "Regional Hub - Atlanta, GA",
      ],
    },
    {
      status: "processing",
      locations: [
        "Sort Facility - Dallas, TX",
        "Distribution Center - Houston, TX",
      ],
    },
    {
      status: "in_transit",
      locations: ["In transit to local facility", "En route to destination"],
    },
    {
      status: "returned_to_sender",
      locations: [
        "Returned - Address not found",
        "Returned - Recipient moved",
        "Returned - Undeliverable as addressed",
      ],
    },
  ];

  let trackingCount = 0;

  // Get account letters with their status (exclude not_sent)
  const accountLettersResult = await pool.query(
    "SELECT id, status, mailed_at FROM account_letters WHERE status != 'not_sent'"
  );

  for (const accountLetter of accountLettersResult.rows) {
    let eventDate = new Date(accountLetter.mailed_at);
    let events: typeof trackingStatuses;

    if (accountLetter.status === "returned") {
      // Returned letters have a different tracking path
      events = returnedTrackingStatuses;
    } else if (accountLetter.status === "delivered") {
      // Delivered letters have full tracking
      events = trackingStatuses;
    } else {
      // Shipped letters have partial tracking (1-3 events)
      const numEvents = randomInt(1, 3);
      events = trackingStatuses.slice(0, numEvents);
    }

    for (const trackingInfo of events) {
      const location = randomElement(trackingInfo.locations);

      // Add some hours between events
      eventDate = new Date(eventDate);
      eventDate.setHours(eventDate.getHours() + randomInt(4, 28));

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
  const uniqueAccountsCount = await pool.query(
    "SELECT COUNT(DISTINCT account_id) FROM account_letters"
  );
  const statusCounts = await pool.query(
    "SELECT status, COUNT(*) as count FROM account_letters GROUP BY status ORDER BY status"
  );

  console.log("\n📊 Summary:");
  console.log(`   Letter Types: ${letterCount.rows[0].count}`);
  console.log(`   Unique Accounts: ${uniqueAccountsCount.rows[0].count}`);
  console.log(`   Total Account Letters: ${accountLetterCount.rows[0].count}`);
  console.log(`   Tracking Events: ${trackingEventCount.rows[0].count}`);

  console.log("\n📬 Status Distribution:");
  for (const row of statusCounts.rows) {
    console.log(`   ${row.status}: ${row.count}`);
  }

  console.log("\n📈 Scenario Breakdown:");
  for (const [name, count] of Object.entries(scenarioCounts)) {
    console.log(`   ${name}: ${count} accounts`);
  }

  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
