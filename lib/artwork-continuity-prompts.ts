type Gender = "boy" | "girl"

type HairContinuityOptions = {
  storyId: string
  gender?: Gender | null
  referenceLabel?: string
}

type ProportionContinuityOptions = {
  storyId: string
  referenceLabel?: string
}

const highRiskHairByStory: Record<string, Partial<Record<Gender, string>>> = {
  princess: {
    girl:
      "Princess base-art risk: many pages have a crown, tiara, large royal updo, bun, ponytail, crown-lifted hair, curls, or extra hair mass. The crown or tiara may remain, but it must sit on the child's real hair. Remove all large base-art hair behind the crown or head unless the child clearly has that same hairstyle.",
  },
  fairy: {
    girl:
      "Fairy base-art risk: many pages have a high bun, flower hairpiece, lifted curls, and extra hair volume. Wings and costume may remain, but remove the base fairy bun/flower hair mass unless the child clearly has that same hairstyle.",
  },
  footballer: {
    girl:
      "Footballer girl base-art risk: many pages have a long ponytail and wind-swept motion hair. Do not keep the ponytail, flowing side hair, or hairband unless the child clearly has that same hairstyle.",
    boy:
      "Footballer boy base-art risk: many pages have thick stylised spiky hair. Do not keep spikes, tufts, or extra volume unless the child clearly has that same hairstyle.",
  },
  "race-driver": {
    girl:
      "Race-driver girl base-art risk: many pages have a high ponytail, hairband, and large side hair mass. Do not keep the ponytail, hairband, lifted curls, or extra volume unless the child clearly has that same hairstyle.",
    boy:
      "Race-driver boy base-art risk: many pages have thick stylised spiky hair. Do not keep spikes, tufts, or extra volume unless the child clearly has that same hairstyle.",
  },
  "dinosaur-expert": {
    girl:
      "Dinosaur-expert girl base-art risk: many pages have a high ponytail, bun, pink hair tie, and large side hair. Do not keep the ponytail, bun, hair tie, or extra hair mass unless the child clearly has that same hairstyle.",
    boy:
      "Dinosaur-expert boy base-art risk: many pages have thick stylised messy hair. Do not keep spikes, tufts, or extra volume unless the child clearly has that same hairstyle.",
  },
  superhero: {
    girl:
      "Superhero girl base-art risk: many pages have large side-swept hair, ponytail, or updo volume. Do not keep the ponytail, side hair mass, or lifted curls unless the child clearly has that same hairstyle.",
    boy:
      "Superhero boy base-art risk: many pages have thick curly or spiky superhero hair. Do not keep curls, spikes, tufts, or extra volume unless the child clearly has that same hairstyle.",
  },
  wizard: {
    boy:
      "Wizard base-art risk: many pages have thick stylised swept hair. Do not keep the swept fringe, spikes, tufts, or extra volume unless the child clearly has that same hairstyle.",
  },
  knight: {
    boy:
      "Knight base-art risk: many pages have thick stylised curly hair. Do not keep curls, tufts, or extra volume unless the child clearly has that same hairstyle.",
  },
}

export const generatedArtworkNegativePromptAdditions =
  "uncanny face, harsh face, distorted mouth, distorted teeth, crooked teeth, broken teeth, jagged teeth, uneven teeth, extra teeth, adult teeth, sharp teeth, dark gaps in teeth, black mouth"

export const getChildPortraitQualityPrompt = (referenceLabel = "image 2") =>
  [
    "Child portrait quality requirement: the hero must look lovely, warm, healthy, glowing, kind, and childlike.",
    `Keep the child recognisable from ${referenceLabel}, but make the finished expression flattering, gentle, natural, and suitable for a premium keepsake storybook.`,
    "Apply gentle storybook polish: soften harsh shadows, brighten the expression, even the lighting, and make the child look their happiest natural self without changing their identity.",
    "Apply very light complexion refinement: smooth camera noise, harsh texture, patchy shadows, redness, or temporary blemishes while keeping the child's real skin tone, face shape, cheeks, freckles, moles, birthmarks, and natural childlike skin detail.",
    "Eyes should look bright and friendly, cheeks softly lit, skin natural and even rather than airbrushed, and the whole face should feel charming rather than uncanny.",
    "If a facial detail is uncertain, choose the softer, simpler, more natural option rather than adding complex invented detail.",
  ].join(" ")

