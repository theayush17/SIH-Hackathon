import { auth, db } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export async function signUpAnonymous(name, phone, email) {
  try {
    console.log("🔹 Starting anonymous signup...");

   
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    console.log("✅ User created:", user.uid);


    await setDoc(doc(db, "users", user.uid), {
      name,
      phone,
      email,
      createdAt: new Date(),
      anonymous: true,
    });

    console.log("✅ User details saved in Firestore");
    return { success: true, uid: user.uid };
  } catch (error) {
    console.error("❌ Error signing up:", error);
    return { success: false, message: error.message };
  }
}