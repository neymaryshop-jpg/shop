# 💰 Commission Rates & Loyalty System

## Base Commission Rates (Markup from Cost)

| Platform Group | Commission | Description |
|----------------|------------|-------------|
| **Standard** (Windows/Android/Linux) | **+13%** | Gaming focus: Steam, Epic, Discord |
| **Premium** (macOS/iOS) | **+15%** | Apple/Telegram ecosystem |

## 🎯 Loyalty System Tiers

| Tier | Badge | Discount | Min Purchases | Min Spent |
|------|-------|----------|---------------|-----------|
| 🥉 **Bronze** | 🥉 | 0% | 0 | 0₽ |
| 🥈 **Silver** | 🥈 | 3% | 3 | 3,000₽ |
| 🥇 **Gold** | 🥇 | 5% | 7 | 10,000₽ |
| 💎 **Platinum** | 💎 | 8% | 15 | 25,000₽ |

## Price Calculation Formula

```
Final Price = Cost × (1 + PlatformRate) × (1 - LoyaltyDiscount)
```

## Example Calculation

```typescript
import { 
  calculateFinalPrice, 
  calculateCommission, 
  calculateLoyaltyDiscount,
  getLoyaltyTier,
  getLoyaltyBadge
} from './utils/platformDetector'

// Base cost: 1000₽
const cost = 1000

// Standard platform (+13%)
const standardPrice = calculateFinalPrice(1000, 'standard', { tier: 'bronze', discount: 0, purchasesCount: 0, totalSpent: 0 })
// 1000 × 1.13 × 1.00 = 1130₽

// Premium platform (+15%)
const premiumPrice = calculateFinalPrice(1000, 'premium', { tier: 'bronze', discount: 0, purchasesCount: 0, totalSpent: 0 })
// 1000 × 1.15 × 1.00 = 1150₽

// Gold loyalty member (5% discount) on Standard
const goldLoyalty = getLoyaltyTier(7, 10000) // Returns { tier: 'gold', discount: 5 }
const goldPrice = calculateFinalPrice(1000, 'standard', goldLoyalty)
// 1000 × 1.13 × 0.95 = 1073.50₽ (save 56.50₽!)

// Platinum loyalty member (8% discount) on Premium
const platinumLoyalty = getLoyaltyTier(15, 25000) // Returns { tier: 'platinum', discount: 8 }
const platinumPrice = calculateFinalPrice(1000, 'premium', platinumLoyalty)
// 1000 × 1.15 × 0.92 = 1058₽ (save 92₽!)
```

## Full Calculation Breakdown

```typescript
// Example: Cost 5000₽, Standard platform, Gold loyalty

const cost = 5000
const group = 'standard'
const loyalty = getLoyaltyTier(7, 10000) // Gold tier

// Step 1: Base commission
const commission = calculateCommission(cost, group)
// 5000 × 0.13 = 650₽

// Step 2: Price with commission
const priceWithCommission = cost + commission
// 5000 + 650 = 5650₽

// Step 3: Loyalty discount
const discount = calculateLoyaltyDiscount(priceWithCommission, loyalty)
// 5650 × 0.05 = 282.50₽

// Step 4: Final price
const finalPrice = priceWithCommission - discount
// 5650 - 282.50 = 5367.50₽

// Or use one function:
const finalPrice = calculateFinalPrice(cost, group, loyalty)
// 5000 × 1.13 × 0.95 = 5367.50₽
```

## Loyalty Progress

```typescript
// Check current tier
const currentTier = getLoyaltyTier(5, 7500)
console.log(`${getLoyaltyBadge(currentTier.tier)} ${getLoyaltyDisplayName(currentTier.tier)}`)
// 🥈 Silver (3% discount)

// Next tier: Gold (needs 7 purchases OR 10,000₽ spent)
const nextTier = 'gold'
const progressPurchases = Math.min(100, (currentTier.purchasesCount / LOYALTY_TIERS[nextTier].minPurchases) * 100)
const progressSpent = Math.min(100, (currentTier.totalSpent / LOYALTY_TIERS[nextTier].minSpent) * 100)
console.log(`Progress to Gold: ${Math.max(progressPurchases, progressSpent)}%`)
```

## Implementation Files

- `frontend/utils/platformDetector.ts` - Main logic
- `frontend/context/LoyaltyContext.tsx` - React context (to be created)
- `backend/src/routes/loyalty.ts` - Backend API (to be created)

## API Endpoints (Planned)

```
GET  /api/loyalty/tier          - Get user's loyalty tier
GET  /api/loyalty/progress       - Get progress to next tier
POST /api/loyalty/apply          - Apply loyalty discount to order
GET  /api/loyalty/history        - Get loyalty history
```

## Notes

- Loyalty discounts stack on top of platform commission
- Tier is determined by EITHER purchases count OR total spent (whichever is higher)
- Backend may override rates based on product category
- Loyalty status stored in user profile and synced to localStorage
