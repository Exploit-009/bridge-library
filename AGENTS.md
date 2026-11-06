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

## Assets

- Keep generated images as local imports; uploaded or cropped reference media uses this project's CDN pointers through `reference-photos` so source-project asset URLs are never reused.

## Page presentation

- Use shared semantic BridgeLIB tokens and existing page shells for reference styling so visual changes preserve live learning logic and access controls.
- AI and News dashboards use opt-in reference variants of the learner shell and shared chrome; scope styles to each variant so other pages retain their navigation and behavior.
- News reuses admin-managed site content and existing profile preferences for authenticated newsletter opt-ins; never store subscriber emails in public site content or replace the external backend.
- Publish announcements through admin-verified server functions into the existing site.news row using versioned JSON with stable slugs and legacy text support; store only published stories in this public-readable row and prevent other site-content saves from overwriting it.
- Account access uses shared public login/recovery/reset/update pages; reset-link sessions omit current_password while signed-in changes require it, keeping recovery and ordinary account changes separate.