export const getProportionContinuityPrompt = ({
  storyId,
  referenceLabel = "image 2",
}: ProportionContinuityOptions) => {
  const footballerPrompt =
    "Football artwork proportion note: a slight storybook football-card head emphasis is acceptable when it matches the base illustration and helps the child read clearly. Keep the body athletic and natural, avoid extreme bobble-head proportions, and do not paste an obviously oversized face."

  const strictStoryPrompt =
    storyId === "princess" || storyId === "fairy"
      ? "Princess and fairy full-body artwork needs stricter proportion matching: keep the base artwork's original head size, face size, neck length, body proportions, pose, and framing. Do not enlarge the child's head, paste an oversized face, shrink the body, or create a bobble-head effect."
      : "Keep the base artwork's original pose, body proportions, framing, and character scale. Do not paste an obviously oversized face, shrink the body, or create an unnatural bobble-head effect."

  return [
    "Proportion continuity requirement: image 1 controls the hero's pose, body scale, neck, shoulders, and framing.",
    storyId === "footballer" ? footballerPrompt : strictStoryPrompt,
    `Use ${referenceLabel} for identity only, not for crop, camera angle, body proportions, or forced face scale.`,
  ].join(" ")
}

export const getHairContinuityPrompt = ({
  storyId,
  gender,
  referenceLabel = "image 2",
}: HairContinuityOptions) => {
  const storyRisk = highRiskHairByStory[storyId]
  const riskPrompt = (gender ? storyRisk?.[gender] : undefined) || storyRisk?.girl || storyRisk?.boy || ""

  return [
    `Hair replacement rule: use ${referenceLabel} as the only source of the child's hair identity. Preserve the child's real hairline, hair colour, fringe, parting, length, texture, and visible hair silhouette from ${referenceLabel}.`,
    "Treat all hair in the base artwork as replaceable. Do not use the base character's hairstyle as a template for the child.",
    "Remove any base-art hair that conflicts with the child's real hairstyle, including spikes, tufts, fringe, curls, buns, ponytails, hairbands, flower hairpieces, crown-lifted hair, wind-swept side hair, or extra hair behind the head.",
    "If the reference shows a bob, short hair, straight hair, close-to-head hair, or a small fringe, keep that exact compact silhouette and do not add large hair volume.",
    riskPrompt,
  ]
    .filter(Boolean)
    .join(" ")
}

export const getMouthContinuityPrompt = (referenceLabel = "image 2") =>
  [
    `Mouth and teeth continuity requirement: preserve the child's natural mouth shape, smile, lip line, tooth size, tooth spacing, baby teeth gaps, and gum visibility from ${referenceLabel}.`,
    "Prefer a soft closed-mouth or lips-together smile for storybook artwork when there is any risk of teeth looking distorted.",
    "Do not invent adult teeth, extra teeth, missing teeth, sharp teeth, crowded teeth, dark gaps, crooked distortions, black mouth holes, or an exaggerated grin.",
    "If teeth are visible, render only a small, clean, healthy, bright, childlike smile that flatters the child while still feeling like their real smile. Small natural baby-tooth gaps are okay; avoid fake perfect adult veneers.",
    "Do not show broken, patchy, jagged, uneven, crooked, or partially missing teeth. If the teeth cannot be reproduced cleanly, evenly, and naturally, replace visible teeth with a soft closed-mouth smile.",
    "Never let the teeth become the focus of the face; the overall expression should feel gentle, warm, neat, and charming.",
  ].join(" ")

export const getBaseArtworkHairRiskPrompt = (storyId: string, gender: Gender) =>
  [
    highRiskHairByStory[storyId]?.[gender],
    "For base artwork and future personalisation, keep the hero's hair area easy to replace with the child's real hairstyle. Avoid oversized hair silhouettes close to the face where possible.",
  ]
    .filter(Boolean)
    .join(" ")

export const baseArtworkMouthRiskPrompt =
  "Keep the mouth and smile natural, childlike, and easy to personalise later. Avoid adult teeth, extra teeth, sharp teeth, crowded teeth, dark gaps, exaggerated grins, or distorted mouths."

export const baseArtworkPortraitQualityPrompt =
  "Keep the hero's face lovely, warm, glowing, childlike, friendly, and premium-storybook charming. Avoid uncanny expressions, oversized heads, bobble-head proportions, or harsh facial details."
