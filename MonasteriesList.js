"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function MonasteriesList() {
  const [monasteries, setMonasteries] = useState([]);

  useEffect(() => {
    const colRef = collection(db, "monasteries");
    const unsub = onSnapshot(colRef, (snapshot) => {
        onSnapshot(colRef, (snapshot) => {
            console.log("Snapshot docs:", snapshot.docs.map(d => d.data()));
            setMonasteries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          });
      setMonasteries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub(); // cleanup listener
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Monasteries (Live)</h1>
      {monasteries.length === 0 ? (
        <p>No monasteries found.</p>
      ) : (
        <ul>
          {monasteries.map((m) => (
            <li key={m.id}>
              <h2>{m.name}</h2>
              <p>{m.location}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}