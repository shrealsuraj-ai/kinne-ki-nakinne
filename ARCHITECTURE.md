# Kinne Ki Nakinne: V2 Architecture & Product Strategy

## 1. Unified Navigation Strategy
**The Setup:** A persistent Bottom Navigation Bar combined with swipe-able Top Headers.
*   **Bottom Bar:** Controls meta-states (`[Home (The Neighborhoods)]`, `[Create/Go Live]`, `[Inbox]`, `[Profile & Wishlist]`).
*   **Top Header (Swipe-able Tabs):** When on the Home tab, horizontal swipes shift the user between the three core segments:
    *   `The Feed` (Fixed Price / Discovery)
    *   `The Arena` (Live Auctions / High Energy)
    *   `Re-Market` (Second-Hand / Verification)

*Transitions:* Swiping horizontally transitions the complete UI palette. The Feed uses immersive dark mode, The Arena pulses with high-contrast alert colors (Reds/Oranges) for urgency, and Re-Market shifts to clean, well-lit aesthetics (Whites/Emeralds) for transparency.

---

## 2. State Management: Auction vs. Fixed Purchase
Handling the difference between temporary competitive states and immediate transactions requires a bifurcated data approach.

### Fixed Purchase (Standard Transaction)
*   **Mechanism:** Immediate ACID (Atomicity, Consistency, Isolation, Durability) transaction.
*   **Data flow:** Client -> Node.js API -> PostgreSQL. 
*   **Logic:** Request lock on inventory -> Deduct 1 from `Products.stock_quantity` -> Process Payment (Stripe) -> Commit. If payment fails, release the lock.

### Auction Bid (Temporary/Competitive)
*   **Mechanism:** Stream-processed ephemeral state. We cannot hit the SQL database for every $1 bid increase during a 300-viewer frenzy.
*   **Data flow:** Client -> WebSocket -> Redis Pub/Sub & Redis Sorted Sets.
*   **Logic:** 
    *   Redis stores the `current_highest_bid` and `bidder_user_id` in memory.
    *   A Node.js worker listens for the "Auction End" event on a Redis TTL (Time-To-Live) expiry.
    *   **The Finalization:** Only the *winning* bid is asynchronously flushed to PostgreSQL to create an `Order` and trigger the actual Stripe payment capture.

---

## 3. Trust & Safety Protocol
Trust is the currency of our platform. Different segments require tailored safety nets.

### The Arena (Live Auctions)
*   **Pre-Authorization:** Bidders must have a credit card on file with a $5.00 hold to prevent "ghost bidding" (winning and abandoning).
*   **Escrow Processing:** Funds are captured immediately upon winning but held in a Stripe Custom Connect escrow until the buyer confirms delivery.
*   **Moderation:** Real-time toxicity filtering for live chat and automated stream takedowns for illicit goods using AWS Rekognition.

### The Re-Market (Second-Hand)
*   **The 360° Verification Flow:** Sellers cannot upload pre-recorded videos. They must use the in-app camera, guided by an AR overlay requiring a 360° pan, zoom on serial numbers, and bright lighting.
*   **AI Grading:** AWS Rekognition/Custom ML models scan the video to flag scratches, dents, or counterfeit markers.
*   **Dispute Resolution:** If a buyer receives an item differing from the 360° video, the video acts as the immutable source of truth for arbitration.

---

## 4. Revised Technical Stack
To support "Neighborhood" separation, we require cloud services that excel in both VoD (Video on Demand) and ultra-low latency live streaming.

*   **Live Streaming (The Arena):** **AWS IVS (Interactive Video Service)** (Based on Twitch's technology). Guarantees < 2 seconds latency, critical for bidding synchronicity.
*   **VoD (The Feed / Re-Market):** AWS S3 + AWS Elemental MediaConvert + CloudFront edge caching.
*   **Real-Time Data Engine:** **Socket.io** backed by **Upstash (Serverless Redis)** for global, ultra-fast bid broadcasting.
*   **Payments & Escrow:** **Stripe Connect**. Enables split payments (Platform Commission vs. Seller Payout) and Escrow holding.
*   **Computer Vision (Trust & Safety):** **AWS Rekognition Video** for automated policy checking and condition verification.
*   **Backend:** **Node.js (NestJS)** for modular, scalable business logic.
*   **Frontend:** **React Native (Expo)** with native WebRTC bridges for streaming.

---

## 5. The Arena Model: Host-Driven vs. Peer-to-Peer?
**Recommendation: Start "Host-Driven", scale to "Peer-to-Peer".**

If anyone can start a 120-second auction on Day 1, the platform fills with low-quality, empty streams, breaking the "High-Energy Competition" psychology. 

1.  **Phase 1 (Vetted Hosts):** Launch with 50 hand-picked, charismatic sellers (vintage clothing curators, electronics refurbishers, sneakerheads). This establishes the culture, guarantees high viewership per stream, and builds trust.
2.  **Phase 2 (The Earned P2P):** Regular users unlock the "Go Live in The Arena" capability only after successfully completing 10 fixed-price sales in the Re-Market with a > 4.5 star rating. This gamifies seller quality and protects the ecosystem.
