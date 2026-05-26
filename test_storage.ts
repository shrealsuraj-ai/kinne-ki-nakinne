import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function run() {
  try {
    const storageRef = ref(storage, 'test.txt');
    await uploadString(storageRef, 'hello world');
    const url = await getDownloadURL(storageRef);
    console.log("Success:", url);
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}
run();
