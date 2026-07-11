import { Pool } from 'pg';

let pool: Pool | null = null;
let initialized = false;

function getPool() {
  if (!pool) {
    // Connect to postgres running inside docker (or localhost if running locally)
    const connectionString = process.env.DATABASE_URL || 'postgresql://evolution:evolutionpass@localhost:5432/evolution';
    pool = new Pool({
      connectionString,
    });
  }
  return pool;
}

export async function getDb() {
  const p = getPool();
  await initializeDb(p);
  
  return {
    get: async (sql: string, params: any[] = []) => {
      const translated = translateQuery(sql);
      const res = await p.query(translated, params);
      return res.rows[0];
    },
    all: async (sql: string, params: any[] = []) => {
      const translated = translateQuery(sql);
      const res = await p.query(translated, params);
      return res.rows;
    },
    run: async (sql: string, params: any[] = []) => {
      let queryToRun = sql;
      const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
      if (isInsert && !sql.toUpperCase().includes('RETURNING')) {
        queryToRun = sql + ' RETURNING id';
      }
      
      const translated = translateQuery(queryToRun);
      const res = await p.query(translated, params);
      
      return {
        lastID: isInsert && res.rows[0] ? res.rows[0].id : null,
        changes: res.rowCount || 0,
      };
    },
    exec: async (sql: string) => {
      await p.query(sql);
    },
    prepare: async (sql: string) => {
      return {
        run: async (...params: any[]) => {
          let queryToRun = sql;
          const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
          if (isInsert && !sql.toUpperCase().includes('RETURNING')) {
            queryToRun = sql + ' RETURNING id';
          }
          const translated = translateQuery(queryToRun);
          await p.query(translated, params);
        },
        finalize: async () => {}
      };
    }
  };
}

