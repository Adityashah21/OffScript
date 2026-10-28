<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- All product/collection/edit content lives in `src/data/*` (mock, backend-shaped); components never hardcode product info — keeps a future API swap to one place.
- COD eligibility, validation and totals live in `src/lib/order.ts` and are covered by `src/test/order.test.ts`; UI must call `isCodEligible` rather than re-checking flags.
- Wishlist, recent searches and UTM attribution use the tiny stores in `src/lib/store.ts` (localStorage/sessionStorage via useSyncExternalStore) — no auth in v1.
- Category URLs (/women, /streetwear…) and /collections/$slug both render `CatalogPage`; campaign pages at /edit/$slug wrap it with a custom hero.
