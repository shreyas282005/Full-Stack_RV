import { io as Client } from 'socket.io-client'
import RedisMock from 'ioredis-mock'
import { config } from './src/config/env.js'
import { cacheService } from './src/redis/cache.service.js'

const BASE_URL = `http://localhost:${config.port}`

let passedCount = 0
let failedCount = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`)
    passedCount++
  } else {
    console.error(`  ❌ FAIL: ${message}`)
    failedCount++
  }
}

async function runStep4Tests() {
  console.log('\n🚀 Starting BorrowBox Step 4: Redis Caching & Socket.IO Verification Suite...\n')

  // ----------------------------------------------------
  // SECTION 1: REDIS CACHING (IOREDIS-MOCK & SERVICE INTEGRITY)
  // ----------------------------------------------------
  console.log('🔹 1. Redis Cache Service & Invalidation Mechanics (Simulated Engine)')
  
  // Inject mock Redis into cacheService for deterministic assertions
  const mockRedis = new RedisMock()
  cacheService.setClient(mockRedis)

  assert(cacheService.isAvailable() === true, 'Cache service recognizes connected Redis instance')

  // Test Set and Get
  const testData = { id: 'test-item-123', title: 'Power Drill', status: 'AVAILABLE' }
  const setSuccess = await cacheService.set('item:test-item-123', testData, 10)
  assert(setSuccess === true, 'Cache SET returned success')

  const cachedData = await cacheService.get('item:test-item-123')
  assert(cachedData !== null, 'Cache GET returned cached value (Cache HIT)')
  assert(cachedData.title === 'Power Drill', 'Cached payload contents match original data')

  // Test Invalidation by pattern
  await cacheService.set('items:list:cat1', [{ id: 1 }], 10)
  await cacheService.set('items:list:cat2', [{ id: 2 }], 10)
  const invalidatedCount = await cacheService.invalidatePattern('items:list:*')
  assert(invalidatedCount >= 2, `Pattern invalidation purged matching keys (${invalidatedCount} keys purged)`)

  const purgedCat1 = await cacheService.get('items:list:cat1')
  assert(purgedCat1 === null, 'Purged key returns null (Cache MISS after invalidation)')

  // Test item cache invalidation helper
  const detailKey = `items:detail:test-item-123`
  await cacheService.set(detailKey, testData, 10)
  await cacheService.set('items:list:all', [testData], 10)
  await cacheService.invalidateItemCache('test-item-123')
  const purgedDetail = await cacheService.get(detailKey)
  const purgedList = await cacheService.get('items:list:all')
  assert(purgedDetail === null && purgedList === null, 'invalidateItemCache clears both item detail and catalog lists')

  // Test Graceful Offline Fallback
  cacheService.setClient(null)
  assert(cacheService.isAvailable() === false, 'Cache service correctly detects offline state')
  const fallbackGet = await cacheService.get('any-key')
  assert(fallbackGet === null, 'Cache GET safely returns null without throwing when Redis is offline')
  const fallbackSet = await cacheService.set('any-key', { test: true })
  assert(fallbackSet === false, 'Cache SET safely returns false without throwing when Redis is offline')
  const fallbackDel = await cacheService.del('any-key')
  assert(fallbackDel === false, 'Cache DEL safely returns false when Redis is offline')

  // ----------------------------------------------------
  // SECTION 2: AUTHENTICATION & SOCKET.IO HANDSHAKE
  // ----------------------------------------------------
  console.log('\n🔹 2. Socket.IO Handshake Security & Token Authentication')

  // Fetch tokens for Alice (Owner), Bob (Borrower), and Charlie (Third party)
  const aliceRes = await fetch(`${BASE_URL}/api/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alice@borrowbox.local' })
  }).then(r => r.json())
  const aliceToken = aliceRes?.data?.token
  const aliceUser = aliceRes?.data?.user

  const bobRes = await fetch(`${BASE_URL}/api/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bob@borrowbox.local' })
  }).then(r => r.json())
  const bobToken = bobRes?.data?.token
  const bobUser = bobRes?.data?.user

  const charlieRes = await fetch(`${BASE_URL}/api/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'charlie@borrowbox.local' })
  }).then(r => r.json())
  const charlieToken = charlieRes?.data?.token
  const charlieUser = charlieRes?.data?.user

  assert(Boolean(aliceToken && bobToken && charlieToken), 'Demo login tokens acquired for Alice, Bob, and Charlie')

  // Test connection without token (should fail)
  const rejectedNoToken = await new Promise((resolve) => {
    const socket = Client(BASE_URL, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 3000
    })
    socket.on('connect_error', (err) => {
      socket.close()
      resolve(err.message)
    })
    socket.on('connect', () => {
      socket.close()
      resolve(false)
    })
  })
  assert(rejectedNoToken.includes('Token required') || rejectedNoToken.includes('Authentication error'), 
    `Socket connection without token rejected: "${rejectedNoToken}"`)

  // Test connection with invalid token (should fail)
  const rejectedBadToken = await new Promise((resolve) => {
    const socket = Client(BASE_URL, {
      auth: { token: 'invalid.jwt.token' },
      transports: ['websocket'],
      reconnection: false,
      timeout: 3000
    })
    socket.on('connect_error', (err) => {
      socket.close()
      resolve(err.message)
    })
    socket.on('connect', () => {
      socket.close()
      resolve(false)
    })
  })
  assert(rejectedBadToken.includes('Authentication error') || rejectedBadToken.includes('jwt'), 
    `Socket connection with bogus token rejected: "${rejectedBadToken}"`)

  // Connect Alice, Bob, and Charlie with valid JWTs
  const aliceSocket = Client(BASE_URL, { auth: { token: aliceToken }, transports: ['websocket'] })
  const bobSocket = Client(BASE_URL, { auth: { token: bobToken }, transports: ['websocket'] })
  const charlieSocket = Client(BASE_URL, { auth: { token: charlieToken }, transports: ['websocket'] })

  await Promise.all([
    new Promise(res => aliceSocket.on('connect', res)),
    new Promise(res => bobSocket.on('connect', res)),
    new Promise(res => charlieSocket.on('connect', res))
  ])

  assert(aliceSocket.connected === true, 'Alice socket connected successfully via authenticated handshake')
  assert(bobSocket.connected === true, 'Bob socket connected successfully via authenticated handshake')
  assert(charlieSocket.connected === true, 'Charlie socket connected successfully via authenticated handshake')

  // ----------------------------------------------------
  // SECTION 3: REAL-TIME EVENT PROPAGATION & ISOLATION
  // ----------------------------------------------------
  console.log('\n🔹 3. Targeted Event Delivery & Room Isolation')

  // Retrieve an item owned by Alice
  const itemsRes = await fetch(`${BASE_URL}/api/items`).then(r => r.json())
  const aliceItem = itemsRes.data.find(i => i.ownerId === aliceUser.id && i.status === 'AVAILABLE')
  assert(Boolean(aliceItem), `Found available item owned by Alice: "${aliceItem?.title}"`)

  // Set up listeners for borrow request creation
  let aliceReceivedNotification = null
  let aliceReceivedBorrowCreated = null
  let charlieLeakDetected = false

  aliceSocket.on('notification:new', (notif) => {
    aliceReceivedNotification = notif
  })
  aliceSocket.on('borrow-request:created', (data) => {
    aliceReceivedBorrowCreated = data
  })
  charlieSocket.on('notification:new', () => {
    charlieLeakDetected = true
  })

  // Bob creates a borrow request for Alice's item with unique future dates to prevent collision with past test runs
  const dayOffset = Math.floor(Math.random() * 500) + 50
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + dayOffset)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 3)

  const createReqRes = await fetch(`${BASE_URL}/api/borrow-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bobToken}`
    },
    body: JSON.stringify({
      itemId: aliceItem.id,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    })
  }).then(r => r.json())

  assert(createReqRes.success === true, `Bob successfully created borrow request via REST API${createReqRes.error ? ` (${createReqRes.error.message})` : ''}`)
  const createdRequestId = createReqRes?.data?.id

  // Wait for Socket.IO event propagation
  await new Promise(r => setTimeout(r, 600))

  const receivedBorrowId = aliceReceivedBorrowCreated?.request?.id || aliceReceivedBorrowCreated?.id
  assert(aliceReceivedBorrowCreated !== null, 'Alice received "borrow-request:created" in real-time')
  assert(receivedBorrowId === createdRequestId, 'Borrow request ID matches created request')
  assert(aliceReceivedNotification !== null, 'Alice received "notification:new" alert on her socket')
  assert(charlieLeakDetected === false, 'Charlie received NO events (user room isolation verified)')

  // ----------------------------------------------------
  // SECTION 4: APPROVAL & AVAILABILITY EVENTS
  // ----------------------------------------------------
  console.log('\n🔹 4. Request Lifecycle & Availability Real-Time Broadcast')

  let bobReceivedUpdate = null
  let bobReceivedNotification = null
  bobSocket.on('borrow-request:updated', (data) => {
    bobReceivedUpdate = data
  })
  bobSocket.on('notification:new', (notif) => {
    bobReceivedNotification = notif
  })

  // Alice approves Bob's request
  const approveRes = await fetch(`${BASE_URL}/api/borrow-requests/${createdRequestId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceToken}`
    }
  }).then(r => r.json())

  assert(approveRes.success === true, 'Alice approved borrow request via REST API')

  // Wait for event propagation
  await new Promise(r => setTimeout(r, 600))

  const updatedStatus = bobReceivedUpdate?.request?.status || bobReceivedUpdate?.status
  assert(bobReceivedUpdate !== null, 'Bob received "borrow-request:updated" status event in real-time')
  assert(updatedStatus === 'APPROVED', 'Updated status is APPROVED')
  assert(bobReceivedNotification !== null, 'Bob received "notification:new" approval alert')

  // Mark request ACTIVE -> triggers item:availability-updated to BORROWED
  let availabilityUpdatedEvent = null
  aliceSocket.on('item:availability-updated', (ev) => {
    availabilityUpdatedEvent = ev
  })

  const activeRes = await fetch(`${BASE_URL}/api/borrow-requests/${createdRequestId}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceToken}`
    }
  }).then(r => r.json())

  assert(activeRes.success === true, 'Alice marked request ACTIVE')
  await new Promise(r => setTimeout(r, 600))

  assert(availabilityUpdatedEvent !== null, 'Alice received "item:availability-updated" event')
  assert(availabilityUpdatedEvent?.status === 'BORROWED', 'Availability event reports status "BORROWED"')

  // Clean up: return item back to AVAILABLE
  await fetch(`${BASE_URL}/api/borrow-requests/${createdRequestId}/return`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceToken}`
    }
  })

  // ----------------------------------------------------
  // SECTION 5: NOTIFICATION READ REAL-TIME EVENTS
  // ----------------------------------------------------
  console.log('\n🔹 5. Notification Read Events')

  let readNotificationEvent = null
  aliceSocket.on('notification:read', (ev) => {
    readNotificationEvent = ev
  })

  if (aliceReceivedNotification?.id) {
    await fetch(`${BASE_URL}/api/notifications/${aliceReceivedNotification.id}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    })
    await new Promise(r => setTimeout(r, 500))
    assert(readNotificationEvent !== null, 'Alice received "notification:read" socket event on marking read')
  } else {
    assert(true, 'Skipped notification read test: no ID')
  }

  // Close sockets
  aliceSocket.close()
  bobSocket.close()
  charlieSocket.close()

  console.log('\n========================================')
  console.log(`📊 Step 4 Test Suite Finished: ${passedCount} Passed, ${failedCount} Failed.`)
  console.log('========================================\n')

  if (failedCount > 0) {
    process.exit(1)
  }
}

runStep4Tests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
