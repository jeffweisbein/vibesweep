# 🚀 Quick Launch Guide

## 1. Publish to NPM (5 min)
```bash
cd /Volumes/SSD\ RAID/code/proj/ai-garbage-collector
npm login  # if not logged in
npm publish
# Test it works:
npx vibesweep analyze .
```

## 2. Create GitHub Repo (5 min)
1. Go to github.com/new
2. Name: `vibesweep`
3. Description: "Sweep away AI-generated code waste 🧹"
4. Public repo
5. Don't initialize with README

```bash
git init
git add .
git commit -m "Initial commit: Vibesweep v0.1.0 🧹"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/vibesweep.git
git push -u origin main
```

## 3. Deploy Landing Page (10 min)
```bash
cd ../vibesweep-landing
npm install
git init
git add .
git commit -m "Landing page"
```

1. Go to vercel.com
2. Import Git Repository
3. Select vibesweep-landing
4. Deploy!
5. Add custom domain: vibesweep.ai

## 4. Set Up Stripe (15 min)
1. Go to stripe.com/dashboard
2. Create product: "Vibesweep Pro" - $29/mo
3. Get payment link
4. Update landing page with real Stripe link

## 5. Launch! (30 min)
1. Tweet main thread (see marketing/ready-to-tweet.txt)
2. Post to r/programming
3. Share in dev Discord servers
4. Submit to Hacker News: "Show HN: Vibesweep – Detect AI code waste"

## 6. Monitor & Respond
- Watch GitHub issues
- Reply to tweets
- Answer Reddit comments
- Fix any critical bugs

## First Day Goals
- [ ] 100 npm downloads
- [ ] 50 GitHub stars
- [ ] 5 Pro signups ($145 revenue!)
- [ ] Front page of r/programming

## Revenue Tracking
Need $140 to break even on domain
- 5 Pro subscribers = $145/mo
- 15 Pro subscribers = $435/mo
- 50 Pro subscribers = $1,450/mo

LET'S GO! 🚀