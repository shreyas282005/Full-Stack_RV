import { PrismaClient, ItemCategory, ItemStatus, BorrowStatus, NotificationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting BorrowBox comprehensive database seed...')

  const defaultPasswordHash = await bcrypt.hash('BorrowBox123!', 10)

  // 1. Seed Demo Users (idempotent upsert by unique email)
  const usersData = [
    {
      email: 'alice@borrowbox.local',
      name: 'Alice Green',
      locality: 'Oakwood Neighborhood',
      passwordHash: defaultPasswordHash
    },
    {
      email: 'bob@borrowbox.local',
      name: 'Bob Builder',
      locality: 'Maple Heights',
      passwordHash: defaultPasswordHash
    },
    {
      email: 'charlie@borrowbox.local',
      name: 'Charlie Rivers',
      locality: 'Pinecrest District',
      passwordHash: defaultPasswordHash
    },
    {
      email: 'dana@borrowbox.local',
      name: 'Dana Hayes',
      locality: 'Sunnyvale Commons',
      passwordHash: defaultPasswordHash
    }
  ]

  const users = {}
  for (const u of usersData) {
    users[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        locality: u.locality,
        passwordHash: u.passwordHash
      },
      create: u
    })
  }
  console.log(`✅ Seeded ${Object.keys(users).length} demo personas.`)

  // 2. Seed 20 Realistic Sample Catalog Items across Multiple Categories
  const itemsData = [
    // --- TOOLS & DIY ---
    {
      title: 'Bosch 18V Cordless Power Drill Set',
      description: 'Includes 2 lithium-ion batteries, high-speed charger, and a 30-piece drill and drive bit kit. Perfect for home DIY and hanging shelves.',
      category: ItemCategory.TOOLS,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
      ownerId: users['alice@borrowbox.local'].id
    },
    {
      title: '12.5ft Aluminum Telescopic Extension Ladder',
      description: 'EN131 certified multi-purpose collapsible ladder with non-slip rubber feet. Max capacity 330 lbs. Fits easily in car trunks.',
      category: ItemCategory.TOOLS,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
      ownerId: users['bob@borrowbox.local'].id
    },
    {
      title: 'DeWalt 7-1/4-Inch Circular Saw with Electric Brake',
      description: '15-Amp motor delivers 5,200 RPM with tough aluminum base for smooth cuts in framing and plywood. Includes carbide-tipped blade.',
      category: ItemCategory.TOOLS,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
      ownerId: users['dana@borrowbox.local'].id
    },
    {
      title: 'Stanley 65-Piece Home Repair Tool Kit',
      description: 'Comprehensive hand tool set including ratchet, sockets, hammer, tape measure, screwdrivers, level, and utility knife in hard case.',
      category: ItemCategory.TOOLS,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
      ownerId: users['charlie@borrowbox.local'].id
    },

    // --- GARDENING & LAWN ---
    {
      title: 'Heavy-Duty Manual Lawn Aerator',
      description: 'Durable steel spike core aerator with foot-step crossbar. Essential for spring conditioning and encouraging deeper lawn root growth.',
      category: ItemCategory.GARDENING,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=600&q=80',
      ownerId: users['alice@borrowbox.local'].id
    },
    {
      title: 'Fiskars StaySharp Max 18-Inch Reel Mower',
      description: 'Eco-friendly push reel lawn mower with StaySharp cutting system. Operates cleanly with zero emissions or gasoline needed.',
      category: ItemCategory.GARDENING,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22524?auto=format&fit=crop&w=600&q=80',
      ownerId: users['charlie@borrowbox.local'].id
    },
    {
      title: 'Greenworks 40V Cordless String Trimmer & Edger',
      description: '13-inch cutting swath with rotating head for clean driveway edging. Includes battery and rapid charger.',
      category: ItemCategory.GARDENING,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=600&q=80',
      ownerId: users['dana@borrowbox.local'].id
    },

    // --- OUTDOORS & CAMPING ---
    {
      title: 'Coleman Sundome 4-Person Camping Tent',
      description: 'Weatherproof dome tent with WeatherTec system. Includes rainfly, heavy-duty ground stakes, and compact storage duffle. Sets up in 10 minutes.',
      category: ItemCategory.OUTDOORS_CAMPING,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80',
      ownerId: users['bob@borrowbox.local'].id
    },
    {
      title: 'YETI Tundra 45 Hard Cooler - Desert Tan',
      description: 'Rotomolded heavy-duty cooler holding up to 28 cans with ice. Bear-resistant, heavy-duty latches, keeps ice cold for days.',
      category: ItemCategory.OUTDOORS_CAMPING,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
      ownerId: users['alice@borrowbox.local'].id
    },
    {
      title: 'Camp Chef 2-Burner Propane Camping Stove',
      description: 'Dual 20,000 BTU cast-aluminum burners with matchless ignition. Windscreen panels and foldable legs for easy camp cooking.',
      category: ItemCategory.OUTDOORS_CAMPING,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=600&q=80',
      ownerId: users['dana@borrowbox.local'].id
    },

    // --- HOME APPLIANCES ---
    {
      title: 'Kärcher K4 1800 PSI Electric Pressure Washer',
      description: 'High performance washer with Vario Power spray wand and turbo dirt blaster. Currently loaned out to Bob for deck cleaning.',
      category: ItemCategory.HOME_APPLIANCES,
      status: ItemStatus.BORROWED, // Currently on ACTIVE loan!
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      ownerId: users['charlie@borrowbox.local'].id
    },
    {
      title: 'Bissell Little Green Pro Portable Carpet Cleaner',
      description: 'Compact spot cleaner combining superior suction with scrubbing action. Perfect for upholstery, stairs, and auto interiors.',
      category: ItemCategory.HOME_APPLIANCES,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      ownerId: users['alice@borrowbox.local'].id
    },
    {
      title: 'NutriBullet 1200W Blender Combo Set',
      description: 'High-speed blender with 64 oz pitcher and two 24 oz travel cups. Crushes ice, nuts, and frozen fruit effortlessly.',
      category: ItemCategory.HOME_APPLIANCES,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80',
      ownerId: users['bob@borrowbox.local'].id
    },

    // --- ELECTRONICS ---
    {
      title: 'Epson EpiqVision 1080p Home Theater Projector',
      description: 'Full HD compact projector with HDMI, USB inputs and built-in speaker. Brilliant 1,000 lumens brightness, great for backyard movie nights.',
      category: ItemCategory.ELECTRONICS,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
      ownerId: users['charlie@borrowbox.local'].id
    },
    {
      title: 'DJI OM 5 Smartphone Gimbal Stabilizer',
      description: '3-axis handheld stabilizer with built-in extension rod. ActiveTrack 4.0 face tracking for buttery smooth event and trip video.',
      category: ItemCategory.ELECTRONICS,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      ownerId: users['bob@borrowbox.local'].id
    },

    // --- PARTY & GAMES ---
    {
      title: 'Giant Wooden Tumbling Blocks (Lawn Jenga)',
      description: '54 precision-crafted pine blocks that stack up to over 5 feet tall during play. Includes heavy-duty canvas carry bag.',
      category: ItemCategory.PARTY_GAMES,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80',
      ownerId: users['dana@borrowbox.local'].id
    },
    {
      title: 'GoSports Cornhole Pro Regulation Bean Bag Toss Set',
      description: 'Two 4ft x 2ft solid wood regulation cornhole boards with 8 all-weather bean bags and travel carrying case.',
      category: ItemCategory.PARTY_GAMES,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80',
      ownerId: users['charlie@borrowbox.local'].id
    },

    // --- SPORTS & FITNESS ---
    {
      title: 'Intex Explorer K2 2-Person Inflatable Kayak',
      description: 'Includes 2 aluminum 86-inch oars, high-output hand pump, and adjustable inflatable seats with backrests. Quick inflation Boston valves.',
      category: ItemCategory.SPORTS_FITNESS,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
      ownerId: users['alice@borrowbox.local'].id
    },
    {
      title: 'Thule Apex XT 4-Bike Hitch Rack',
      description: 'Premium hanging hitch bike carrier with integrated cable lock. Folds down for easy rear trunk access. Fits 2-inch and 1.25-inch receivers.',
      category: ItemCategory.SPORTS_FITNESS,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80',
      ownerId: users['bob@borrowbox.local'].id
    },

    // --- BOOKS & MEDIA ---
    {
      title: 'Lonely Planet Ultimate Travelist Collection & Atlas',
      description: 'Hardcover coffee table guide featuring the top 500 sights on the planet, plus topographic regional maps and itinerary planning.',
      category: ItemCategory.BOOKS_MEDIA,
      status: ItemStatus.AVAILABLE,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      ownerId: users['dana@borrowbox.local'].id
    }
  ]

  const itemsMap = {}
  for (const itemData of itemsData) {
    const existing = await prisma.item.findFirst({
      where: {
        title: itemData.title,
        ownerId: itemData.ownerId
      }
    })

    if (existing) {
      const updated = await prisma.item.update({
        where: { id: existing.id },
        data: itemData
      })
      itemsMap[itemData.title] = updated
    } else {
      const created = await prisma.item.create({
        data: itemData
      })
      itemsMap[itemData.title] = created
    }
  }
  console.log(`✅ Seeded ${Object.keys(itemsMap).length} catalog items across 8 categories.`)

  // 3. Seed Demonstrative Borrow Requests covering ALL statuses:
  // (PENDING, APPROVED, ACTIVE, RETURNED, REJECTED)
  const now = new Date()

  // Helper for date offsets
  const daysOffset = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  // 3A. ACTIVE LOAN: Bob is currently borrowing Charlie's Pressure Washer
  const pressureWasher = itemsMap['Kärcher K4 1800 PSI Electric Pressure Washer']
  if (pressureWasher) {
    const existing = await prisma.borrowRequest.findFirst({
      where: {
        itemId: pressureWasher.id,
        borrowerId: users['bob@borrowbox.local'].id,
        status: BorrowStatus.ACTIVE
      }
    })

    if (!existing) {
      await prisma.borrowRequest.create({
        data: {
          itemId: pressureWasher.id,
          borrowerId: users['bob@borrowbox.local'].id,
          ownerId: pressureWasher.ownerId,
          startDate: daysOffset(-2),
          endDate: daysOffset(3),
          status: BorrowStatus.ACTIVE
        }
      })

      // Notify Charlie and Bob
      await prisma.notification.create({
        data: {
          userId: pressureWasher.ownerId,
          title: 'Item Handed Over (Active Loan)',
          message: `Bob confirmed handover of your "${pressureWasher.title}". Item is on active loan.`,
          type: NotificationType.BORROW_ACTIVE,
          read: true
        }
      })
      await prisma.notification.create({
        data: {
          userId: users['bob@borrowbox.local'].id,
          title: 'Active Borrowing Session',
          message: `You are currently borrowing Charlie's "${pressureWasher.title}". Due back in 3 days.`,
          type: NotificationType.BORROW_ACTIVE,
          read: false
        }
      })
    }
  }

  // 3B. APPROVED REQUEST: Alice's upcoming trip with Bob's Camping Tent
  const tentItem = itemsMap['Coleman Sundome 4-Person Camping Tent']
  if (tentItem) {
    const existing = await prisma.borrowRequest.findFirst({
      where: {
        itemId: tentItem.id,
        borrowerId: users['alice@borrowbox.local'].id,
        status: BorrowStatus.APPROVED
      }
    })

    if (!existing) {
      await prisma.borrowRequest.create({
        data: {
          itemId: tentItem.id,
          borrowerId: users['alice@borrowbox.local'].id,
          ownerId: tentItem.ownerId,
          startDate: daysOffset(2),
          endDate: daysOffset(5),
          status: BorrowStatus.APPROVED
        }
      })

      await prisma.notification.create({
        data: {
          userId: users['alice@borrowbox.local'].id,
          title: 'Borrow Request Approved!',
          message: `Bob approved your request to borrow the "${tentItem.title}". Ready for pickup.`,
          type: NotificationType.REQUEST_APPROVED,
          read: false
        }
      })
    }
  }

  // 3C. PENDING REQUEST: Dana requested Bob's Extension Ladder
  const ladderItem = itemsMap['12.5ft Aluminum Telescopic Extension Ladder']
  if (ladderItem) {
    const existing = await prisma.borrowRequest.findFirst({
      where: {
        itemId: ladderItem.id,
        borrowerId: users['dana@borrowbox.local'].id,
        status: BorrowStatus.PENDING
      }
    })

    if (!existing) {
      await prisma.borrowRequest.create({
        data: {
          itemId: ladderItem.id,
          borrowerId: users['dana@borrowbox.local'].id,
          ownerId: ladderItem.ownerId,
          startDate: daysOffset(3),
          endDate: daysOffset(6),
          status: BorrowStatus.PENDING
        }
      })

      await prisma.notification.create({
        data: {
          userId: ladderItem.ownerId,
          title: 'New Borrow Request',
          message: `Dana requested to borrow your "${ladderItem.title}".`,
          type: NotificationType.BORROW_REQUEST,
          read: false
        }
      })
    }
  }

  // 3D. RETURNED REQUEST: Charlie borrowed and returned Alice's Lawn Aerator
  const aeratorItem = itemsMap['Heavy-Duty Manual Lawn Aerator']
  if (aeratorItem) {
    const existing = await prisma.borrowRequest.findFirst({
      where: {
        itemId: aeratorItem.id,
        borrowerId: users['charlie@borrowbox.local'].id,
        status: BorrowStatus.RETURNED
      }
    })

    if (!existing) {
      await prisma.borrowRequest.create({
        data: {
          itemId: aeratorItem.id,
          borrowerId: users['charlie@borrowbox.local'].id,
          ownerId: aeratorItem.ownerId,
          startDate: daysOffset(-12),
          endDate: daysOffset(-8),
          status: BorrowStatus.RETURNED
        }
      })

      await prisma.notification.create({
        data: {
          userId: aeratorItem.ownerId,
          title: 'Item Safely Returned',
          message: `Charlie returned your "${aeratorItem.title}" in excellent condition. Listing is available again!`,
          type: NotificationType.ITEM_RETURNED,
          read: true
        }
      })
    }
  }

  // 3E. REJECTED REQUEST: Dana previously requested Alice's Power Drill
  const drillItem = itemsMap['Bosch 18V Cordless Power Drill Set']
  if (drillItem) {
    const existing = await prisma.borrowRequest.findFirst({
      where: {
        itemId: drillItem.id,
        borrowerId: users['dana@borrowbox.local'].id,
        status: BorrowStatus.REJECTED
      }
    })

    if (!existing) {
      await prisma.borrowRequest.create({
        data: {
          itemId: drillItem.id,
          borrowerId: users['dana@borrowbox.local'].id,
          ownerId: drillItem.ownerId,
          startDate: daysOffset(-20),
          endDate: daysOffset(-17),
          status: BorrowStatus.REJECTED
        }
      })

      await prisma.notification.create({
        data: {
          userId: users['dana@borrowbox.local'].id,
          title: 'Borrow Request Declined',
          message: `Alice was unable to approve your request for "${drillItem.title}".`,
          type: NotificationType.REQUEST_REJECTED,
          read: true
        }
      })
    }
  }

  console.log('✅ Seeded sample borrow requests covering PENDING, APPROVED, ACTIVE, RETURNED, and REJECTED statuses.')
  console.log('🎉 BorrowBox seed completed successfully.')
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
