# lockin – product brief (v1)

## overview  
**lockin** is a blockchain-powered app that helps users commit to personal goals by staking real money on their success. through social challenges and proof-based accountability, lockin turns personal growth into a high-stakes game — where users either follow through or forfeit their bet.

---

## core purpose  
help people actually stick to their habits by giving them **skin in the game**.

---

## key features (v1 mvp)

- goal creation: users can create or join challenges (21+ days minimum) from templates
- proof submission: users upload daily or periodic photo/video proof via mobile
- staking system: users stake `lockin` token (solana) or `usdc` to join challenges
- group challenges: users can invite friends or join public challenges
- leaderboard: shows top performers by prize pool, consistency, and challenge count
- wallet integration: wallets like phantom or backpack required to stake and earn
- auth: supports both wallet-based and email/social sign-in
- push notifications: sent for reminders, proof alerts, and challenge progress

---

## core loop

1. join or create a challenge  
2. stake tokens  
3. do the habit  
4. upload proof (photo/video)  
5. win the challenge and earn rewards — or lose your stake if inconsistent

---

## token logic

- primary staking token: `lockin` (solana-based)
- rewards are defined per challenge
- users must submit consistent proof (2-day inactivity = fail)

---

## who it's for

- habit builders who struggle with follow-through
- people who want external pressure to change
- friends who want to challenge each other to level up

---

## platforms

- web: next.js
- mobile: react native (expo)
- backend: node.js, express, prisma
- blockchain: solana

---

## mvp constraints

- keep proof lightweight (manual review for now)
- focus on utility, not gamification
- prioritize trust, simplicity, and emotional commitment over “features”


