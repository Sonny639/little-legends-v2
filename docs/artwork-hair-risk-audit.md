# Artwork Hair Risk Audit

Local contact-sheet review found these base-art risks for personalised face/hair replacement.

## High Risk

- Princess girl: pages 1-12 all use a crown/tiara with a large royal updo, bun, lifted curls, or extra hair mass.
- Fairy girl: pages 1-12 use a high bun/flower hairpiece and lifted curl volume.
- Footballer girl: most pages use a long ponytail or wind-swept side hair.
- Race-driver girl: pages 1-12 use a high ponytail, hairband, and large side hair mass.
- Dinosaur-expert girl: pages 1-12 use a high ponytail/bun, pink hair tie, and side hair.
- Superhero girl: several pages use side-swept ponytail/updo volume.

## Medium Risk

- Footballer boy: thick stylised spiky hair.
- Race-driver boy: thick stylised spiky hair.
- Dinosaur-expert boy: thick messy hair.
- Superhero boy: thick curly/spiky hair.
- Wizard boy: swept thick hair.
- Knight boy: thick curly hair.

## Fix Applied

The generation prompts now treat base-art hair as replaceable and use the customer's uploaded reference photo as the only source of hair identity. Story-specific guardrails were added for the high-risk hero types so buns, ponytails, flower hairpieces, tiaras/crowns, hairbands, wind-swept side hair, spikes, tufts, and extra volume are removed unless they clearly exist in the child reference photo.