function translateQuery(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

async function initializeDb(p: Pool) {
  if (initialized) return;

  // Create tables using PG syntax
  await p.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT,
      available INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      author TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      date TEXT NOT NULL,
      approved INTEGER DEFAULT 0
    );

    -- Migration to add approved column if the table already existed
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='reviews' AND column_name='approved'
      ) THEN
        ALTER TABLE reviews ADD COLUMN approved INTEGER DEFAULT 0;
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      guests INTEGER NOT NULL,
      occasion TEXT,
      special_requests TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS delivery_boys (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      last_assigned_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      special_notes TEXT,
      order_items TEXT NOT NULL,
      total_amount DOUBLE PRECISION NOT NULL,
      utr_number TEXT DEFAULT '',
      phonepe_txn_id TEXT DEFAULT '',
      payment_status TEXT DEFAULT 'pending_payment',
      status TEXT DEFAULT 'pending_payment',
      delivery_boy_id INTEGER REFERENCES delivery_boys(id) ON DELETE SET NULL,
      rejected_riders TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed delivery boys if empty
  const driverCount = await p.query('SELECT COUNT(*) as count FROM delivery_boys');
  if (parseInt(driverCount.rows[0].count, 10) === 0) {
    const seedDrivers = [
      { name: 'Amit Kumar', phone: '7303059402', status: 'available' },
      { name: 'Suresh Singh', phone: '7303059402', status: 'available' },
      { name: 'Sonu Sharma', phone: '7303059402', status: 'available' },
      { name: 'Rahul Verma', phone: '7303059402', status: 'available' },
      { name: 'Rohit Gupta', phone: '7303059402', status: 'available' },
      { name: 'Dummy Rider', phone: '7303059402', status: 'available' }
    ];
    for (const driver of seedDrivers) {
      await p.query(
        'INSERT INTO delivery_boys (name, phone, status) VALUES ($1, $2, $3)',
        [driver.name, driver.phone, driver.status]
      );
    }
  }

  // Seed Menu Items for The Great Kabab Factory if empty
  const menuCount = await p.query('SELECT COUNT(*) as count FROM menu_items');
  if (parseInt(menuCount.rows[0].count, 10) === 0) {
    const seedMenu = [
      {
        name: 'TGKF Classical Salad',
        description: 'Fresh garden greens, cucumber, carrots, tomatoes, and red onions with a touch of lime juice and chaat masala.',
        price: 350.00,
        category: 'Salad',
        image_url: '/images/classical-salad.png'
      },
      {
        name: 'Galouti Kabab',
        description: 'Legendary melt-in-the-mouth minced lamb patties seasoned with over 150 spices, smoked and cooked on a mahi-tawa.',
        price: 890.00,
        category: 'Starter - Non-Vegetarian',
        image_url: '/images/galouti-kabab.png'
      },
      {
        name: 'Changezi Tangdi',
        description: 'Tandoor cooked chicken drumsticks marinated in a rich, creamy, and spicy orange Lucknowi marinade.',
        price: 790.00,
        category: 'Starter - Non-Vegetarian',
        image_url: '/images/changezi-tangdi.png'
      },
      {
        name: 'Ajwaini tali Macchi',
        description: 'Crispy deep-fried fresh fish fillets coated in a spiced chickpea batter infused with aromatic carom seeds (ajwain).',
        price: 850.00,
        category: 'Starter - Non-Vegetarian',
        image_url: '/images/ajwaini-macchi.png'
      },
      {
        name: 'Gosht sheekh kebab',
        description: 'Finely minced lamb skewers blended with aromatic whole spices, garlic, ginger, and grilled to perfection in the clay tandoor.',
        price: 920.00,
        category: 'Starter - Non-Vegetarian',
        image_url: '/images/gosht-sheekh.png'
      },
      {
        name: 'Kesari Murgh Tikka',
        description: 'Tender boneless chicken cubes marinated in rich cream, yoghurt, saffron (kesar), and mild tandoori spices.',
        price: 780.00,
        category: 'Starter - Non-Vegetarian',
        image_url: '/images/kesari-murgh.png'
      },
      {
        name: 'Atishi Jhinga',
        description: 'Jumbo prawns marinated in a fiery red chilli paste, lemon juice, ginger-garlic paste, and grilled over charcoal.',
        price: 1150.00,
        category: 'Starter - Non-Vegetarian',
        image_url: '/images/atishi-jhinga.png'
      },
      {
        name: 'Murgh Dum Biryani',
        description: 'Aromatic long-grain Basmati rice cooked with succulent chicken pieces, saffron, and mint leaves, slow-cooked in a sealed pot.',
        price: 950.00,
        category: 'Main Course',
        image_url: '/images/murgh-biryani.png'
      },
      {
        name: 'Subz Galouti Kabab',
        description: 'Melt-in-the-mouth vegetarian galouti patties made from finely minced yam and local farm greens, flavored with aromatic spices.',
        price: 690.00,
        category: 'Starter - Vegetarian',
        image_url: '/images/subz-galouti.png'
      },
      {
        name: 'Surkh Paneer Tikka',
        description: 'Fresh cottage cheese blocks marinated in a vibrant red chilli and spice paste, skewered and baked in the tandoor.',
        price: 680.00,
        category: 'Starter - Vegetarian',
        image_url: '/images/kesari-murgh.png'
      },
      {
        name: 'Kandhari Aloo',
        description: 'Baked potatoes hollowed and stuffed with rich dry fruits, cottage cheese, and fresh pomegranate seeds, cooked in a tandoor.',
        price: 590.00,
        category: 'Starter - Vegetarian',
        image_url: '/images/hero-dish.png'
      },
      {
        name: 'Makhmali Kele ki sheekh',
        description: 'Delicate skewered kebabs prepared with raw banana, mawa (condensed milk), nuts, and mild spices, cooked to a velvet finish.',
        price: 620.00,
        category: 'Starter - Vegetarian',
        image_url: '/images/gosht-sheekh.png'
      },
      {
        name: 'Sakarkand ki Shami',
        description: 'Golden-fried sweet potato patties flavored with ginger, green chillies, roasted cumin, and fresh coriander.',
        price: 580.00,
        category: 'Starter - Vegetarian',
        image_url: '/images/subz-galouti.png'
      },
      {
        name: 'Chatpate Ananas',
        description: 'Vibrant pineapple slices marinated in a tangy yoghurt spice mix and caramelized over tandoor charcoal.',
        price: 550.00,
        category: 'Starter - Vegetarian',
        image_url: '/images/hero-dish.png'
      },
      {
        name: 'Subz Dum Biryani',
        description: 'Richly layered Basmati rice cooked with fresh seasonal vegetables, paneer cubes, saffron strands, and fresh mint.',
        price: 750.00,
        category: 'Main Course',
        image_url: '/images/gondhoraj-pulao.png'
      },
      {
        name: 'Dal Factory',
        description: 'The legendary slow-cooked black lentils simmered overnight with tomatoes, butter, and cream, yielding a rich, silky texture.',
        price: 490.00,
        category: 'Main Course',
        image_url: '/images/hero-dish.png'
      },
      {
        name: 'Dal Miloni',
        description: 'A comforting blend of split yellow and green lentils cooked with finely shredded spinach and tempered with garlic and cumin.',
        price: 480.00,
        category: 'Main Course',
        image_url: '/images/ghee-rice.png'
      },
      {
        name: 'Rara Gosht',
        description: 'Tender mutton pieces cooked in a rich, slow-simmered gravy made of spiced minced lamb, tomatoes, and traditional whole spices.',
        price: 890.00,
        category: 'Main Course',
        image_url: '/images/hero-dish.png'
      },
      {
        name: 'Methi Paneer',
        description: 'Paneer cubes cooked in a cream-based cashew nut gravy flavored with the aromatic fragrance of dried fenugreek leaves (methi).',
        price: 590.00,
        category: 'Main Course',
        image_url: '/images/hero-dish.png'
      },
      {
        name: 'Bhindi do Pyaza',
        description: 'Fresh okra sautéed with lots of caramelized red onions, tomatoes, and standard Indian spices.',
        price: 450.00,
        category: 'Main Course',
        image_url: '/images/hero-dish.png'
      },
      {
        name: 'Lauki ka Halwa',
        description: 'Sweet pudding made with grated bottle gourd, milk, sugar, ghee, cardamom, and garnished with chopped almonds and cashews.',
        price: 350.00,
        category: 'Dessert',
        image_url: '/images/sweet-lassi.png'
      },
      {
        name: 'Malpua',
        description: 'Traditional deep-fried sweet pancakes soaked in sugar syrup and topped with creamy rabri and sliced pistachios.',
        price: 320.00,
        category: 'Dessert',
        image_url: '/images/kulcha.png'
      },
      {
        name: 'Gud ka Rasgulla',
        description: 'Soft, spongy cottage cheese balls soaked in a warm, aromatic syrup sweetened with premium date palm jaggery (nolen gur).',
        price: 250.00,
        category: 'Dessert',
        image_url: '/images/sweet-lassi.png'
      },
      {
        name: 'Rabri Faluda',
        description: 'Classic layered dessert with cornstarch vermicelli, sweet basil seeds, rose syrup, and topped with rich, slow-reduced rabri.',
        price: 390.00,
        category: 'Dessert',
        image_url: '/images/sweet-lassi.png'
      },
      {
        name: 'Malai Kulfi',
        description: 'Rich, dense, and creamy traditional Indian ice cream flavored with saffron, cardamom, and chopped nuts.',
        price: 290.00,
        category: 'Dessert',
        image_url: '/images/sweet-lassi.png'
      }
    ];

    for (const item of seedMenu) {
      await p.query(
        'INSERT INTO menu_items (name, description, price, category, image_url) VALUES ($1, $2, $3, $4, $5)',
        [item.name, item.description, item.price, item.category, item.image_url]
      );
    }
  }

  // Seed Reviews if empty
  const reviewCount = await p.query('SELECT COUNT(*) as count FROM reviews');
  if (parseInt(reviewCount.rows[0].count, 10) === 0) {
    const seedReviews = [
      {
        author: 'Rahul S.',
        rating: 5,
        comment: 'The Mattbor Biryani is an absolute masterpiece. The meat was unbelievably tender and the fragrance of saffron was incredible!',
        date: '2026-05-15'
      },
      {
        author: 'Anjali M.',
        rating: 5,
        comment: 'Amazing texture and perfect blend of spices. The Gondhoraj Chicken Pulao is so fresh and unique. Highly recommended!',
        date: '2026-06-02'
      },
      {
        author: 'Vikram K.',
        rating: 5,
        comment: 'Easily the best Biryani in town. The clay-pot presentation and warm, heritage-filled ambiance make it a luxury experience.',
        date: '2026-06-12'
      }
    ];
    for (const review of seedReviews) {
      await p.query(
        'INSERT INTO reviews (author, rating, comment, date) VALUES ($1, $2, $3, $4)',
        [review.author, review.rating, review.comment, review.date]
      );
    }
  }

  initialized = true;
}

