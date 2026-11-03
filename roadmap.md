# BridgeLIB design update

- [x] Add admin news publishing dashboard linked to existing admin sign-in.
- [x] Replace reference news cards with actual stored BridgeLIB announcements; public empty state verified.
- [x] Open full stored articles from every Read More link; full text preservation tested.
- [ ] Verify admin publication and article readback end-to-end — no confirmed admin session or backend management access available.
- [ ] Connect news subscriptions to a real mailing list — needs a marketing email service and credentials.

- [x] Reproduce BridgeLIB AI reference; desktop/mobile, navigation and signed-out chat handling verified.
- [x] Implement News portal reference, article detail/search/updates/events and profile-based newsletter opt-ins; preserve external backend.
- [ ] Verify signed-in newsletter save/readback and AI answers — external backend has no available confirmed test session.

- [x] Apply the uploaded navy, blue, white and red visual direction across all pages.
- [x] Match the Home, About, Courses, WASSCE, student, teacher, practice, profile and account designs using existing live features.
- [x] Include News and Events views shown in the references without inventing published announcements.
- [x] Check desktop and mobile layouts, navigation and existing tests (64 tests passed; no broken photos, runtime errors or mobile overflow).
- [ ] Verify signed-in Profile save and teacher views — external Supabase provides no managed test session; authenticated checks remain unverified.
# Reference pages (Nov 2026)
- [x] Student Profile & Account Settings page matching reference (signed-in saving unverified: no test session for external backend)
- [x] Help Center & FAQ page matching reference
- [x] Sign Up flow matching reference (desktop + mobile steps)
- [x] Student Dashboard with BridgeLIB AI matching reference

- [x] AI explainer / practice quiz tool (/study-tools)
- [x] Four-step student signup flow with role selection + dashboard redirect
- [x] BridgeLIB AI dashboard page (chat, chips, feature tiles)
- [x] Footer Help/Contact/social links real
- [ ] Signup e2e: blocked on email confirmation (external backend)
- [x] Teacher four-step signup (teacher access needs admin approval)
- [x] Admin teacher approval page
- [x] News & Events pages with real content
- [x] Admin sub-pages: courses, quizzes, certificates, students, schools
- [ ] Signed-in AI chat test (test account unconfirmed)
- [x] Dashboard totals: add published courses (courses with a published lesson)
- [x] Admin sign-in page for /admin-dashboard
- [x] Student portal page (courses, quiz scores, certificates)
- [ ] AI chat test as test student (needs email confirmed)
- [x] Footer contact details come only from admin Website content
- [ ] Admin account for l.elijahcooper20@gmail.com (needs role granted in database)
