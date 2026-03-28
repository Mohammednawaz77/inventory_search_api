# Inventory Search API + UI

A polished full-stack assignment submission with a clearly separated folder structure so the backend and frontend responsibilities are obvious during evaluation.

## Folder structure

```text
inventory_ui/
├── backend/
│   ├── data/
│   │   └── inventory.js
│   └── server.js
├── frontend/
│   ├── app.js
│   ├── index.html
│   ├── server.js
│   └── styles.css
├── package.json
└── README.md
```

## Features

- Separate backend API and frontend UI
- `GET /search` API with `q`, `category`, `minPrice`, and `maxPrice`
- Case-insensitive partial search on product names
- Multiple filters can be combined
- All inventory returns when no filters are provided
- Clean empty state and invalid price range handling
- Responsive UI with table-based results

## Run locally

Start the backend:

```bash
npm run start:backend
```

Start the frontend in a second terminal:

```bash
npm run start:frontend
```

Then open `http://localhost:3000`.

## Backend

The backend is intentionally isolated in the `backend/` folder.

- `backend/server.js` exposes:
  - `GET /search`
  - `GET /categories`
- `backend/data/inventory.js` holds the in-memory dataset

### Search logic

1. Normalize `q` and `category` using trimming and lowercase conversion.
2. Parse `minPrice` and `maxPrice` only when values are provided.
3. Reject invalid numeric inputs and invalid price ranges.
4. Filter inventory using:
   - partial name match
   - exact category match
   - minimum price
   - maximum price
5. Return the full dataset when no filters are supplied.

## Frontend

The frontend is intentionally isolated in the `frontend/` folder.

- `frontend/index.html` contains the page structure
- `frontend/styles.css` contains the responsive UI styling
- `frontend/app.js` fetches data from the backend API
- `frontend/server.js` serves the frontend files separately on port `3000`

## Example API calls

```bash
GET http://localhost:3001/search
GET http://localhost:3001/search?q=drill
GET http://localhost:3001/search?category=Machinery&minPrice=500&maxPrice=2500
GET http://localhost:3001/search?q=storage&category=Safety
```

## One performance improvement for large datasets

For a larger inventory, I would move from in-memory filtering to a database or search engine with indexing. A good next step would be PostgreSQL indexes for category and price plus trigram or full-text indexing for partial product-name search.
