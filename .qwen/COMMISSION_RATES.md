# Commission Rates & Loyalty System

## Base Commission
- **Standard** (Windows/Android/Linux): **+13%** from cost
- **Premium** (macOS/iOS): **+15%** from cost

## Loyalty Tiers

| Tier | Discount | Requirements |
|------|----------|--------------|
| 🥉 **Bronze** | 0% | 0 purchases |
| 🥈 **Silver** | 3% | 3+ purchases **OR** 3000₽+ spent |
| 🥇 **Gold** | 5% | 7+ purchases **OR** 10000₽+ spent |
| 💎 **Platinum** | 8% | 15+ purchases **OR** 25000₽+ spent |

## Formula

```
Final Price = Cost × (1 + PlatformRate) × (1 - LoyaltyDiscount)
```

## Examples

| Cost | Platform | Tier | Calculation | Final Price | Savings |
|------|----------|------|-------------|-------------|---------|
| 1000₽ | Standard | Bronze | 1000 × 1.13 × 1.00 | **1130₽** | 0₽ |
| 1000₽ | Premium | Bronze | 1000 × 1.15 × 1.00 | **1150₽** | 0₽ |
| 1000₽ | Standard | Gold | 1000 × 1.13 × 0.95 | **1073.50₽** | 56.50₽ |
| 1000₽ | Premium | Platinum | 1000 × 1.15 × 0.92 | **1058₽** | 92₽ |

## Platform Detection

### Standard (13%)
- Windows
- Android
- Linux

### Premium (15%)
- macOS
- iOS (iPhone/iPad)

## Implementation

### Frontend Detection
```typescript
// frontend/utils/platformDetector.ts
export function detectPlatformGroup(): {
  platform: 'android' | 'pc' | 'ios';
  group: 'standard' | 'premium';
}
```

### Backend Pricing
```typescript
// backend/src/index.ts
const price = product[`price_${platform}` as keyof Product]
// price_android, price_pc, price_ios
```

## Category Priority (Platform-aware)

### Standard (Windows/Android)
1. Steam
2. Epic Games
3. Discord
4. Battle.net
5. Origin/EA

### Premium (macOS/iOS)
1. Telegram Premium
2. Apple Music
3. Spotify
4. Netflix
5. ChatGPT Plus

---

**Last Updated:** 2026-03-08  
**Version:** 2.5
