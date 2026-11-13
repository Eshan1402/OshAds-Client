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
