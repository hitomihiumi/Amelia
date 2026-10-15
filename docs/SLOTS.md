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

## Lines and free spins

The machine is a grid of 3 reels × 3 rows. The player plays **1, 3, 5 or 9 paylines** (the first of the
nine paths over the grid, see `PAYLINES`) and bets on every line; each line pays on its own. The server's min
and max bet limit the **total** bet (bet per line × lines).

A **scatter** pays nothing on a line, but three or more anywhere on the grid start **free spins**: 3 give 8,
4 give 10, 5 give 12, 6 or more give 15. Free spins cost nothing, keep the bet and the lines of the spin that
won them, pay twice as much and can be won again. They are kept in `User.slotsFreeSpins / slotsFreeBet /
slotsFreeLines / slotsFreeWon`, so closing the page does not lose them. While a member has free spins left,
every call of the spin action plays one of them, whatever the browser sends.

Apply the migration `20261016120000_slots_lines_free_spins` before updating the dashboard.

## How a spin works

The browser only asks for a spin and plays an animation of the answer. On the server (`spinSlots` in the
dashboard) the nine cells are drawn with `crypto.randomInt`, and the bet, the payout, the free spins and the
pause are applied in one conditional `UPDATE`, so two spins sent at once cannot spend the same coins, play the
same free spin or skip the pause. The member must be on the server, the bet inside the server's limits.

Chances per cell (out of 106): cherry 30, lemon 24, bell 18, clover 13, star 8, diamond 5, seven 2, scatter 6.

| Combination on a line | Pays (× the bet on the line) |
| --------------------- | ---------------------------- |
| 3 × cherry            | ×7                           |
| 3 × lemon             | ×11                          |
| 3 × bell              | ×20                          |
| 3 × clover            | ×36                          |
| 3 × star              | ×90                          |
| 3 × diamond           | ×220                         |
| 3 × seven             | ×1000                        |
| exactly 2 cherries    | ×1.5                         |

Theoretical return **94.3 %**, free spins included, the same for every number of lines (checked by simulation).
One line pays about once in 4.7 spins, free spins start about once in 85 spins. The numbers live in
`src/lib/slots/config.ts` of the dashboard, the pay table on the site is computed from them.
