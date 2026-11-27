import type { CategorySlug } from '@/types'

/**
 * A short buyer's guide shown under each money category's app list (and in the HTML crawlers read).
 * Same light markdown as the blog. Kept general and country-neutral: listings span several markets.
 */
export const categoryGuides: Partial<Record<CategorySlug, string>> = {
  loans: `## How to choose a small-loan app

A good loan app tells you exactly what the loan will cost before you accept, comes from a licensed lender, and only asks for the information it needs. Before you borrow from any app listed here, run through these checks.

- Who is the lender? The app should name the bank or licensed lending company that actually gives you the money. Check that company with your country's financial regulator.
- What is the total cost? Compare the annual percentage rate (APR) and the total amount you'll repay, not just the interest rate. Fees can double the real cost of a short loan.
- When and how do you repay? Look at the due dates, what happens if you pay late, and whether you can repay early without a penalty.
- What does the app ask to access? A lender doesn't need your contacts, photos or call logs.

In India, regulated lenders must give you a Key Facts Statement with the APR and repayment schedule before you sign. We explain what it should contain in [RBI loan app rules](/blog/rbi-digital-lending-rules-loan-apps).

## Red flags

Upfront fees before the money arrives, no named lender, pressure to decide in minutes, and threats or messages to your contacts when a payment is late are all signs to walk away. See [7 warning signs of a fake loan app](/blog/warning-signs-fake-loan-app).

## Frequently asked questions

Are instant loan apps safe? Apps from licensed lenders that clearly show the cost can be, but short loans are usually expensive. Borrow only what you can repay on time, and read our [checklist before taking a loan on your phone](/blog/before-instant-loan-checklist).

Will a loan app affect my credit score? Most licensed lenders report repayments to credit bureaus, so paying on time can help and missing payments will hurt.

Why are some listings marked 18+? You must be an adult to sign a loan agreement, so these listings ask you to confirm your age first.`,

  betting: `## Betting and casino apps: what to check first

Betting and casino apps are for adults only, and whether they're legal depends on where you live. In some countries and states they're fully licensed, in others they're restricted or banned. Check the rules where you are before you sign up.

- Is the operator licensed? A legitimate operator shows its licence and the authority that issued it, usually at the bottom of its website.
- Can you set limits? Good apps let you set deposit, loss and time limits, take a break, or exclude yourself completely.
- How do withdrawals work? Read the withdrawal times, any minimums, and the conditions attached to bonuses before you deposit.
- Is the app from the official store, or the operator's own site? Never install betting apps from links sent in messages or groups.

## Play responsibly

Decide in advance how much you can afford to lose, treat it as the cost of entertainment, and never chase losses. If betting stops being fun or you're spending more than you planned, use the app's limit or self-exclusion tools and talk to a support service in your country.

## Frequently asked questions

Are betting apps legal? It depends on your country and sometimes your state or region. Some places license them, others ban them. Check your local law first.

How do I know a betting app is genuine? It names its licence and regulator, is published by the same company in the app store, and doesn't ask you to deposit to a personal account.

What are bonus wagering requirements? Many bonuses must be bet a number of times before you can withdraw them. Read those terms before accepting a bonus.`,

  trading: `## How to choose a trading app

Trading apps let you buy and sell shares, currencies (forex) and contracts for difference (CFDs). Many forex and CFD traders lose money, especially with leverage, so choose carefully and start small.

- Is the broker regulated? Look up the company with your country's financial regulator, and check that the app in the store is published by that company.
- What does it cost? Compare spreads, commissions, overnight fees and withdrawal fees.
- Does it offer a demo account? Practise with virtual money before risking real money.
- Can you withdraw easily? Make a small deposit and test a withdrawal first.

## Red flags

Guaranteed returns, trading tips from strangers in chat groups, deposits to personal accounts, and fees you must pay before you can withdraw are signs of a scam. Read [how fake trading apps work](/blog/fake-trading-app-scam).

## Frequently asked questions

What is a CFD? A contract that lets you bet on a price going up or down without owning the asset. With leverage, losses can be larger than your deposit, which is why CFDs carry a high risk.

How much do I need to start? Many brokers allow small deposits. Only trade with money you can afford to lose.

Is a trading app the same as investing? Not usually. Short-term trading and long-term investing carry very different risks.`,

  crypto: `## How to choose a crypto app

Crypto prices can rise and fall sharply in hours, and you can lose money. If you decide to buy, use a well-known, registered exchange and protect your account.

- Is the exchange registered where you live? Many countries require crypto exchanges to register with a regulator or financial-intelligence unit.
- How is your account protected? Turn on two-step login with an authenticator app, and use a strong, unique password.
- Who holds your coins? On an exchange, the exchange holds them for you. Moving them to your own wallet gives you control, but you must never lose your recovery phrase.
- What are the fees? Compare trading, deposit and withdrawal fees.

## Red flags

No exchange or app will ever ask for your recovery phrase. Promises of guaranteed returns, "AI trading bots" and investment tips from strangers are common scams. See [how fake trading apps work](/blog/fake-trading-app-scam).

## Frequently asked questions

Is crypto safe to buy? It is legal in many places but highly volatile. Only invest what you can afford to lose.

What is a recovery phrase? A list of words that gives full control of a wallet. Anyone who has it can take your coins, so never share or photograph it.

Do I pay tax on crypto? In many countries, yes. Check the rules where you live.`,

  banking: `## How to choose a banking app

Mobile banking apps make it easy to pay, save and track spending. The most important check is that your money is held by a licensed bank.

- Is it a licensed bank, or a partner of one? Some apps are fintech companies that keep your money with a partner bank. The app should say which.
- Is your money protected? Many countries insure bank deposits up to a limit. Check whether this account is covered.
- How secure is the app? Look for app locks, fingerprint or face login, and instant card freezing.
- What are the fees? Compare monthly, card, ATM and transfer fees.

## Stay safe

Your bank will never ask for your PIN, password or OTP, or ask you to install another app to "fix" your account. Read about [UPI scams and how to avoid them](/blog/upi-scams-2026-how-to-stay-safe).

## Frequently asked questions

Are digital-only banks safe? Licensed digital banks are regulated like traditional banks. Check the licence and deposit protection.

What should I do if I lose my phone? Use another device to freeze your cards and contact your bank, then change your passwords.

Can I use more than one banking app? Yes. Many people keep a separate account for everyday spending.`,

  insurance: `## How to choose an insurance app

Insurance apps let you compare and buy cover in minutes. Price matters, but what really matters is whether a claim gets paid.

- Is the insurer licensed? Check the company with your country's insurance regulator. Comparison apps should name the insurer behind each plan.
- What isn't covered? Read the exclusions, waiting periods and the amount you pay yourself on each claim.
- How are claims handled? Look for a clear claims process and the insurer's record of paying claims.
- Can you cancel? Many policies have a short period after purchase when you can cancel for a refund.

## Frequently asked questions

Is buying insurance through an app safe? Yes, if the insurer is licensed and you receive the full policy document. Keep a copy.

Why are some plans much cheaper? Lower prices often mean more exclusions, a higher excess or lower cover. Compare like for like.

What should I check before a claim? The policy wording, the documents the insurer needs, and the deadline for reporting a claim.`,
}
