import { NextResponse } from "next/server";
console.log("Weather API KEY:", process.env.NEXT_PUBLIC_WEATHER_API_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") || "Gangtok"; 

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric`;

    console.log("Fetching URL:", url); 

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Weather API error:", errorText);
      return NextResponse.json(
        { error: `Weather API failed: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log("Weather data:", data); 
    return NextResponse.json(data);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}