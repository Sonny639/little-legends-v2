type Gender = "boy" | "girl"

type HairContinuityOptions = {
  storyId: string
  gender?: Gender | null
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
  "uncanny face, harsh face, distorted mouth, distorted teeth, extra teeth, adult teeth, sharp teeth, dark gaps in teeth"

export const getChildPortraitQualityPrompt = (referenceLabel = "image 2") =>
  [
    "Child portrait quality requirement: the hero must look lovely, warm, healthy, glowing, kind, and childlike.",
    `Keep the child recognisable from ${referenceLabel}, but make the finished expression flattering, gentle, natural, and suitable for a premium keepsake storybook.`,
    "Eyes should look bright and friendly, cheeks softly lit, skin natural and even, and the whole face should feel charming rather than uncanny.",
    "If a facial detail is uncertain, choose the softer, simpler, more natural option rather than adding complex invented detail.",
  ].join(" ")

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
    "Do not invent adult teeth, extra teeth, missing teeth, sharp teeth, crowded teeth, dark gaps, crooked distortions, or an exaggerated grin.",
    "If the reference smile is unclear, use a small closed-mouth or softly smiling expression rather than generating detailed teeth.",
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
  "Keep the hero's face lovely, warm, glowing, childlike, friendly, and premium-storybook charming. Avoid uncanny expressions or harsh facial details."
