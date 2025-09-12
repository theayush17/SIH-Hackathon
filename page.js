"use client";

import { useState } from "react";
import { signUpAnonymous } from "../../lib/auth";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await signUpAnonymous(form.name, form.phone, form.email);
    setMessage(res.success ? "Signup successful!" : res.message);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Signup</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          type="email"
          name="email"
          placeholder="Email (optional)"
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Sign Up
        </button>
      </form>
      <p className="mt-4">{message}</p>
    </div>
  );
}