// Automatic Round-Robin Rider Assignment
export async function assignRiderToOrder(orderId: number) {
  const db = await getDb();
  
  // Find the order details
  const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) {
    console.error(`Order #${orderId} not found`);
    return null;
  }

  // Get rejected rider IDs
  const rejectedRidersRaw = order.rejected_riders || '';
  const rejectedRiderIds = rejectedRidersRaw
    ? rejectedRidersRaw.split(',').map((id: string) => parseInt(id, 10))
    : [];

  // Find available riders ordered by last_assigned_at ASC (round-robin)
  // Nulls first, then oldest assigned rider
  const availableRiders = await db.all(`
    SELECT * FROM delivery_boys 
    WHERE status = 'available' 
    ORDER BY last_assigned_at ASC NULLS FIRST
  `);

  // Filter out riders who rejected this order
  const candidateRider = availableRiders.find(
    (rider: any) => !rejectedRiderIds.includes(rider.id)
  );

  if (!candidateRider) {
    console.warn(`No available riders found for Order #${orderId}`);
    return null;
  }

  // Assign this rider to the order
  await db.run(
    'UPDATE orders SET delivery_boy_id = ?, status = ? WHERE id = ?',
    [candidateRider.id, 'confirmed', orderId]
  );

  // Update rider's last_assigned_at timestamp to rotate them to the back of the queue
  const nowStr = new Date().toISOString();
  await db.run(
    'UPDATE delivery_boys SET last_assigned_at = ? WHERE id = ?',
    [nowStr, candidateRider.id]
  );

  // Send WhatsApp message directly to the assigned rider via Evolution API
  const riderText = `🚚 *New Delivery Assigned*\n\nOrder ID: #${order.id}\nPickup: Swaad Rustam & Biryani\nCustomer Address: ${order.delivery_address}\nTotal Bill: ₹${order.total_amount.toFixed(2)}\n\nReply with:\n*1* = Accept\n*2* = Reject`;
  
  await sendWhatsAppMessage(candidateRider.phone, riderText, true);

  return candidateRider;
}

// Helper to send WhatsApp messages directly via Evolution API
export async function sendWhatsAppMessage(phone: string, text: string, useDriverInstance: boolean = false) {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  
  // Use driver instance if requested and available, otherwise fallback to main instance
  let instance = process.env.EVOLUTION_INSTANCE_NAME;
  if (useDriverInstance && process.env.EVOLUTION_DRIVER_INSTANCE_NAME) {
    instance = process.env.EVOLUTION_DRIVER_INSTANCE_NAME;
  }

  if (!baseUrl || !apiKey || !instance) {
    console.warn('Evolution API variables are not fully configured in your env file.');
    return;
  }

  // Clean phone number (digits only)
  let cleanPhone = phone.replace(/\D/g, '');
  
  // If it starts with 0 and is 11 digits (e.g. 07303059402), strip the 0
  if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone; // Add Indian country code by default if length is 10 digits
  }

  const url = `${baseUrl.replace(/\/$/, '')}/message/sendText/${instance}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: text
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Evolution API sendText failed:', data);
    }
  } catch (error) {
    console.error('Failed to send WhatsApp message via Evolution API:', error);
  }
}
