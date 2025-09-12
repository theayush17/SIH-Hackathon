import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// Fetch all guides
export async function getGuides() {
  const querySnapshot = await getDocs(collection(db, "Guides"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}