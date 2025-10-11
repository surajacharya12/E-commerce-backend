# API Endpoints Documentation

## Base URL

- **Development:** `http://localhost:3001`
- **Production:** `https://your-api-domain.vercel.app`

## Health Check

- `GET /` - API status check
- `GET /health` - Detailed health check with database status

## Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify` - Email verification
- `POST /forgot-password/request` - Request password reset
- `POST /forgot-password/verify` - Verify reset code
- `POST /forgot-password/reset` - Reset password

## Categories

- `GET /categories` - Get all categories
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

## Sub Categories

- `GET /subCategories` - Get all subcategories
- `POST /subCategories` - Create subcategory
- `PUT /subCategories/:id` - Update subcategory
- `DELETE /subCategories/:id` - Delete subcategory

## Brands

- `GET /brands` - Get all brands
- `POST /brands` - Create brand
- `PUT /brands/:id` - Update brand
- `DELETE /brands/:id` - Delete brand

## Products

- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

## Orders

- `GET /orders` - Get all orders
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create order
- `PUT /orders/:id` - Update order status
- `DELETE /orders/:id` - Delete order

## Users

- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Cart

- `GET /cart/:userId` - Get user cart
- `POST /cart/add` - Add item to cart
- `PUT /cart/update` - Update cart item
- `DELETE /cart/remove` - Remove item from cart
- `DELETE /cart/clear/:userId` - Clear cart

## Favorites

- `GET /favorites/:userId` - Get user favorites
- `POST /favorites/add` - Add to favorites
- `DELETE /favorites/remove` - Remove from favorites

## Chats

- `GET /chats/admin/all` - Get all customer chats (admin)
- `GET /chats/:id` - Get specific chat
- `POST /chats/:id/message` - Send message
- `PATCH /chats/:id/status` - Update chat status

## Notifications

- `GET /notification` - Get all notifications
- `POST /notification` - Create notification
- `PUT /notification/:id` - Update notification
- `DELETE /notification/:id` - Delete notification

## Coupons

- `GET /couponCodes` - Get all coupons
- `POST /couponCodes` - Create coupon
- `PUT /couponCodes/:id` - Update coupon
- `DELETE /couponCodes/:id` - Delete coupon

## Discounts

- `GET /discounts` - Get all discounts
- `POST /discounts` - Create discount
- `PUT /discounts/:id` - Update discount
- `DELETE /discounts/:id` - Delete discount

## Stores

- `GET /stores` - Get all stores
- `POST /stores` - Create store
- `PUT /stores/:id` - Update store
- `DELETE /stores/:id` - Delete store

## Posters

- `GET /posters` - Get all posters
- `POST /posters` - Create poster
- `PUT /posters/:id` - Update poster
- `DELETE /posters/:id` - Delete poster

## Variants & Variant Types

- `GET /variants` - Get all variants
- `GET /variantTypes` - Get all variant types
- `POST /variants` - Create variant
- `POST /variantTypes` - Create variant type

## Payment

- `POST /payment/create-intent` - Create payment intent
- `POST /payment/confirm` - Confirm payment

## Ratings

- `GET /ratings/:productId` - Get product ratings
- `POST /ratings` - Add rating
- `PUT /ratings/:id` - Update rating
- `DELETE /ratings/:id` - Delete rating

## File Uploads

All file uploads are handled through Cloudinary integration:

- Product images: `/image/products/`
- Category images: `/image/category/`
- Poster images: `/image/poster/`

## Response Format

All API responses follow this format:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": {} // Response data
}
```

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
