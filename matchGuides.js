import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export async function matchGuides(preferences) {
  try {
    const { language, budget } = preferences;

   
    const snapshot = await getDocs(collection(db, "Guides"));
    const guides = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("Fetched guides:", guides);

    
    const filtered = guides.filter((g) => {
      const langs = Array.isArray(g.languages)
        ? g.languages
        : typeof g.languages === "string"
        ? g.languages.split(",").map((l) => l.trim())
        : [];

      const price = typeof g.price === "number" ? g.price : Number(g.price);

      return langs.includes(language) && price <= budget;
    });

    console.log("Matched guides:", filtered);

    return filtered;
  } catch (error) {
    console.error("Error matching guides:", error);
    return [];
  }
}