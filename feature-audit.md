# BridgeLIB feature connection audit

## Existing real connections (source checked)

Accounts and profiles; student photos; courses and enrolments; lesson completions; exam attempts and trusted scoring; progress; bookmarks and ratings; certificates; teacher classes, invitations, assignments, grading, messages and resources; teacher approvals; admin course, quiz, student, school and paper management; dashboard counts; site content and events; announcement publishing and full articles; support requests; profile preferences; saved Study Guide conversations.

These use the current configured backend. Their deployed policies, RPCs and successful signed-in save/readback are not established by a source audit.

## Corrections applied

- Profile layout no longer expands beyond portrait/landscape phone widths. The student image and flag panel remain visible.
- Profile avatar failures show the existing icon fallback; a missing photo path clears a previous photo.
- Saved class-message alert opt-outs suppress optional header alerts, while classroom messages remain accessible.

## Remaining gaps

- Newsletter saves an account preference, not a supporter mailing list or delivered news alert. Mailing service details and credentials are still required.
- Help stores support requests; no in-app admin reply delivery workflow was found.
- General AI and Explain/Quiz tools retain output for the page session; Study Guide alone persists conversations.
- Study Guide reads goals from auth metadata, while the profile saves goal columns; these sources need alignment.
- MFA enrolment is connected, but a complete MFA challenge during ordinary password sign-in was not found. Enrollment alone must not be described as verified enforcement.
- Study time is not tracked. Login activity is basic sign-in information, not a full audit history. Data export is a learning-record snapshot, not all account data.
- Notification preferences do not establish email delivery. Official exam schedules and student verification are explicitly unavailable.

## Verification limits

No confirmed signed-in student/admin session or management access to the existing backend is available in this workspace. No replacement backend, fabricated records, bypassed roles or fake success responses were introduced. Public profile rendering, navigation, image loading and enquiry dialog were browser-tested; saved preference handling and existing profile validation were unit-tested.