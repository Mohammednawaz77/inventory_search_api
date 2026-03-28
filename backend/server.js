const http = require("http");
const { URL } = require("url");
const { inventory } = require("./data/inventory");

const PORT = process.env.PORT || 3001;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(payload));
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function filterInventory(searchParams) {
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const category = (searchParams.get("category") || "").trim().toLowerCase();
  const minPrice = toNumber(searchParams.get("minPrice"));
  const maxPrice = toNumber(searchParams.get("maxPrice"));

  if (Number.isNaN(minPrice) || Number.isNaN(maxPrice)) {
    return { error: "minPrice and maxPrice must be valid numbers." };
  }

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return { error: "minPrice cannot be greater than maxPrice." };
  }

  const results = inventory.filter((item) => {
    const matchesQuery = !q || item.name.toLowerCase().includes(q);
    const matchesCategory = !category || item.category.toLowerCase() === category;
    const matchesMin = minPrice === null || item.price >= minPrice;
    const matchesMax = maxPrice === null || item.price <= maxPrice;

    return matchesQuery && matchesCategory && matchesMin && matchesMax;
  });

  return {
    results,
    filters: {
      q: searchParams.get("q") || "",
      category: searchParams.get("category") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || ""
    },
    total: results.length
  };
}

const server = http.createServer((request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    response.end();
    return;
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && requestUrl.pathname === "/") {
    sendJson(response, 200, {
      name: "Inventory Search API",
      status: "running",
      routes: {
        search: "/search",
        categories: "/categories"
      },
      example: "/search?q=drill&category=Machinery&minPrice=100&maxPrice=2000"
    });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/search") {
    const payload = filterInventory(requestUrl.searchParams);

    if (payload.error) {
      sendJson(response, 400, payload);
      return;
    }

    sendJson(response, 200, payload);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/categories") {
    const categories = [...new Set(inventory.map((item) => item.category))].sort();
    sendJson(response, 200, { categories, totalInventory: inventory.length });
    return;
  }

  sendJson(response, 404, { error: "Route not found." });
});

server.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
