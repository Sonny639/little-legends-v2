type ArtworkGender = "boy" | "girl"

const launchPreviewFallbacks: Record<string, string> = {
  superhero: "/stories/launch-preview/superhero.svg",
  wizard: "/stories/launch-preview/wizard.svg",
  fairy: "/stories/launch-preview/fairy.svg",
  princess: "/stories/launch-preview/princess.svg",
  "dinosaur-expert": "/stories/launch-preview/dinosaur-expert.svg",
}

const genderedFallbacks: Record<string, Record<ArtworkGender, string>> = {
  footballer: {
    boy: "/stories/footballer/footballer-boy-page-1.png",
    girl: "/stories/footballer/footballer-girl-page-1.png",
  },
  "bitcoin-hero": {
    boy: "/stories/bitcoin-hero/bitcoin-hero-page-1.svg",
    girl: "/stories/bitcoin-hero/bitcoin-hero-page-1.svg",
  },
}

export const getStoryArtworkFallback = (storyId?: string | null, gender: ArtworkGender = "boy") => {
  if (!storyId) return ""

  return genderedFallbacks[storyId]?.[gender] || launchPreviewFallbacks[storyId] || ""
}
