# Slot machine

A slot machine on the website (`/profile/slots`), played with the **virtual currency of a server**.
It is off by default and every server turns it on itself, in the dashboard (Economy → Slot machine) or
with `/setting economy` → Income → Slot machine. `/slots` opens the game for the member.

> It is not gambling with real money and it does not encourage gambling. The coins cannot be bought,
> sold, deposited or withdrawn. Casinos on real money are harmful. Every page of the game says so:
> a banner on top, a confirmation before the first spin, the notice under the machine, the pay table
> with the real odds and a reminder to take a break every 25 spins.

## Settings (per server)

| Setting    | Default | Bounds              |
| ---------- | ------- | ------------------- |
| enabled    | off     |                     |
| min bet    | 10      | at least 1          |
| max bet    | 1000    | up to 100 000       |
| pause      | 5 s     | 1 – 3600 s          |

Stored in `Guild.slotsEnabled / slotsMinBet / slotsMaxBet / slotsCooldown`; the time of the last spin of a
member is `User.slotsTimeout`. Apply the migration `20261015120000_add_slots` (`npm run db:migrate`) before
updating the dashboard.

## How a spin works

The browser only asks for a spin and plays an animation of the answer. On the server (`spinSlots` in the
dashboard) the reels are drawn with `crypto.randomInt`, and the bet, the payout and the pause are applied in
one conditional `UPDATE`, so two spins sent at once cannot spend the same coins or skip the pause. The
member must be on the server, the bet inside the server's limits.

Three reels, the middle row is the payline. Chances per reel: cherry 30, lemon 24, bell 18, clover 13, star 8,
diamond 5, seven 2 (out of 100).

| Combination       | Pays      |
| ----------------- | --------- |
| 3 × cherry        | ×7        |
| 3 × lemon         | ×12       |
| 3 × bell          | ×22       |
| 3 × clover        | ×40       |
| 3 × star          | ×100      |
| 3 × diamond       | ×250      |
| 3 × seven         | ×1000     |
| exactly 2 cherries| ×1.5      |

Theoretical return 94.5 %, a spin pays about once in 4. The numbers live in
`src/lib/slots/config.ts` of the dashboard, the pay table on the site is computed from them.
