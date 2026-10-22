import type { CategorySlug } from '@/types'

/**
 * OshAds clients, from "Direct Campaign for web Sheet" (21 Oct 2026): name, website and LinkedIn as supplied.
 * Duplicate rows and payout-model variants are one brand each (Loan112, Rupee112, 22 bet, Dupoin / Dupoin Markets,
 * Anytime Rupee CPR/CPD, Salary112 CPR, Licious RT). "Trading Arena CPI" has no website, so it isn't listed.
 * Bit2me's website and LinkedIn columns were swapped in the sheet and are corrected here; LinkedIn links without
 * https:// have it added; tracking parameters are dropped from Licious' URL. `country` is set only where the
 * brand's market is clear. `logo` is the official store icon or the brand site's own icon, in public/logos.
 */
export interface Brand {
  name: string
  website: string
  linkedin?: string
  category: CategorySlug
  country?: string
  logo?: string
}

export const brands: Brand[] = [
  { name: 'Dupoin Markets', website: 'https://dupoin.com/en', linkedin: 'https://www.linkedin.com/company/dupoin/home/', category: 'trading', logo: '/logos/dupoin-markets.png' },
  { name: 'KVB', website: 'https://www.kvbplus.com/en', linkedin: 'https://www.linkedin.com/company/kvbofficial/home/', category: 'trading', logo: '/logos/kvb.png' },
  { name: 'Vantage', website: 'https://www.vantagemarkets.com/en/', linkedin: 'https://www.linkedin.com/company/vantagemarkets/home/', category: 'trading', logo: '/logos/vantage.png' },
  { name: 'Navi', website: 'https://navi.com/', linkedin: 'https://www.linkedin.com/company/go-navi/home/', category: 'loans', country: 'India', logo: '/logos/navi.png' },
  { name: 'Horacredit', website: 'https://horacredit.ro/', linkedin: 'https://www.linkedin.com/company/hora-credit-ifn-s.a./home/', category: 'loans', country: 'Romania', logo: '/logos/horacredit.png' },
  { name: 'Prefr', website: 'https://prefr.com/', linkedin: 'https://www.linkedin.com/company/prefr-in/home/', category: 'loans', country: 'India', logo: '/logos/prefr.png' },
  { name: '123 greeting', website: 'https://www.123greetings.com/', linkedin: 'https://www.linkedin.com/company/123greetings-dot-com/home/', category: 'lifestyle', logo: '/logos/123-greeting.png' },
  { name: 'Licious', website: 'https://www.licious.in/', linkedin: 'https://www.linkedin.com/company/licious/home/', category: 'food', country: 'India', logo: '/logos/licious.png' },
  { name: 'Policy bazaar', website: 'https://www.policybazaar.com/', linkedin: 'https://www.linkedin.com/company/policybazaar/home/', category: 'insurance', country: 'India', logo: '/logos/policy-bazaar.png' },
  { name: 'Ultra play', website: 'https://www.ultraplay.in/', linkedin: 'https://www.linkedin.com/company/ultra-play-ott/home/', category: 'entertainment', country: 'India', logo: '/logos/ultra-play.png' },
  { name: 'Ultra Jhakaas', website: 'https://www.ultrajhakaas.com/', linkedin: 'https://www.linkedin.com/company/ultrajhakaas/home/', category: 'entertainment', country: 'India', logo: '/logos/ultra-jhakaas.png' },
  { name: 'Jigri', website: 'https://www.jigri.app/', category: 'social', country: 'India', logo: '/logos/jigri.png' },
  { name: 'Yap club', website: 'https://www.yapclub.app/', category: 'social', country: 'India', logo: '/logos/yap-club.png' },
  { name: 'Rupee112', website: 'https://www.rupee112.com/', linkedin: 'https://www.linkedin.com/company/rupee112/home/', category: 'loans', country: 'India', logo: '/logos/rupee112.png' },
  { name: 'Loan112', website: 'https://www.loan112.com/', linkedin: 'https://www.linkedin.com/company/loan112/home/', category: 'loans', country: 'India', logo: '/logos/loan112.png' },
  { name: 'Bharat Loan', website: 'https://www.bharatloan.com/', linkedin: 'https://www.linkedin.com/company/bharatloan', category: 'loans', country: 'India', logo: '/logos/bharat-loan.png' },
  { name: 'RupeeOnTime', website: 'https://rupeeontime.com/', linkedin: 'https://linkedin.com/company/rupee-on-time/', category: 'loans', country: 'India', logo: '/logos/rupeeontime.png' },
  { name: 'Mpokket', website: 'https://www.mpokket.in/', linkedin: 'https://www.linkedin.com/company/mpokket/home/', category: 'loans', country: 'India', logo: '/logos/mpokket.png' },
  { name: 'Instamoney', website: 'https://www.instamoney.app/', linkedin: 'https://www.linkedin.com/showcase/instamoneyapp/home/', category: 'loans', country: 'India', logo: '/logos/instamoney.png' },
  { name: 'Payme', website: 'https://web.paymeindia.in/', linkedin: 'https://www.linkedin.com/company/payme-india/home/', category: 'loans', country: 'India', logo: '/logos/payme.png' },
  { name: 'Fatakpay', website: 'https://www.fatakpay.com/', linkedin: 'https://www.linkedin.com/company/fatakpay/home/', category: 'loans', country: 'India', logo: '/logos/fatakpay.png' },
  { name: 'Moneyman', website: 'https://moneyman.ru/', category: 'loans', country: 'Russia' },
  { name: 'Compobet', website: 'https://campobet.com/', category: 'betting' },
  { name: 'Betinia', website: 'https://betinia.com/', category: 'betting' },
  { name: 'Mb Bank', website: 'https://mbbank.com.vn/', linkedin: 'https://www.linkedin.com/company/mbbank/home/', category: 'banking', country: 'Vietnam', logo: '/logos/mb-bank.png' },
  { name: 'TAMBADANA', website: 'https://tambadana.my/en', linkedin: 'https://www.linkedin.com/company/tambadana/home/', category: 'loans', country: 'Malaysia', logo: '/logos/tambadana.png' },
  { name: 'Tooniebet', website: 'https://tooniebet.ca/ca/', category: 'betting', country: 'Canada' },
  { name: 'XM trading', website: 'https://www.xm.com/', linkedin: 'https://www.linkedin.com/company/xm-global', category: 'trading', logo: '/logos/xm-trading.png' },
  { name: 'Bingo plus', website: 'https://bingoplus.com/', linkedin: 'https://www.linkedin.com/company/wearebingoplus/home/', category: 'betting', country: 'Philippines' },
  { name: 'MoneyView', website: 'https://moneyview.in/', linkedin: 'https://www.linkedin.com/company/money-view/home/', category: 'loans', country: 'India', logo: '/logos/moneyview.png' },
  { name: 'Afropari', website: 'https://afropari.partners/', linkedin: 'https://www.linkedin.com/company/afropari-partners/home/', category: 'betting', logo: '/logos/afropari.png' },
  { name: 'Donro', website: 'https://don.ro/ro/', linkedin: 'https://www.linkedin.com/company/donro-financial/home/', category: 'loans', country: 'Romania' },
  { name: 'BE', website: 'https://be.com.vn/', linkedin: 'https://www.linkedin.com/company/be-groupjsc/home/', category: 'mobility', country: 'Vietnam', logo: '/logos/be.png' },
  { name: 'Zype', website: 'https://www.getzype.com/', linkedin: 'https://www.linkedin.com/company/zypeapp/home/', category: 'loans', country: 'India', logo: '/logos/zype.png' },
  { name: 'GG Vegas', website: 'https://signup.ggvegas.com/', category: 'betting' },
  { name: 'Mashreq', website: 'https://www.mashreq.com/en/uae/neo/', linkedin: 'https://www.linkedin.com/company/mashreq-uae/home/', category: 'banking', country: 'United Arab Emirates', logo: '/logos/mashreq.png' },
  { name: 'Anytime Rupee', website: 'https://anytimerupee.com/', linkedin: 'https://www.linkedin.com/company/anytimerupee/home/', category: 'loans', country: 'India', logo: '/logos/anytime-rupee.png' },
  { name: 'Keebu', website: 'https://keebu.com/', category: 'entertainment', logo: '/logos/keebu.png' },
  { name: 'DHgate', website: 'https://www.dhgate.com/', linkedin: 'https://www.linkedin.com/company/dhgate/home/', category: 'shopping', logo: '/logos/dhgate.png' },
  { name: 'Play UZU', website: 'https://www.playuzu.com/', linkedin: 'https://www.linkedin.com/company/playuzu/home/', category: 'betting', logo: '/logos/play-uzu.png' },
  { name: 'Parimatch uz', website: 'https://parimatch-vip-uz.com/', linkedin: 'https://www.linkedin.com/company/parimatch-asia/home/', category: 'betting', country: 'Uzbekistan', logo: '/logos/parimatch-uz.png' },
  { name: 'Parimatch IN', website: 'https://pariwin.in/', linkedin: 'https://www.linkedin.com/company/parimatch-asia/home/', category: 'betting', country: 'India', logo: '/logos/parimatch-in.png' },
  { name: '22 bet', website: 'https://22bet.com/', linkedin: 'https://www.linkedin.com/company/22bet/home/', category: 'betting' },
  { name: 'Betlabel', website: 'https://betlabel.com/en', category: 'betting' },
  { name: 'Bit2me', website: 'https://bit2me.com/', linkedin: 'https://www.linkedin.com/company/bit2me/home/', category: 'crypto', logo: '/logos/bit2me.png' },
  { name: 'Paybis', website: 'https://paybis.com/', linkedin: 'https://www.linkedin.com/company/paybis/home/', category: 'crypto', logo: '/logos/paybis.png' },
  { name: 'Poonawalla', website: 'https://poonawallafincorp.com/', linkedin: 'https://www.linkedin.com/company/poonawalla-fincorp', category: 'loans', country: 'India', logo: '/logos/poonawalla.png' },
  { name: 'Selfie Credit', website: 'https://selfiecredit.ua/', linkedin: 'https://www.linkedin.com/company/selfiecredit/home/', category: 'loans', country: 'Ukraine' },
  { name: 'SpinGenie', website: 'https://www.spingenie.com/en-ROW/', category: 'betting' },
  { name: 'Linebet', website: 'https://linebet.com/', linkedin: 'https://www.linkedin.com/company/linebet/home/', category: 'betting' },
  { name: 'Betnix', website: 'https://betnix.ai/', linkedin: 'https://www.linkedin.com/company/betnix/home/', category: 'betting', logo: '/logos/betnix.png' },
  { name: 'Paisa 247', website: 'https://www.paisa247.in/', category: 'loans', country: 'India', logo: '/logos/paisa-247.png' },
  { name: 'Genting Casino', website: 'https://www.gentingcasinos.co.uk/', linkedin: 'https://www.linkedin.com/company/genting-casinos-uk/home/', category: 'betting', country: 'United Kingdom', logo: '/logos/genting-casino.png' },
  { name: 'Megacasino', website: 'https://www.megacasino.com/', linkedin: 'https://www.linkedin.com/company/mega-casino/about/', category: 'betting' },
  { name: 'SMSfinance', website: 'https://smsfinancial.in/', linkedin: 'https://www.linkedin.com/company/sms-financial/home/', category: 'loans', country: 'India', logo: '/logos/smsfinance.png' },
  { name: 'Vivus', website: 'https://vivus.com/', linkedin: 'https://www.linkedin.com/company/vivus-llc/home/', category: 'loans', logo: '/logos/vivus.png' },
  { name: 'LoanDigit', website: 'https://loandigit.com/', linkedin: 'https://www.linkedin.com/company/loandigit/home/', category: 'loans', logo: '/logos/loandigit.png' },
  { name: 'Salary112', website: 'https://www.salary112.com/', linkedin: 'https://linkedin.com/company/144908962/', category: 'loans', country: 'India', logo: '/logos/salary112.png' },
]
