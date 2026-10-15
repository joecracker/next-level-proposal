# The target document: Tim's boss's real proposal (Next Level Proposal)

Moved out of AI_RULES.md on 2026-10-15 so it is not loaded on every turn. Nothing was removed or reworded.

The printed proposal must come out **essentially the same document Tim's boss writes.** The app was built by an AI told to mimic that proposal, but it kept *interpreting* the format instead of following it. Tim wants the interpretation to stop. **No gold, no amber, no decorative rules, no "fancy".**

Reference copies on disk (`.dyad/media/`, hashed names — match by size/order, not by name):
- **Filled-out real proposal** (the *Stover bath job*, Tim's boss's most recent): `d23da1a7824469a568c58d67f4db6ba8104b2035d842a1e18ff3add01d97f9ee.docx`
- Blank template: `1e887b0007ea497b49fb8c2a354dda0335709ed4efeaecaf107e22c4ba09fc01.docx`
- Price sheet (blank): `ff92edc00132f6e831c25d8f0a0b3d351c71e52dc453e247f7bd9abb63f76cd9.xlsx`

**How to read a `.docx`/`.xlsx` here:** both are just zips of XML. **Python 3.12 is installed** — use `python` with `zipfile` + `xml.etree`, reading `word/document.xml`. There is no pandoc, no LibreOffice and no `unzip` on this box. Never hand-write file-format bytes.

Verified from the real proposal file:
- **Arial 12pt**, US Letter, **0.5 in margins**, black on white. No colour, no rules, no gold anywhere.
- Header: one logo image plus three modest lines (company name / "Licensed Builder" + "State Licensed & Insured" / license #, website, email, phone). The company name is bold, title case (not all caps) and bigger than the body text (18pt, sized so the full name fits on one line) so the boss can spot it at a glance; the other header lines are regular weight (Tim, 2026-10-10).
- Then the customer's name, address and phone **in bold**, then the **`work to be done:`** label in bold followed by the job description in regular weight (Tim, 2026-10-10).
- **Section headings: bold Arial 12pt, sentence case, trailing colon.** Never ALL CAPS.
- **Bullet lines carry real `•` dots.**
- Order: Material description → Demolition → Carpentry → Plumbing → Electrical → *Allowances figured in price of job* → *Homeowner to supply* → money block → *Special note* → *Payment note* → signature lines.
  - The source file actually puts Carpentry **last** among trades; **Tim has said he wants Carpentry before Plumbing and Electrical.** Follow Tim.
- Money block: label on the left, dollar figure in a **staggered right-hand column** so all four line up. Labels: `Total for all work described above:`, `Due at signing of contract:`, `Due at start of job:`, `Due upon completion of job:`.
- Allowance bullets and "Homeowner to supply" bullets are ordinary list items (allowances happen to carry a `$` figure inside the bullet text).
- Signatures: one plain underscore line per party with a caption row — **no ruled borders**.
- Note: the app's `amber` colour scale in `src/index.css` was repainted grey/silver by an earlier agent to neutralise leftover gold. Treat that as cover-up, not as permission — check `src/index.css` before adding colour to the printed page.
