import { NextResponse } from "next/server";

type FatSecretFood = {
  food_id?: string;
  food_name?: string;
  brand_name?: string;
  food_description?: string;
};

const parseDescription = (description = "") => {
  const caloriesMatch = description.match(/Calories:\s*([\d.]+)\s*k?cal/i) || description.match(/Calories:\s*([\d.]+)/i);
  const proteinMatch = description.match(/Protein:\s*([\d.]+)\s*g/i);
  const carbsMatch = description.match(/Carbs:\s*([\d.]+)\s*g/i);
  const fatsMatch = description.match(/Fat:\s*([\d.]+)\s*g/i);

  const calories = Math.round(Number(caloriesMatch?.[1] ?? 0));
  const protein = Math.round(Number(proteinMatch?.[1] ?? 0));
  const carbs = Math.round(Number(carbsMatch?.[1] ?? 0));
  const fats = Math.round(Number(fatsMatch?.[1] ?? 0));

  let serving = "1 serving";
  if (description.includes(" - ")) {
    serving = description.split(" - ")[0].trim();
  } else if (description.includes("|")) {
    serving = description.split("|")[0].trim();
  }

  return { calories, protein, carbs, fats, serving };
};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!query) {
    return NextResponse.json({ foods: [] });
  }

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "FatSecret is not configured. Add FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET to Vercel." },
      { status: 503 }
    );
  }

  try {
    const tokenResponse = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials&scope=basic"
    });

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: "FatSecret authentication failed." }, { status: 502 });
    }

    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!token.access_token) {
      return NextResponse.json({ error: "FatSecret returned no access token." }, { status: 502 });
    }

    const apiUrl = new URL("https://platform.fatsecret.com/rest/server.api");
    apiUrl.searchParams.set("method", "foods.search");
    apiUrl.searchParams.set("search_expression", query);
    apiUrl.searchParams.set("format", "json");
    apiUrl.searchParams.set("max_results", "20");

    const foodsResponse = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store"
    });
    if (!foodsResponse.ok) {
      return NextResponse.json({ error: "FatSecret food search failed." }, { status: 502 });
    }

    const data = (await foodsResponse.json()) as { foods?: { food?: FatSecretFood[] | FatSecretFood } };
    const rawFood = data.foods?.food;
    const foodList = Array.isArray(rawFood) ? rawFood : rawFood ? [rawFood] : [];

    const foods = foodList.map((food) => {
      const parsed = parseDescription(food.food_description);
      const displayName = food.brand_name
        ? `${food.food_name} (${food.brand_name})`
        : (food.food_name ?? "Unknown food");

      return {
        id: food.food_id ?? `${displayName}-${Math.random().toString(36).slice(2, 7)}`,
        name: displayName,
        ...parsed
      };
    });

    return NextResponse.json({ foods });
  } catch {
    return NextResponse.json({ error: "Unable to reach FatSecret right now." }, { status: 502 });
  }
}
