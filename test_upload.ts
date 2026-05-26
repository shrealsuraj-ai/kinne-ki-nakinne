import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, "alex3@example.com", "password");
    } catch {
      cred = await createUserWithEmailAndPassword(auth, "alex3@example.com", "password");
    }
    console.log("Signed in uid:", cred.user.uid);
    const productRef = await addDoc(collection(db, 'products'), {
        sellerId: cred.user.uid,
        seller: "Seller",
        title: "Test Video",
        shortHeadline: "",
        brand: "",
        category: "Fashion",
        tags: ["v"],
        description: "Test video Test video",
        longDescription: "Test video Test video",
        keyFeatures: ["v"],
        specifications: {},
        seoTags: ["v"],
        benefits: [],
        shippingInfo: { processingTime: "", deliveryCoverage: "" },
        returnPolicy: "",
        searchMetadata: { keywords: ["v"], brand: "", category: "Fashion" },
        price: parseFloat("120"),
        discount: 0,
        stock: 1,
        listingQualityScore: 100,
        segment: "feed",
        uploadStatus: "uploading",
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        type: "video",
        isVerified: true,
        moderationStatus: "approved"
    });
    console.log("Created product", productRef.id);
    
    await updateDoc(doc(db, 'products', productRef.id), {
      url: "https://www.w3schools.com/html/mov_bbb.mp4",
      uploadStatus: "completed"
    });
    console.log("Updated product");

  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

run();
