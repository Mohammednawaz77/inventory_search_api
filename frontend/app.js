const API_BASE_URL =
  window.__API_BASE_URL__ ||
  document.documentElement.dataset.apiBaseUrl ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

const filtersForm = document.getElementById("filtersForm");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const minPriceInput = document.getElementById("minPriceInput");
const maxPriceInput = document.getElementById("maxPriceInput");
const validationMessage = document.getElementById("validationMessage");
const resetButton = document.getElementById("resetButton");
const resultsBody = document.getElementById("resultsBody");
const resultsState = document.getElementById("resultsState");
const activeFilters = document.getElementById("activeFilters");
const resultsCount = document.getElementById("resultsCount");
const resultsHeading = document.getElementById("resultsHeading");
const inventoryCount = document.getElementById("inventoryCount");
const categoryCount = document.getElementById("categoryCount");

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function setValidation(message = "") {
  validationMessage.textContent = message;
  validationMessage.hidden = !message;
}

function setState(message = "", type = "") {
  resultsState.textContent = message;
  resultsState.className = "results-state";
  resultsState.hidden = !message;

  if (message && type) {
    resultsState.classList.add(type);
  }
}

function buildQueryParams() {
  const formData = new FormData(filtersForm);
  const params = new URLSearchParams();

  for (const [key, value] of formData.entries()) {
    const trimmed = String(value).trim();
    if (trimmed) {
      params.set(key, trimmed);
    }
  }

  return params;
}

function renderActiveFilters(filters) {
  const chips = [];
  activeFilters.innerHTML = "";

  if (filters.q) {
    chips.push(`Query: ${filters.q}`);
  }
  if (filters.category) {
    chips.push(`Category: ${filters.category}`);
  }
  if (filters.minPrice) {
    chips.push(`Min: ${formatCurrency(Number(filters.minPrice))}`);
  }
  if (filters.maxPrice) {
    chips.push(`Max: ${formatCurrency(Number(filters.maxPrice))}`);
  }

  if (!chips.length) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = "No filters applied";
    activeFilters.append(chip);
    return;
  }

  chips.forEach((chipText) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = chipText;
    activeFilters.append(chip);
  });
}

function renderResults(items) {
  if (!items.length) {
    resultsBody.innerHTML = "";
    setState("No results found. Try broadening your filters or changing the product name.", "empty");
    return;
  }

  setState("");
  resultsBody.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td>
            <div class="item-cell">
              <span class="item-name">${item.name}</span>
              <span class="item-id">${item.id}</span>
            </div>
          </td>
          <td>${item.category}</td>
          <td>${item.supplier}</td>
          <td>${item.location}</td>
          <td>${item.stock}</td>
          <td class="price">${formatCurrency(item.price)}</td>
        </tr>
      `
    )
    .join("");
}

async function loadCategories() {
  const response = await fetch(`${API_BASE_URL}/categories`);
  const data = await response.json();

  data.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  });

  inventoryCount.textContent = data.totalInventory;
  categoryCount.textContent = data.categories.length;
}

async function fetchResults() {
  const minPrice = minPriceInput.value.trim();
  const maxPrice = maxPriceInput.value.trim();

  setValidation("");

  if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
    setState("");
    setValidation("Invalid price range: minimum price cannot be greater than maximum price.");
    resultsBody.innerHTML = "";
    return;
  }

  const params = buildQueryParams();
  const query = params.toString();
  const response = await fetch(`${API_BASE_URL}/search${query ? `?${query}` : ""}`);
  const data = await response.json();

  if (!response.ok) {
    resultsBody.innerHTML = "";
    renderActiveFilters({
      q: searchInput.value.trim(),
      category: categorySelect.value.trim(),
      minPrice,
      maxPrice
    });
    resultsCount.textContent = "0 items";
    resultsHeading.textContent = "Search results";
    setState(data.error || "Something went wrong while searching inventory.", "error");
    return;
  }

  resultsCount.textContent = `${data.total} item${data.total === 1 ? "" : "s"}`;
  resultsHeading.textContent = query ? "Filtered inventory" : "All inventory";
  renderActiveFilters(data.filters);
  renderResults(data.results);
}

filtersForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await fetchResults();
});

resetButton.addEventListener("click", async () => {
  filtersForm.reset();
  setValidation("");
  await fetchResults();
});

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadCategories();
    await fetchResults();
  } catch (error) {
    resultsBody.innerHTML = "";
    setState("Unable to reach the backend API. Start the backend server on port 3001.", "error");
  }
});
