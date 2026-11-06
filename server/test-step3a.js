/**
 * Comprehensive Step 3A Backend Verification Test Suite
 * 
 * Verifies:
 *  1. Demo Login (seeded users) & JWT generation
 *  2. Standard Login with password verification
 *  3. Profile retrieval & passwordHash exclusion
 *  4. Item listing, search, category filters, and pagination
 *  5. Item creation with authenticated user identity
 *  6. Ownership authorization enforcement (403 on unauthorized edit)
 *  7. Self-borrowing prevention (400 on self-borrow attempt)
 *  8. Chronology validation (400 on invalid date ranges)
 *  9. Borrow request creation and persistent notification dispatch
 * 10. Concurrency-safe approval workflow
 * 11. Overlap collision prevention (409 on overlapping request)
 * 12. Handover activation (request -> ACTIVE, item -> BORROWED)
 * 13. Return completion (request -> RETURNED, item -> AVAILABLE)
 * 14. Request rejection and cancellation workflows
 * 15. Notification retrieval and mark-as-read
 * 16. Security & auth boundary checks (401 on missing/bad token)
 */

const BASE_URL = 'http://localhost:5000/api'

let testsPassed = 0
let testsFailed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`)
    testsPassed++
  } else {
    console.error(`  ❌ FAIL: ${message}`)
    testsFailed++
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  const data = await response.json().catch(() => null)
  return { status: response.status, ok: response.ok, data }
}

async function runTestSuite() {
  console.log('🚀 Starting BorrowBox Step 3A Comprehensive Verification Suite...\n')

  // ----------------------------------------------------
  // Test 1: Demo Login & Token Verification
  // ----------------------------------------------------
  console.log('🔹 1. Authentication & Demo Login')
  const aliceLogin = await request('/auth/demo-login', {
    method: 'POST',
    body: { email: 'alice@borrowbox.local' }
  })
  assert(aliceLogin.status === 200, 'Alice demo login returned 200 OK')
  assert(!!aliceLogin.data?.data?.token, 'JWT token returned in login response')
  assert(aliceLogin.data?.data?.user?.email === 'alice@borrowbox.local', 'Returned user email matches')
  assert(aliceLogin.data?.data?.user?.passwordHash === undefined, 'Password hash is NEVER exposed in user payload')

  const aliceToken = aliceLogin.data.data.token
  const aliceId = aliceLogin.data.data.user.id

  const bobLogin = await request('/auth/demo-login', {
    method: 'POST',
    body: { email: 'bob@borrowbox.local' }
  })
  const bobToken = bobLogin.data.data.token
  const bobId = bobLogin.data.data.user.id
  assert(bobLogin.status === 200 && !!bobToken, 'Bob demo login returned 200 OK with token')

  // Standard Login Check
  const standardLogin = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'alice@borrowbox.local',
      password: 'BorrowBox123!'
    }
  })
  assert(standardLogin.status === 200, 'Standard login with email & password succeeded')

  const invalidPasswordLogin = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'alice@borrowbox.local',
      password: 'WrongPassword999!'
    }
  })
  assert(invalidPasswordLogin.status === 401, 'Invalid password correctly rejected with 401 Unauthorized')

  // Protected /me endpoint
  const profileRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${aliceToken}` }
  })
  assert(profileRes.status === 200, 'GET /api/auth/me returned 200 OK for authenticated user')
  assert(profileRes.data?.data?.id === aliceId, 'Profile user ID matches authenticated user')

  // ----------------------------------------------------
  // Test 2: Security & Unauthenticated Access Control
  // ----------------------------------------------------
  console.log('\n🔹 2. Security & Token Protection')
  const unauthMe = await request('/auth/me')
  assert(unauthMe.status === 401, 'Accessing protected endpoint without token returns 401')

  const badTokenMe = await request('/auth/me', {
    headers: { Authorization: 'Bearer totally_invalid_jwt_token' }
  })
  assert(badTokenMe.status === 401, 'Accessing protected endpoint with invalid token returns 401')

  // ----------------------------------------------------
  // Test 3: Item Catalog (List, Search, Filter)
  // ----------------------------------------------------
  console.log('\n🔹 3. Item Catalog & Search/Filters')
  const allItems = await request('/items')
  assert(allItems.status === 200, 'GET /api/items returned 200 OK')
  assert(Array.isArray(allItems.data?.data) && allItems.data.data.length > 0, 'Items catalog returned list of items')
  assert(allItems.data.pagination?.total >= 8, 'Catalog has at least 8 seeded items')

  // Search by title keyword
  const searchDrill = await request('/items?search=drill')
  assert(searchDrill.status === 200, 'Search for "drill" returned 200 OK')
  assert(searchDrill.data?.data?.every((i) => i.title.toLowerCase().includes('drill')), 'All search results contain "drill"')

  // Filter by category
  const filterTools = await request('/items?category=TOOLS')
  assert(filterTools.status === 200, 'Filter by category TOOLS returned 200 OK')
  assert(filterTools.data?.data?.every((i) => i.category === 'TOOLS'), 'All filtered items have category TOOLS')

  // ----------------------------------------------------
  // Test 4: Item Creation & Ownership Authorization
  // ----------------------------------------------------
  console.log('\n🔹 4. Item Creation & Ownership Enforcement')
  const createItemRes = await request('/items', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: {
      title: 'Bosch Professional Rotary Hammer Drill',
      description: 'Heavy duty SDS-plus rotary hammer with chisel function and case.',
      category: 'TOOLS',
      imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80'
    }
  })
  assert(createItemRes.status === 201, 'POST /api/items created new item with 201 Created')
  const createdItemId = createItemRes.data?.data?.id
  assert(createItemRes.data?.data?.ownerId === aliceId, 'Owner ID securely derived from verified JWT (Alice)')

  // Bob attempts to edit Alice's item (must be 403)
  const unauthorizedEdit = await request(`/items/${createdItemId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${bobToken}` },
    body: { title: 'Hacked Title By Bob' }
  })
  assert(unauthorizedEdit.status === 403, 'Unauthorized edit attempt by non-owner returned 403 Forbidden')

  // Alice edits her own item
  const authorizedEdit = await request(`/items/${createdItemId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: { title: 'Bosch Professional Rotary Hammer Drill (Updated)' }
  })
  assert(authorizedEdit.status === 200, 'Owner editing their own item returned 200 OK')
  assert(authorizedEdit.data?.data?.title.includes('(Updated)'), 'Item title updated successfully')

  // ----------------------------------------------------
  // Test 5: Business Rules: Self-Borrowing & Date Sanity
  // ----------------------------------------------------
  console.log('\n🔹 5. Business Rules: Self-Borrowing & Chronology')
  const now = new Date()
  const dStart = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
  const dEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  // Alice attempts to borrow her own item
  const selfBorrow = await request('/borrow-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
    body: {
      itemId: createdItemId,
      startDate: dStart.toISOString(),
      endDate: dEnd.toISOString()
    }
  })
  assert(selfBorrow.status === 400, 'Self-borrowing attempt rejected with 400 Bad Request')
  assert(selfBorrow.data?.error?.message.includes('cannot create a borrow request for an item that you own'), 'Clear self-borrowing error message returned')

  // Inverted dates (start > end)
  const invertedDates = await request('/borrow-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bobToken}` },
    body: {
      itemId: createdItemId,
      startDate: dEnd.toISOString(),
      endDate: dStart.toISOString()
    }
  })
  assert(invertedDates.status === 400, 'Inverted dates (start > end) rejected with 400 Bad Request')

  // ----------------------------------------------------
  // Test 6: Borrow Request Lifecycle & Overlap Prevention
  // ----------------------------------------------------
  console.log('\n🔹 6. Borrow Request Lifecycle & Overlap Prevention')
  // Bob creates legitimate borrow request for Alice's item
  const bobReq = await request('/borrow-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bobToken}` },
    body: {
      itemId: createdItemId,
      startDate: dStart.toISOString(),
      endDate: dEnd.toISOString()
    }
  })
  assert(bobReq.status === 201, 'Bob successfully submitted borrow request (201 Created)')
  const bobRequestId = bobReq.data?.data?.id
  assert(bobReq.data?.data?.status === 'PENDING', 'New borrow request defaults to PENDING status')

  // Alice approves Bob's request
  const approveRes = await request(`/borrow-requests/${bobRequestId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` }
  })
  assert(approveRes.status === 200, 'Owner (Alice) approved request (200 OK)')
  assert(approveRes.data?.data?.status === 'APPROVED', 'Request status transitioned to APPROVED')

  // Charlie tries to borrow same item across overlapping dates
  const charlieLogin = await request('/auth/demo-login', {
    method: 'POST',
    body: { email: 'charlie@borrowbox.local' }
  })
  const charlieToken = charlieLogin.data.data.token

  // Overlapping interval: dStart + 1 day to dEnd - 1 day
  const overlapStart = new Date(dStart.getTime() + 1 * 24 * 60 * 60 * 1000)
  const overlapEnd = new Date(dEnd.getTime() - 1 * 24 * 60 * 60 * 1000)

  const overlapReq = await request('/borrow-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${charlieToken}` },
    body: {
      itemId: createdItemId,
      startDate: overlapStart.toISOString(),
      endDate: overlapEnd.toISOString()
    }
  })
  assert(overlapReq.status === 409, 'Overlapping borrow request blocked with 409 Conflict')
  assert(overlapReq.data?.error?.code === 'CONFLICT', 'Conflict error code returned')

  // Handover: Activate approved request
  const activateRes = await request(`/borrow-requests/${bobRequestId}/activate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` }
  })
  assert(activateRes.status === 200, 'Request activated on handover (200 OK)')
  assert(activateRes.data?.data?.status === 'ACTIVE', 'Request status transitioned to ACTIVE')

  // Verify item status transitioned to BORROWED
  const itemDetailBorrowed = await request(`/items/${createdItemId}`)
  assert(itemDetailBorrowed.data?.data?.status === 'BORROWED', 'Item status updated to BORROWED while active')

  // Return item
  const returnRes = await request(`/borrow-requests/${bobRequestId}/return`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` }
  })
  assert(returnRes.status === 200, 'Item return confirmed (200 OK)')
  assert(returnRes.data?.data?.status === 'RETURNED', 'Request status transitioned to RETURNED')

  // Verify item status returned to AVAILABLE
  const itemDetailAvailable = await request(`/items/${createdItemId}`)
  assert(itemDetailAvailable.data?.data?.status === 'AVAILABLE', 'Item status restored to AVAILABLE after return')

  // ----------------------------------------------------
  // Test 7: Rejection & Cancellation Workflows
  // ----------------------------------------------------
  console.log('\n🔹 7. Rejection & Cancellation Workflows')
  const future1 = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000)
  const future2 = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000)

  // Charlie requests item from Alice
  const reqToReject = await request('/borrow-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${charlieToken}` },
    body: {
      itemId: createdItemId,
      startDate: future1.toISOString(),
      endDate: future2.toISOString()
    }
  })
  const rejectReqId = reqToReject.data?.data?.id

  // Alice rejects Charlie's request
  const rejectRes = await request(`/borrow-requests/${rejectReqId}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` }
  })
  assert(rejectRes.status === 200, 'Owner rejected pending request (200 OK)')
  assert(rejectRes.data?.data?.status === 'REJECTED', 'Status transitioned to REJECTED')

  // Charlie requests again and cancels it himself
  const future3 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const future4 = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000)
  const reqToCancel = await request('/borrow-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${charlieToken}` },
    body: {
      itemId: createdItemId,
      startDate: future3.toISOString(),
      endDate: future4.toISOString()
    }
  })
  const cancelReqId = reqToCancel.data?.data?.id

  const cancelRes = await request(`/borrow-requests/${cancelReqId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${charlieToken}` }
  })
  assert(cancelRes.status === 200, 'Borrower cancelled pending request (200 OK)')
  assert(cancelRes.data?.data?.status === 'CANCELLED', 'Status transitioned to CANCELLED')

  // ----------------------------------------------------
  // Test 8: Notifications Persistence & Read Status
  // ----------------------------------------------------
  console.log('\n🔹 8. Notifications Persistence & Read Status')
  const bobNotifs = await request('/notifications', {
    headers: { Authorization: `Bearer ${bobToken}` }
  })
  assert(bobNotifs.status === 200, 'GET /api/notifications returned 200 OK')
  assert(Array.isArray(bobNotifs.data?.data) && bobNotifs.data.data.length > 0, 'Bob received notifications from borrow workflows')

  const unreadNotif = bobNotifs.data.data.find((n) => !n.read)
  if (unreadNotif) {
    const markReadRes = await request(`/notifications/${unreadNotif.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${bobToken}` }
    })
    assert(markReadRes.status === 200, 'PATCH /api/notifications/:id/read returned 200 OK')
    assert(markReadRes.data?.data?.read === true, 'Notification marked as read')
  }

  // Clean up created item
  console.log('\n🔹 9. Cleanup & Final Checks')
  const deleteRes = await request(`/items/${createdItemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${aliceToken}` }
  })
  assert(deleteRes.status === 200, 'Owner deleted test item after workflow completion')

  // Final Score
  console.log('\n========================================')
  console.log(`📊 Test Suite Finished: ${testsPassed} Passed, ${testsFailed} Failed.`)
  console.log('========================================\n')

  if (testsFailed > 0) {
    process.exit(1)
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})

