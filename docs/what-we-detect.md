# What Vibesweep Actually Detects

## The Big Misunderstanding

**Vibesweep doesn't hate AI code. We detect AI-generated WASTE.**

Think of it like this:
- When you use AI to write code, it often generates 130-170% of what you actually need
- The extra 30-70% is waste: dead code, duplicates, verbose comments
- Vibesweep finds that waste so you can remove it

## What We Flag as Waste ❌

### 1. Dead Code
```javascript
// AI often generates unused helper functions
function validateEmail(email) { ... }  // Never called
function formatDate(date) { ... }      // Never called
const UNUSED_CONSTANT = 42;            // Never referenced
```

### 2. Duplications
```javascript
// AI loves to create multiple versions
function formatCurrency(amount) { return '$' + amount }
function formatMoney(value) { return '$' + value }
function displayPrice(price) { return '$' + price }
```

### 3. Verbose AI Comments
```javascript
// This function calculates the sum of two numbers
// It takes two parameters: a and b
// It returns the sum of a and b
function add(a, b) {
  return a + b;  // Return the sum
}
```

### 4. Placeholder Code
```javascript
// TODO: Implement error handling
// FIXME: Add validation
// TODO: Add tests
console.log('Debug:', data);  // Left in production
```

## What We DON'T Flag ✅

### Good AI Code Passes Through Clean:
- Working business logic
- Efficient implementations
- Used functions and variables
- Proper abstractions
- Clean, necessary code

### Example of GOOD AI code:
```javascript
// Clean, used, efficient - NOT FLAGGED
export function processPayment(amount, currency) {
  const fee = calculateFee(amount);
  const total = amount + fee;
  
  return {
    amount,
    fee,
    total,
    currency,
    timestamp: Date.now()
  };
}
```

## Understanding Your Score

- **0-20% waste**: Excellent! Your AI code is clean
- **20-40% waste**: Normal range, some cleanup needed
- **40-60% waste**: Significant bloat, cleanup recommended
- **60%+ waste**: Major issues, lots of dead code

## Real Example

When we analyze a project and show:
```
Total files: 100
Waste: 35%
Good code: 65%
```

This means:
- 65% of your code is GOOD and should stay
- 35% is waste that can be removed
- You'll have a cleaner, faster codebase

## The Bottom Line

Vibesweep is a cleanup tool, not a code shamer. We help you:
1. Keep the good code your AI generated
2. Remove the waste it added
3. Ship cleaner, faster applications

We're pro-AI, anti-bloat. Use AI to code faster, use Vibesweep to code cleaner.