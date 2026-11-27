/**
 * Published blog posts. Agents draft in content/drafts/; a person reviews and adds them here.
 * `body` uses `## ` headings, `- ` lists, blank lines between paragraphs, and `[text](/link)` links.
 */
export type PostCategory = 'safety' | 'money' | 'guides' | 'games'

export const postCategories: Array<{ slug: PostCategory; name: string }> = [
  { slug: 'safety', name: 'App safety' },
  { slug: 'money', name: 'Loans & money' },
  { slug: 'guides', name: 'App guides' },
  { slug: 'games', name: 'Game tips' },
]

export interface Post {
  slug: string
  title: string
  excerpt: string
  category: PostCategory
  date: string
  body: string
}

export const posts: Post[] = [
  {
    slug: 'black-friday-fake-shopping-apps',
    title: 'Black Friday 2026: how to spot fake shopping apps and deals',
    excerpt: 'Fake shopping apps and lookalike stores peak around Black Friday. Six checks that tell a real deal from a trap, and what to do if you already paid.',
    category: 'safety',
    date: '2026-11-27',
    body: `Black Friday and Cyber Monday are the busiest shopping days of the year, and scammers plan for them. Alongside fake websites, there are fake shopping apps that copy the look of well-known stores so they can collect your login and card details. The good news: most of them fail a few simple checks.

## Why fake shopping apps work so well right now

Deals really are bigger this week, so a huge discount doesn't feel suspicious. You are also more likely to tap an ad or a link in a message, and to install an app quickly so you don't miss a sale. Scammers use all three of those habits.

## 6 signs a shopping app or deal is fake

- The app isn't in the official store. A link that downloads an APK file, or a message telling you to install the "sale version" of an app, is the biggest warning sign of all.
- The developer name doesn't match the brand. Open the store listing and check who published it. Fake apps use names that are almost right, or add words like "Outlet", "Deals" or "Official Sale".
- The price is impossible. Brand-new phones, sneakers or electronics at 80 to 90% off, with only a few left, are bait.
- It asks for permissions a store doesn't need, such as access to your SMS, contacts, accessibility settings or other apps. See [which permissions are safe to allow](/blog/which-app-permissions-to-allow).
- It only takes unusual payments: bank transfer, gift cards, crypto or a UPI ID belonging to a person instead of a business.
- It has very few or very new reviews, or lots of short five-star reviews posted on the same days.

## Safer ways to shop this week

Type the store's address yourself, or open the store's app from your home screen, instead of tapping links in ads, texts or social posts. Pay with a card or a payment method that offers buyer protection. Turn on two-step login for your main shopping accounts. And if a deal only exists in one message and nowhere on the store's real site, treat it as fake.

## "Your order is on hold" and delivery texts

Around big sales you'll also get messages saying a parcel couldn't be delivered or an order needs confirming. Check the order inside the real store app instead of following the link. We explain this scam in [how to spot fake delivery texts](/blog/fake-delivery-text-scam).

## What to do if you already paid

Contact your bank or card provider straight away and ask them to block the card and dispute the payment. Change the password for any account you entered on the fake app, then uninstall it. In India, report online fraud on the national cybercrime helpline, 1930, or at cybercrime.gov.in. Elsewhere, report it to your national fraud or consumer agency.

## Frequently asked questions

Can a fake app really be in the Play Store or App Store? Rarely, but it happens. Stores remove scam apps when they find them, so being in the store is a good sign, not a guarantee. Still check the developer name and reviews.

Is a website deal safer than an app deal? Neither is automatically safe. What matters is that you reached the real store yourself, rather than through a link someone sent you.

Where can I find shopping apps from real brands? Browse our [shopping apps](/categories/shopping): every listing links to the official store page, never to a downloaded file.`,
  },
  {
    slug: 'upi-scams-2026-how-to-stay-safe',
    title: 'UPI scams in 2026: 6 tricks and how to stay safe',
    excerpt: 'Collect requests disguised as refunds, fake QR codes, screen-sharing apps and more. How each UPI scam works and the habits that stop all of them.',
    category: 'money',
    date: '2026-11-27',
    body: `UPI makes paying anyone take two seconds. That speed is exactly what scammers rely on: most UPI fraud works by getting you to approve something before you've had time to think. Here are the tricks banks and payment companies warn about most often, and the few habits that protect you from all of them.

## The one rule that stops most UPI scams

You never need to enter your UPI PIN to receive money. The PIN is only for sending money or checking your balance. If anyone asks you to enter your PIN to "receive a refund", "claim cashback" or "verify your account", it is a scam.

## 6 common UPI scams

- Collect requests disguised as refunds. A payment request arrives that says "refund" or "cashback". Approving it with your PIN sends money out of your account.
- Fake or swapped QR codes. Scanning a QR code is for paying someone. A code sent to you "to receive money", or a sticker placed over a shop's real code, sends your money to the scammer.
- Screen-sharing apps. A caller pretending to be from your bank asks you to install an app to "fix a problem". These apps let them see your screen, OTPs and banking apps.
- Lookalike UPI IDs. Names that differ by one letter from a real business or person, so the payment looks right at a glance.
- Fake payment screenshots. Sellers are shown an edited screenshot of a "successful" payment that never happened. Always check your own bank or UPI app.
- SIM swap. A scammer gets a duplicate of your SIM and with it your OTPs. If your phone suddenly loses signal for no reason, call your mobile operator.

## Habits that keep you safe

- Never share your UPI PIN or an OTP with anyone, including people who say they're from your bank.
- Decline any payment request you don't recognise. Real refunds arrive without you doing anything.
- Don't install apps because a caller or message tells you to. Banks don't ask you to.
- Before paying, check the name the UPI app shows for the receiver, not just the number or ID.
- Use only official banking and payment apps from the Play Store or App Store. See our [banking apps](/categories/banking).
- Set a daily UPI limit in your app that fits how you actually spend.

## What to do if you've been scammed

Act fast: the sooner you report it, the better the chance of stopping the money. Call your bank's official helpline to block your UPI and dispute the transaction, and report it on the national cybercrime helpline, 1930, or at cybercrime.gov.in. Keep screenshots of the messages, numbers and transaction IDs.

## Frequently asked questions

Do I need my UPI PIN to receive money? No. Receiving money never needs your PIN. Only sending money or checking your balance does.

Can someone take money with just my UPI ID? Not on their own. They need you to approve a request or enter your PIN, which is why the scams above all try to get you to do one of those.

Is it safe to scan QR codes in shops? Yes, if you scan the shop's own code to pay them, and the name shown in your UPI app matches the shop. Be careful of codes that look stuck on top of another one.`,
  },
  {
    slug: 'rbi-digital-lending-rules-loan-apps',
    title: 'RBI loan app rules: what a real lender must show you',
    excerpt: "India's Digital Lending Directions set out what every loan app must tell you up front. Here's what to look for, in plain words, before you accept any loan.",
    category: 'money',
    date: '2026-11-27',
    body: `Borrowing through an app can be quick and fair, or it can go very wrong. In India, the Reserve Bank of India's Digital Lending Directions, 2025 set out what regulated lenders and their apps have to do. Knowing the basics makes it much easier to tell a real lender from a dangerous one.

## Who the rules apply to

The rules cover loans from banks, cooperative banks and non-banking financial companies (NBFCs), including when they lend through a partner app. The lender stays responsible for what its app partners do. So a real loan app should always tell you which regulated bank or NBFC is actually giving you the loan.

## What a legitimate loan app should show you

- The lender's name: the bank or NBFC that actually provides the loan, not just the app's brand.
- A Key Facts Statement (KFS) before you sign. It sets out the loan amount, the term, the full cost and the repayment schedule in one standard format.
- The annual percentage rate (APR). This includes interest and fees, so it is the fairest number for comparing loans.
- The monthly or instalment repayment and any penal charges for paying late.
- If the app shows offers from several lenders, it should show each lender's offer side by side, without pushing you towards one with tricks.

The rules also say lenders must ask about your situation, such as your age, job and income, before lending. Your credit limit shouldn't go up automatically without you asking for it.

## Red flags that mean "walk away"

- No lender name, or the app won't say which bank or NBFC is lending.
- Fees taken before the loan is paid out, or a "processing fee" that must be paid to a personal account.
- No Key Facts Statement, or an APR that's hidden or missing.
- The app wants access to your contacts, photos or call logs.
- Threats, harassment, or messages to your family and friends when a payment is late.

We cover more in [7 warning signs of a fake loan app](/blog/warning-signs-fake-loan-app).

## How to check a lender

Search the lender's name on the RBI's official website to confirm it is a registered bank or NBFC, and check that the app in the store is published by that company or a partner it names on its own website. If something is unclear, don't borrow until it is.

## Frequently asked questions

What is a Key Facts Statement? A one-page summary every regulated lender must give you before the loan, with the amount, term, APR, total cost and repayment schedule in a standard format, so loans are easy to compare.

What is APR and why does it matter? APR is the yearly cost of the loan including fees, not just the interest rate. Two loans with the same interest rate can have very different APRs.

Can a loan app access my contacts? A legitimate lender has no reason to read your contacts, photos or call logs. Refuse those permissions and treat the request as a warning sign.

Where can I compare loan apps? Our [small loans category](/categories/loans) lists lenders with links to their official store pages. Always read the Key Facts Statement in the app before you accept an offer, and see our [loan checklist](/blog/before-instant-loan-checklist).`,
  },
  {
    slug: 'fake-trading-app-scam',
    title: 'Fake trading apps: how the scam works and how to spot one',
    excerpt: 'Fake trading and crypto apps show "profits" you can never withdraw. How the scam works, and how to check any platform in five minutes.',
    category: 'safety',
    date: '2026-11-27',
    body: `Financial regulators in several countries, including SEBI in India, the FCA in the UK and ASIC in Australia, are warning about the same scam: fake trading and crypto apps that show you growing profits, then never let you take your money out.

## How the scam usually works

- Trust first. You're added to a "stock tips" or "trading signals" group on WhatsApp or Telegram, or meet a friendly "investor" on social media or a dating app. Some scams use fake celebrity videos or news articles.
- The app. You're asked to install a trading app or open a website, sometimes from a link instead of an official store.
- Fake profits. Small first deposits show big gains on screen. Sometimes a small withdrawal works, to win your trust.
- Pressure to deposit more. "Special" trades, IPO allotments or VIP levels need a bigger deposit, often to a personal bank account or UPI ID.
- No way out. When you try to withdraw, you're told to pay a "tax", "fee" or "unlock charge" first. The money is gone.

## Red flags

- Guaranteed or very high returns, especially "daily" profits.
- Advice that comes from a chat group or a stranger, not from a regulated broker.
- Deposits to a person's account, a UPI ID or crypto, instead of to the platform's own regulated account.
- Fees you must pay before you can withdraw.
- An app downloaded from a link, or a store listing with a developer name that doesn't match the company.

## How to check a trading platform in five minutes

- Find the company's regulator. In India, check SEBI's registered intermediaries; in the UK, the FCA register; elsewhere, your national regulator.
- Check the regulator's warning list. Many regulators publish lists of known fake platforms.
- Make sure the app in the store is published by that same regulated company.
- Search the platform's name with the words "scam" or "withdrawal".
- Start with an amount you can afford to lose, and test a withdrawal before adding more.

Trading and crypto are risky even on real platforms. Browse [trading apps](/categories/trading) and [crypto apps](/categories/crypto) on OshAds, where every listing links to the official store, and read the risk notice on each listing.

## If you think you've been scammed

Stop paying. Any "fee to withdraw" only adds to the loss. Contact your bank immediately, report it to your regulator and, in India, to the cybercrime helpline 1930 or cybercrime.gov.in. Be wary of "recovery agents" who promise to get your money back for a fee: they're often the same scammers.

## Frequently asked questions

Can a fake trading app be in the Play Store? Fake apps have reached official stores before and are removed when found. Check that the developer is a regulated company, not just that the app is in a store.

Why can I see profits if it's fake? The numbers on screen are made up by the scammers. Nothing is actually traded.

Is a real platform guaranteed to make money? No. Real trading carries a real risk of loss. A platform that promises guaranteed returns is a warning sign in itself.`,
  },
  {
    slug: 'fake-delivery-text-scam',
    title: 'Fake delivery texts: how to spot the parcel scam',
    excerpt: 'Delivery scam texts surge during the holiday season. How to tell a real courier message from a fake one, and what to do if you clicked.',
    category: 'safety',
    date: '2026-11-27',
    body: `"We tried to deliver your parcel. Reschedule here." During sale season almost everyone is waiting for a delivery, so this message feels believable. It is one of the most common scams of the holidays.

## How the scam works

The text or email says a delivery failed, an address is incomplete, or a small fee is due. The link opens a page that looks like a real courier or postal service. It asks you to pay a tiny "redelivery fee" or confirm your details. What it's really after is your card number, bank details or login, and sometimes it asks you to install an app that can read your messages.

## Signs a delivery message is fake

- You weren't expecting anything from that courier, or the message doesn't name the store you ordered from.
- It asks for a fee to redeliver or release a parcel.
- The link is a strange or shortened address, not the courier's real website.
- It creates urgency: "today only", "the parcel will be returned".
- It asks you to install an app or update one through a link.

## What to do instead

Track your parcel from the store's own app or website, where your real order and tracking number are. If you need the courier, type its website address yourself. Never install an app from a link in a message. On Android, keep "install unknown apps" switched off. Our guide to [checking an app is safe](/blog/check-app-safe-before-install) explains why.

## If you clicked or paid

If you entered card details, call your bank to block the card. If you installed an app, uninstall it, then change your banking and email passwords from another device. In India, report it at cybercrime.gov.in or call 1930. You can also forward scam texts to your mobile operator's spam reporting number.

## Frequently asked questions

Do real couriers ask for fees by text? Some genuine customs or duty charges exist, but you can always check them on the courier's official website or app with your tracking number. Never pay through a link in a text.

I only clicked the link and didn't enter anything. Am I safe? Usually, yes. Close the page, don't enter details, and don't install anything. Keep your phone's software up to date.

How do I avoid this during big sales? Keep track of what you ordered and where, and check deliveries only in the store's app. Read our [Black Friday shopping safety guide](/blog/black-friday-fake-shopping-apps).`,
  },
  {
    slug: 'free-games-no-download',
    title: 'Free games you can play in your browser with no download',
    excerpt: 'Quick puzzle and arcade games that run in your browser: no install, no sign-up, nothing to update. Where to play and how to score higher.',
    category: 'games',
    date: '2026-11-27',
    body: `Sometimes you want a five-minute game without installing yet another app, creating an account or giving away permissions. Browser games are perfect for that: open the page and play.

## Why play in the browser

- Nothing to install, so no storage used and no permissions to worry about.
- No sign-up and no personal details.
- Works on your phone, tablet or computer.
- Close the tab and it's gone. Nothing running in the background.

## Free games you can play right now on OshAds

All of these run in your browser at [OshAds games](/#games), free and with no sign-up. Your best scores are saved on your device.

- Farm Stand: pick crops, stock your stall, serve customers and grow your farm with upgrades and helpers.
- Memory Match: flip cards and pair the app logos in as few moves as you can.
- Word Search: find the hidden words against the clock.
- Bubble Shooter: aim, match three of a colour and clear the board.
- Snake: eat, grow longer and don't crash into yourself.
- Color Sort: pour the colours until every tube holds just one.
- Block Puzzle: place the pieces to fill rows and clear lines.

## Tips to get better scores

Each game rewards a little planning. For Color Sort, keep one tube empty for as long as you can: our [Color Sort tips](/blog/color-sort-tips) explain why. In Block Puzzle, protect a clear space for the big pieces; see our [Block Puzzle strategy](/blog/block-puzzle-strategy). In Farm Stand, buy the bigger basket early, then hire a helper so the farm runs while you serve customers.

## Are browser games safe?

Games that run on a well-known site with HTTPS, and don't ask you to download anything, are generally safe. Be careful with pages that suddenly ask you to "install a plugin", "update your player" or download an APK to keep playing. A real browser game never needs that.

## Frequently asked questions

Do I need an account to save my score? No. On OshAds your best scores are saved in your browser on that device.

Do these games work offline? They need the page to load first, so you need a connection to start.

Are the games really free? Yes. There's nothing to buy, and the coins in Farm Stand are just for the game.`,
  },
  {
    slug: 'check-app-safe-before-install',
    title: 'How to check an app is safe before you install it',
    excerpt: 'Five quick checks that take two minutes and catch most fake or risky apps before they reach your phone.',
    category: 'safety',
    date: '2026-11-04',
    body: `Most risky apps give themselves away before you ever tap Install. These checks take about two minutes.

## 1. Install from the official store

Use Google Play or the App Store. Be careful with APK files sent over WhatsApp, Telegram or SMS, because they skip the checks the stores run.

## 2. Check who made it

Open the listing and look at the developer name. Does it match the company you expected? Search for the company's official website and see whether it links to the same app. Fake apps often copy a well-known name and logo with a small change in spelling.

## 3. Read the newest reviews

Sort reviews by newest rather than most helpful. Many short five-star reviews posted close together, next to detailed one-star complaints, is a warning sign.

## 4. Look at the permissions

Ask whether each permission makes sense for what the app does. A torch app has no reason to read your contacts. We cover this in [which app permissions to allow](/blog/which-app-permissions-to-allow).

## 5. Check the privacy policy exists

A real company has a privacy policy with a working contact address. If the link is missing or broken, think twice.

## If something feels wrong

Don't install it. If you've already installed it and shared any banking details, contact your bank straight away. In India you can also call the cyber crime helpline on 1930 or report at cybercrime.gov.in.`,
  },
  {
    slug: 'which-app-permissions-to-allow',
    title: 'Which app permissions should you actually allow?',
    excerpt: 'A plain guide to camera, contacts, location and SMS permissions, and when to say no.',
    category: 'safety',
    date: '2026-11-04',
    body: `When an app asks for a permission, one question usually settles it: does this feature need it?

## Usually fine, when there's a clear reason

- Camera, for scanning a QR code or taking a photo in the app
- Microphone, for voice notes or calls
- Location, for maps, delivery or cab apps, ideally only while using the app
- Notifications, if you actually want the alerts

## Be careful with

- Contacts, which share other people's details as well as yours
- SMS, which can include bank messages and one-time passwords
- Photos and files, where you should pick selected items if your phone offers that
- Accessibility access, which can let an app read your screen and act for you

## Tips that help

- Choose "Only this time" or "While using the app" when you can.
- Deny first. If a feature needs a permission, the app will ask again when you use it.
- Review old apps now and then in your phone's settings, under Privacy or Permissions.

If an app refuses to work at all unless you allow something unrelated to what it does, that's a good reason to remove it.`,
  },
  {
    slug: 'warning-signs-fake-loan-app',
    title: '7 warning signs of a fake loan app',
    excerpt: 'Fake loan apps follow a pattern. Learn the warning signs before you share your details.',
    category: 'money',
    date: '2026-11-04',
    body: `Fake lending apps tend to follow the same pattern. Any one of these signs is reason to stop.

## The warning signs

- It asks for money first. A "processing fee" or "insurance" paid before the loan arrives is a classic scam.
- It can't name its lender. In India a real lending app should tell you which bank or RBI-registered NBFC is behind the loan.
- It wants your contacts or photos. Scam apps use these to shame borrowers into paying.
- It promises approval for anyone, with no checks at all.
- It hides the cost. You should see the interest rate, fees and repayment dates before you agree.
- It came through a link. The app arrived as an APK over WhatsApp, SMS or Telegram.
- It rushes you. Countdown timers and "offer ends today" are there to stop you from thinking.

## What to do

Check the lender's name on the RBI website before you borrow. Read [what to check before taking a loan on your phone](/blog/before-instant-loan-checklist) too.

If you're being threatened or harassed, keep the messages as evidence and report it on 1930 or at cybercrime.gov.in. You can also tell your local police.

This article is general information, not financial advice.`,
  },
  {
    slug: 'before-instant-loan-checklist',
    title: 'What to check before taking a loan on your phone',
    excerpt: 'A short checklist on total cost, fees and repayment, so a quick loan doesn’t become an expensive one.',
    category: 'money',
    date: '2026-11-04',
    body: `Loan apps make borrowing fast, which also makes it easy to skip the details. Run through this list first.

## Look at the total cost

The monthly rate alone doesn't tell you much. Ask how much you'll repay in total, and compare that with the amount you actually receive. Fees taken out at the start mean you get less than the loan amount.

## Read these before you agree

- The annual percentage rate (APR), which includes fees as well as interest
- The processing fee, and whether it's deducted upfront
- Late payment charges
- Whether you can repay early, and if that costs extra
- The exact repayment dates and amounts

## Check who's lending

Find the name of the bank or NBFC on the loan agreement, not just the app's brand name. You should receive the terms in writing before you accept.

## Ask whether you need it

Short-term loans are often expensive. Before you borrow, check whether the amount fits your next month's budget with room to spare. Taking one loan to repay another is usually how debt gets out of control.

This article is general information, not financial advice. Terms differ between lenders, so always confirm them with the lender directly.`,
  },
  {
    slug: 'free-up-phone-storage',
    title: 'Phone storage full? Clear space without deleting your photos',
    excerpt: 'Simple steps for Android and iPhone that free up space in a few minutes.',
    category: 'guides',
    date: '2026-11-04',
    body: `Before you delete anything you care about, try these steps.

## Start with the biggest apps

Your phone can show what's using space. On Android, open Settings and look for Storage. On iPhone, go to Settings, General, then iPhone Storage. Sort by size and remove apps you no longer use.

## Clean up WhatsApp

Forwarded videos and images pile up quickly. WhatsApp has a storage tool under Settings, Storage and data, where you can review and delete large files.

## Clear what's safe to clear

- Old downloads, especially PDFs, videos and installers
- Offline videos and music you've finished with
- Cached data, on Android, for apps that use a lot

## Back up, then remove

Copy photos to a cloud service or a computer. Check they've arrived safely before you delete anything from the phone.

Looking for lighter apps to replace the heavy ones? [Explore apps on OshAds](/explore).`,
  },
  {
    slug: 'color-sort-tips',
    title: 'Color Sort tips: how to solve the puzzle in fewer moves',
    excerpt: 'Keep an empty bottle free, plan your pours, and use these tips to beat your best score.',
    category: 'games',
    date: '2026-11-04',
    body: `Color Sort looks simple, but a couple of careless pours can leave you stuck. Your best score here is the fewest moves.

## How it works

Each bottle holds four units. You can pour only onto the same colour or into an empty bottle, and the pour moves as much of the top colour as fits. You win when every bottle holds a single colour or is empty.

## Tips

- Protect your empty bottles. They're your most useful resource, so don't fill one without a plan.
- Look before you pour. Find the colour that's closest to being complete and work on that first.
- Pour onto matching tops first. Those moves use no empty space.
- Watch for buried colours. If a colour sits at the bottom of several bottles, clear those bottles early.

## Got stuck?

Some random deals are harder than others, and a few may have no solution. If the game says no moves are left, tap New game and try again.

[Play Color Sort](/#games)`,
  },
  {
    slug: 'block-puzzle-strategy',
    title: 'Block Puzzle strategy: keep the board clear for longer',
    excerpt: 'Where to place big pieces, why edges matter, and how to score bigger line clears.',
    category: 'games',
    date: '2026-11-04',
    body: `In Block Puzzle you place three pieces at a time on an 8×8 board. Full rows and columns clear. The game ends when none of your remaining pieces fits.

## Tips

- Always leave room for the big square. The 3×3 piece needs a large open area, and it ends more games than any other piece.
- Build from the edges. Keep open space together in one area rather than scattered in small gaps.
- Look at all three pieces first. The order you place them in matters as much as where.
- Clear several lines at once. Points grow quickly with each extra line, so two lines together score more than two lines separately.
- Don't rush single clears. If the board is mostly empty, set up a bigger clear instead.

[Play Block Puzzle](/#games)`,
  },
]
