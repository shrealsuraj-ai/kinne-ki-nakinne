# Security Specification - Kinne Ki Nakinne?

## Data Invariants
1. Products must have a valid sellerId matching the authenticated creator.
2. Bids must be higher than the current highest bid stored in the bid document (though Firestore rules can only check the document being written, `getAfter` or `existsAfter` can be used to ensure atomicity if we updated the product's highest bid, but here we just append to a list). Actually, the app just adds to `bids` collection.
3. Chat messages can only be read/written by participants of the conversation.
4. User roles (admins, sellers, casual_users) can only be managed by admins. Users cannot promote themselves.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a product with someone else's `sellerId`.
2. **Privilege Escalation**: Attempt to create a document in `admins/` as a normal user.
3. **Shadow Update**: Attempt to update a product with an extra field `isVerified: true`.
4. **ID Poisoning**: Attempt to create a bid with a 200KB string as the `productId`.
5. **Orphaned Bid**: Attempt to create a bid for a non-existent `streamId`.
6. **Eavesdropping**: Attempt to read a conversation where the user is not a participant.
7. **Ghost Message**: Attempt to send a message to a conversation the user is not in.
8. **Negative Bid**: Attempt to place a bid with a negative amount.
9. **Spam Creation**: Attempt to create 1000 products in a second (rate limiting is hard in rules but we can check `request.time`).
10. **Immutable Tampering**: Attempt to change `createdAt` on an existing product.
11. **PII Leak**: Attempt to list all users in `users/` collection.
12. **Status Shortcut**: Attempt to skip moderation by setting `moderationStatus: 'approved'` if it's supposed to be 'pending'.

## Test Runner
(This is a conceptual mapping for now, I will implement the rules to block these).
