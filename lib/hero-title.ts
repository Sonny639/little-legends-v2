export const formatHeroRole = (heroName: string, heroType: string) =>
  /\bthe\b/i.test(heroName) ? `${heroName} as the ${heroType}` : `${heroName} the ${heroType}`
