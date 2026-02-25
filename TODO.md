# TripPlanner TODO

## 1. Payment Settlement UI

- [ ] **1.1** Add "Mark as Paid" button in payments UI for members who owe money
- [ ] **1.2** Show payment method selection (Venmo, PayPal, Zelle, CashApp, Cash)
- [ ] **1.3** Add "Confirm Receipt" button for the payer to confirm payment was received
- [ ] **1.4** Update BillSplitMember status workflow: PENDING → PAID → CONFIRMED
- [ ] **1.5** Add visual indicators for payment status in payment cards
- [ ] **1.6** Handle edge cases (user marking themselves as paid when they're the payer)

---

## 2. Simplify Debt Algorithm

- [ ] **2.1** Research and implement debt simplification algorithm (similar to Splitwise)
- [ ] **2.2** Create backend endpoint to calculate optimized settlement
- [ ] **2.3** Display simplified debts in the payments overview
- [ ] **2.4** Show who pays whom and how much
- [ ] **2.5** Handle cases where A owes B and B owes C (chain settlements)
- [ ] **2.6** Test with various debt scenarios

---

## 3. Fix Images/Videos on Trips

- [ ] **3.1** Investigate why images/videos are not showing up
- [ ] **3.2** Check media upload functionality
- [ ] **3.3** Verify media storage (S3 or local)
- [ ] **3.4** Fix media rendering in memories/chat
- [ ] **3.5** Add loading states for media
- [ ] **3.6** Add error handling for failed media loads

---

## 4. Avatar Upload

- [ ] **4.1** Create avatar upload component in settings
- [ ] **4.2** Implement file upload API endpoint
- [ ] **4.3** Add image compression before upload
- [ ] **4.4** Update user profile to store avatar URL
- [ ] **4.5** Display avatar in header dropdown
- [ ] **4.6** Show avatar in trip members list
- [ ] **4.7** Add fallback to initials when no avatar

---

## 5. Chat: Enter to Submit, Shift+Enter for New Line

- [ ] **5.1** Update message input to handle Enter key as submit
- [ ] **5.2** Add Shift+Enter handling for new line
- [ ] **5.3** Add visual feedback for message send
- [ ] **5.4** Handle empty message case

---

## 6. Chat Pagination - Initial Load (First 30 Messages)

- [ ] **6.1** Update API to return first 30 messages by default
- [ ] **6.2** Update frontend to load initial 30 messages on chat open
- [ ] **6.3** Create cache/queue for first 30 messages per conversation
- [ ] **6.4** Implement "load more" for older messages

---

## 7. Chat Pagination - Load Older Messages by ID

- [ ] **7.1** Create API endpoint to fetch messages older than a given message ID
- [ ] **7.2** Add pagination UI in chat (infinite scroll or "Load More" button)
- [ ] **7.3** Track message IDs for pagination
- [ ] **7.4** Handle edge case when no more messages to load
- [ ] **7.5** Optimize query to use index on createdAt or message ID
