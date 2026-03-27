# Debt Simplification Feature

## Overview

The debt simplification feature calculates the minimum number of transactions required to settle all debts within a trip. This is similar to how Splitwise and other expense-splitting apps work.

## Problem It Solves

Without simplification:
- A owes B $20
- B owes C $20
- Result: 2 transactions needed

With simplification:
- A owes B $20, B owes C $20
- Result: A pays C $20 directly (1 transaction)

## Algorithm

The debt simplification algorithm uses a greedy approach:

1. **Calculate Net Balance for Each Member**
   - Balance = (Total Amount Paid) - (Total Amount Owed)
   - Positive balance = member is owed money (creditor)
   - Negative balance = member owes money (debtor)

2. **Separate Creditors and Debtors**
   - Creditors: members with positive balance (sorted by amount descending)
   - Debtors: members with negative balance (sorted by amount ascending/most negative first)

3. **Match Debtors to Creditors**
   - Greedily match the largest debtor to the largest creditor
   - Create a settlement transaction for the minimum of (creditor balance, |debtor balance|)
   - Update remaining balances
   - Continue until all debts are settled

### Example

Trip members: Alice, Bob, Charlie

**Bill Splits:**
- Hotel $300, paid by Alice, split equally (Alice, Bob, Charlie each owe $100)
- Restaurant $90, paid by Bob, split equally (Alice, Bob, Charlie each owe $30)

**Calculations:**
- Alice: Paid $300, Owes $130 ($100 + $30) → Balance = +$170
- Bob: Paid $90, Owes $130 ($100 + $30) → Balance = -$40
- Charlie: Paid $0, Owes $130 ($100 + $30) → Balance = -$130

**Simplified Settlements:**
- Charlie pays Alice $130
- Bob pays Alice $40

Total: 2 transactions instead of potentially more.

## API Endpoint

```
GET /api/trips/:tripId/debt-simplify
```

### Response Format

```json
{
  "data": {
    "balances": [
      { "userId": "user-1", "name": "Alice", "balance": 170.00 },
      { "userId": "user-2", "name": "Bob", "balance": -40.00 },
      { "userId": "user-3", "name": "Charlie", "balance": -130.00 }
    ],
    "settlements": [
      { "from": "user-3", "fromName": "Charlie", "to": "user-1", "toName": "Alice", "amount": 130.00 },
      { "from": "user-2", "fromName": "Bob", "to": "user-1", "toName": "Alice", "amount": 40.00 }
    ]
  }
}
```

## Files

### Backend
- `backend/src/services/debtSimplifier.service.ts` - Core algorithm implementation
- `backend/src/services/debtSimplifier.service.test.ts` - Unit tests
- `backend/src/routes/payments.ts` - API endpoint

### Frontend
- `frontend/src/services/api.ts` - API client method
- `frontend/src/app/trip/[id]/payments/page.tsx` - UI display

## Edge Cases Handled

1. **Empty trip / no members**: Returns empty arrays
2. **Single person with no debts**: Returns empty settlements
3. **All balances are zero**: Returns empty settlements
4. **Very small amounts (< $0.01)**: Filtered out to avoid floating-point issues
5. **Circular debts**: Properly simplified (A→B→C→A becomes minimal transactions)
6. **Decimal amounts**: Properly rounded to 2 decimal places

## Testing

Run the tests with:
```bash
cd backend
npm test -- src/services/debtSimplifier.service.test.ts
```

### Test Cases
- Empty balances
- Single person with zero/non-zero balance
- Two people owing each other
- Chain settlements (A→B→C)
- Circular debts
- Partial settlements
- Zero/near-zero amounts
- Large numbers
- Decimal precision
- Transaction count minimization
- Unsorted input handling
