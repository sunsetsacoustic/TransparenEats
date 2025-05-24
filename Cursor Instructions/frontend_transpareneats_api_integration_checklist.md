# TransparenEats Frontend Integration Checklist

This checklist guides you through refactoring your frontend to use the new TransparenEats API backend.

---

## 1. Environment Setup
- [x] Add a `.env` variable in `web/.env`:
  - `VITE_BACKEND_URL=https://your-backend-url.onrender.com`
- [x] In your API service, use `import.meta.env.VITE_BACKEND_URL` to construct API URLs.
- [x] Ensure backend CORS allows requests from your Vercel frontend domain.

## 2. API Service Refactor (`web/src/api.ts`)
- [x] Create `web/src/api.ts`.
- [x] Install axios in the frontend: `npm install axios`.
- [x] Implement `fetchProductData(barcode)` to call `GET /api/products/:barcode` on your backend.
- [x] Handle both success and error responses, including the `suggestions` field.
- [x] Implement `contributeProduct(barcode, data)` to POST to `/api/contribute/product/:barcode` with `multipart/form-data`.
- [x] In `fetchProductData`, prefer backend fields (`ingredients_list`, `flagged_additives`). If missing, fall back to client-side extraction from `ingredients_raw`.
- [x] Export all API functions for use in your components.

## 3. Main Application Logic Update (`web/src/App.tsx`)
- [x] Refactor to use the new `fetchProductData` from `api.ts`.
- [x] Update state management to handle:
  - `productData`
  - `ingredients`
  - `flaggedAdditives`
  - `error`
  - `loading`
  - `apiSource`
  - `isFromCache`
  - `notFoundSuggestions`
- [x] When a product is not found (`success: false`), set a state variable (e.g., `showContributionForm`) to display the user contribution form.
- [x] Pass the barcode and any suggestions to the contribution form.

## 4. User Contribution Component (`web/src/components/UserContributionForm.tsx`)
- [x] Create a new component for user contributions.
- [x] Form fields: product name (required), brand (optional), image upload (optional).
- [x] On submit, call `contributeProduct` from `api.ts` with the form data.
- [x] Show loading, success, and error states.
- [x] On success, display a thank you message and optionally reset/hide the form.

## 5. Displaying New Information in the UI
- [x] Show `apiSource` and `isFromCache` in the product details UI.
- [x] If `notFoundSuggestions` are present, display them to the user when a product is not found.

## 6. Error Handling
- [x] Ensure all API calls have robust error handling and user-friendly error messages.
- [x] Handle network errors, backend errors, and validation errors in forms.

## 7. Important Considerations
- [x] Confirm CORS is enabled for your frontend domain in the backend.
- [x] Remove or disable any direct calls to external APIs from the frontend; all data should come from your backend.
- [ ] Test the full flow: barcode scan → fetch product → not found → user contribution → backend receives data.

---

**Use this checklist to track your progress as you refactor and integrate your frontend with the new TransparenEats API.** 