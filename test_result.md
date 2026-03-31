# Validation Notes

Validated in the container on 2026-03-16:

- Public product listing: OK
- Product detail endpoint: OK
- Customer login: OK
- Add to cart: OK
- Cart retrieval/update path wiring: OK
- Checkout/order creation: OK
- Payment success flow endpoint: OK
- Review submission after purchase: OK
- Farmer product creation: OK
- Admin stats endpoint: OK

Main fix applied: backend API include prefixes now use trailing slashes so frontend routes like `/api/products/1`, `/api/cart/items`, `/api/orders/create`, and `/api/reviews/product/1` resolve correctly.
