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

## Reels, lines and free spins

The machine has **3, 4 or 5 reels** (3 rows each). On a phone it always has three; a wide screen (about 980 px
and up) lets the player pick the width, and the control panel then stands beside the reels. The player plays
**1, 3, 5 or 9 paylines** (the first of nine paths over the grid, see `PAYLINES`) and bets on every line; each
line pays on its own. The server's min and max bet limit the **total** bet (bet per line × lines).

A line pays when the same symbol stands on it three or more times **in a row from the left reel**. Exactly two
cherries among the first three cells pay a small consolation. Every width has its own pay table (more symbols in
a row pay much more) and its own scatter odds, tuned so that each of them pays back the same 94.3 %.

A **scatter** pays nothing on a line, but enough of them anywhere on the grid start **free spins**: 3 scatters on
3 reels, 4 on 4 or 5 reels give 8, one more gives 10, two more 12, three more or beyond 15. Free spins cost
nothing, keep the bet, the lines and the reels of the spin that won them, pay twice as much and can be won again.
They are kept in `User.slotsFreeSpins / slotsFreeBet / slotsFreeLines / slotsFreeReels / slotsFreeWon`, so closing
the page does not lose them. While a member has free spins left, every call of the spin action plays one of them,
whatever the browser sends.

Migrations to apply before updating the dashboard: `20261016120000_slots_lines_free_spins` and
`20261017120000_slots_wide_machine`.

## How a spin works

The browser only asks for a spin and plays an animation of the answer. On the server (`spinSlots` in the
dashboard) the nine cells are drawn with `crypto.randomInt`, and the bet, the payout, the free spins and the
pause are applied in one conditional `UPDATE`, so two spins sent at once cannot spend the same coins, play the
same free spin or skip the pause. The member must be on the server, the bet inside the server's limits.

Chances per cell: cherry 30, lemon 24, bell 18, clover 13, star 8, diamond 5, seven 2 and the scatter (6 on three
and five reels, 8 on four reels).

Pays, as a multiple of the bet on the line, for 3 / 4 / 5 in a row:

| Symbol  | 3 reels | 4 reels | 5 reels         |
| ------- | ------- | ------- | --------------- |
| cherry  | 7       | 6 / 18  | 4 / 12 / 48     |
| lemon   | 11      | 9 / 27  | 7 / 21 / 84     |
| bell    | 20      | 16 / 48 | 12 / 36 / 144   |
| clover  | 36      | 28 / 84 | 22 / 66 / 264   |
| star    | 90      | 71 / 213 | 55 / 165 / 660 |
| diamond | 220     | 173 / 519 | 133 / 399 / 1596 |
| seven   | 1000    | 786 / 2358 | 606 / 1818 / 7272 |
| exactly 2 cherries among the first 3 | ×1.5 | ×1.5 | ×1.5 |

Theoretical return **94.3 %** for every width, free spins included, for every number of lines (checked by
simulation of millions of spins). Free spins start about once in 85 spins on three reels, 109 on four, 118 on
five. The numbers live in `src/lib/slots/config.ts` of the dashboard, the pay table on the site is computed from
them.
