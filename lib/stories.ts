export type StoryChoice = {
  id: string
  text: string
  nextPageId: string
  pathTag: "brave" | "kind" | "clever" | "teamwork"
}

export type StoryPage = {
  id: string
  kicker: string
  title: string
  scene: string
  artwork?: {
    boy: string
    girl: string
  }
  imageBrief?: string
  panels: string[]
  speech: string[]
  sound: string
  choices: StoryChoice[]
}

export type StoryPathChoice = {
  pageId: string
  choiceId: string
  pathTag: StoryChoice["pathTag"]
  text: string
}

export type CharacterStory = {
  characterId: string
  title: string
  subtitle: string
  readingAge: string
  lesson: string
  previewPageLimit: number
  pages: Record<string, StoryPage>
  purchaseSummary: {
    headline: string
    body: string
    includes: string[]
  }
}

type StoryPersonalisation = {
  heroName: string
  heroType: string
}

const choice = (
  id: string,
  text: string,
  nextPageId: string,
  pathTag: StoryChoice["pathTag"],
): StoryChoice => ({
  id,
  text,
  nextPageId,
  pathTag,
})

const launchPreviewArtworkIds = new Set<string>()

const artwork = (characterId: string, page: number) => {
  if (characterId === "wizard" && page <= 3) {
    return {
      boy: `/stories/wizard/wizard-boy-page-${page}.png`,
      girl: "/stories/launch-preview/wizard.svg",
    }
  }

  if (characterId === "fairy" && page <= 3) {
    return {
      boy: "/stories/launch-preview/fairy.svg",
      girl: `/stories/fairy/fairy-girl-page-${page}.png`,
    }
  }

  if (characterId === "princess" && page <= 3) {
    return {
      boy: "/stories/launch-preview/princess.svg",
      girl: `/stories/princess/princess-girl-page-${page}.png`,
    }
  }

  if (characterId === "knight" && page <= 3) {
    return {
      boy: `/stories/knight/knight-boy-page-${page}.png`,
      girl: "/stories/launch-preview/knight.svg",
    }
  }

  if (launchPreviewArtworkIds.has(characterId) && page <= 3) {
    const previewPath = `/stories/launch-preview/${characterId}.svg`

    return {
      boy: previewPath,
      girl: previewPath,
    }
  }

  return {
    boy: `/stories/${characterId}/${characterId}-boy-page-${page}.png`,
    girl: `/stories/${characterId}/${characterId}-girl-page-${page}.png`,
  }
}

const visualDirectionForHero = (heroType: string) => {
  const normalisedHeroType = heroType.toLowerCase()

  if (normalisedHeroType.includes("superhero")) {
    return "Visual direction: cosy bedtime city rescue, bright child-safe cape and hero suit, promise-star glow, no mask or helmet covering the face."
  }

  if (normalisedHeroType.includes("wizard")) {
    return "Visual direction: moonlit magical library, warm robe or cloak, kindness wand, glowing spellbook, soft silver and gold magic around the child."
  }

  if (normalisedHeroType.includes("fairy")) {
    return "Visual direction: enchanted fairy meadow, gentle translucent wings, sparkle seed pouch, glow flowers, warm petal light, premium bedtime garden atmosphere."
  }

  if (normalisedHeroType.includes("princess")) {
    return "Visual direction: starlight castle, child-friendly royal outfit, gentle crown, warm gold and rose light, leadership and kindness rather than glamour."
  }

  if (normalisedHeroType.includes("knight")) {
    return "Visual direction: warm starlight castle keep, child-friendly brave knight outfit, gentle shield, gold banner light, protection and kindness rather than fighting."
  }

  if (normalisedHeroType.includes("football")) {
    return "Visual direction: bright friendly football stadium, child in football kit, muddy boots, teamwork energy, ball visible but never covering the face."
  }

  if (normalisedHeroType.includes("dinosaur")) {
    return "Visual direction: friendly fossil valley, child explorer outfit, fossil finder, warm ferns, gentle baby dinosaur details, adventurous but never scary."
  }

  if (normalisedHeroType.includes("race") || normalisedHeroType.includes("car driver")) {
    return "Visual direction: bright child-safe racing circuit, red open-wheel race car, fair-play energy, checkered flags, safety cones, no crashes or danger."
  }

  return "Visual direction: premium magical children's storybook illustration with warm bedtime emotion, expressive child hero, and a clear sense of wonder."
}

const imageBrief = (heroName: string, heroType: string, pageTitle: string, scene: string) =>
  `Front-facing child as ${heroName} the ${heroType}. Page scene: ${pageTitle}. ${scene} ${visualDirectionForHero(heroType)} ${
    heroType.toLowerCase().includes("bitcoin")
      ? "Outfit requirement: bright orange Bitcoin superhero suit with a round Bitcoin chest emblem, gold utility belt, lightning cape, and friendly futuristic saver-hero details."
      : ""
  } Scene alignment requirement: the illustration must clearly match this page's title and story moment, not a generic character pose. Match the child's visible skin tone and facial features from the reference photo. Keep the child's face large, clear, expressive, and unobstructed in the upper centre third of the image. Leave the lower third and side margins free for layout breathing room. No text, speech bubbles, hands, props, masks, helmets, shadows, or foreground objects covering the face. Bright premium children's storybook style.`

const footballerArtwork = (page: number) => {
  if (page === 12) {
    return {
      boy: "/stories/footballer/footballer-boy-final.png",
      girl: "/stories/footballer/footballer-girl-final.png",
    }
  }

  return {
    boy: `/stories/footballer/footballer-boy-page-${page}.png`,
    girl: `/stories/footballer/footballer-girl-page-${page}.png`,
  }
}

const dinosaurExpertArtwork = (page: number) => ({
  boy: `/stories/dinosaur-expert/dinosaur-expert-boy-page-${page}.png`,
  girl: `/stories/dinosaur-expert/dinosaur-expert-girl-page-${page}.png`,
})

const bitcoinHeroArtwork = (page: number) => ({
  boy: `/stories/bitcoin-hero/bitcoin-hero-page-${page}.svg`,
  girl: `/stories/bitcoin-hero/bitcoin-hero-page-${page}.svg`,
})

const bitcoinHeroArtworkScene = (scene: string) => ({
  boy: `/stories/bitcoin-hero/${scene}.svg`,
  girl: `/stories/bitcoin-hero/${scene}.svg`,
})

export const getStoryForCharacter = (
  characterId: string | null,
  { heroName, heroType }: StoryPersonalisation,
): CharacterStory => {
  let story: CharacterStory

  if (characterId === "bitcoin-hero") {
    story = createBitcoinHeroStory(heroName, heroType)
  } else if (characterId === "footballer") {
    story = createFootballerStory(heroName, heroType)
  } else if (characterId === "dinosaur-expert") {
    story = createDinosaurExpertStory(heroName, heroType)
  } else if (characterId === "superhero") {
    story = createSuperheroStory(heroName, heroType)
  } else {
    story = createStarterStory(characterId || "default", heroName, heroType)
  }

  return {
    ...story,
    pages: Object.fromEntries(
      Object.entries(story.pages).map(([pageId, page]) => [
        pageId,
        {
          ...page,
          imageBrief: page.imageBrief || imageBrief(heroName, heroType, page.title, page.scene),
        },
      ]),
    ),
  }
}

export const getStoryPathSummary = (choices: StoryPathChoice[]) => {
  if (choices.length === 0) return "The full story will follow a balanced brave and kind path."

  const counts = choices.reduce<Record<StoryChoice["pathTag"], number>>(
    (summary, selectedChoice) => {
      summary[selectedChoice.pathTag] += 1
      return summary
    },
    { brave: 0, kind: 0, clever: 0, teamwork: 0 },
  )

  const strongestPath = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const labels: Record<string, string> = {
    brave: "a bold rescue path",
    kind: "a caring kindness path",
    clever: "a clever problem-solving path",
    teamwork: "a team-first path",
  }

  return `Your choices are shaping ${labels[strongestPath] || "a personalised path"}.`
}

type StarterStoryTheme = {
  title: string
  subtitle: string
  lesson: string
  headline: string
  body: string
  callTitle: string
  callScene: string
  destination: string
  troubleTitle: string
  troubleScene: string
  troubleBeing: string
  helper: string
  tool: string
  clueOne: string
  clueTwo: string
  clueThree: string
  sceneFiveTitle: string
  sceneFive: string
  sceneSixTitle: string
  sceneSix: string
  sceneSevenTitle: string
  sceneSeven: string
  transformationTitle: string
  transformationScene: string
  testQuestion: string
  paradeScene: string
  bedtimeScene: string
  finalTitle: string
  finalScene: string
  pageCopy?: Record<string, Partial<Pick<StoryPage, "title" | "scene" | "panels" | "speech" | "sound">>>
}

const applyStarterPageCopy = (
  pages: Record<string, StoryPage>,
  pageCopy?: StarterStoryTheme["pageCopy"],
): Record<string, StoryPage> => {
  if (!pageCopy) return pages

  return Object.fromEntries(
    Object.entries(pages).map(([pageId, page]) => {
      const copy = pageCopy[pageId]

      return [
        pageId,
        copy
          ? {
              ...page,
              ...copy,
              panels: copy.panels || page.panels,
              speech: copy.speech || page.speech,
              sound: copy.sound || page.sound,
            }
          : page,
      ]
    }),
  )
}

type ModernStoryThemeSeed = {
  title: (heroName: string) => string
  subtitle: (heroName: string, heroType: string) => string
  lesson: string
  headline: string
  destination: string
  signal: string
  troubleTitle: string
  troubleScene: string
  troubleBeing: string
  helper: string
  tool: string
  clueOne: string
  clueTwo: string
  clueThree: string
  sceneFiveTitle: string
  sceneFive: string
  sceneSixTitle: string
  sceneSix: string
  sceneSevenTitle: string
  sceneSeven: string
  transformationTitle: string
  transformationScene: string
  testQuestion: string
  paradeScene: string
  bedtimeScene: string
  finalTitle: string
  finalScene: (heroName: string) => string
}

const modernStoryTheme =
  (seed: ModernStoryThemeSeed) =>
  (heroName: string, heroType: string): StarterStoryTheme => ({
    title: seed.title(heroName),
    subtitle: seed.subtitle(heroName, heroType),
    lesson: seed.lesson,
    headline: seed.headline,
    body: `The full story follows ${heroName} through ${seed.destination}, a bigger choice, and a warm ending shaped by courage, kindness, and the decisions made in the preview.`,
    callTitle: `${seed.signal} Calls`,
    callScene: `${seed.signal} glows over ${seed.destination} and points a trail of bedtime-bright light toward ${heroName}.`,
    destination: seed.destination,
    troubleTitle: seed.troubleTitle,
    troubleScene: seed.troubleScene,
    troubleBeing: seed.troubleBeing,
    helper: seed.helper,
    tool: seed.tool,
    clueOne: seed.clueOne,
    clueTwo: seed.clueTwo,
    clueThree: seed.clueThree,
    sceneFiveTitle: seed.sceneFiveTitle,
    sceneFive: seed.sceneFive,
    sceneSixTitle: seed.sceneSixTitle,
    sceneSix: seed.sceneSix,
    sceneSevenTitle: seed.sceneSevenTitle,
    sceneSeven: seed.sceneSeven,
    transformationTitle: seed.transformationTitle,
    transformationScene: seed.transformationScene,
    testQuestion: seed.testQuestion,
    paradeScene: seed.paradeScene,
    bedtimeScene: seed.bedtimeScene,
    finalTitle: seed.finalTitle,
    finalScene: seed.finalScene(heroName),
  })

const starterStoryThemes: Record<string, (heroName: string, heroType: string) => StarterStoryTheme> = {
  wizard: (heroName, heroType) => ({
    title: `${heroName} and the Moonbeam Spell`,
    subtitle: `${heroName} the ${heroType} discovers that the brightest magic begins with a gentle voice and a brave heart.`,
    lesson: "Patience, kindness, and using power wisely",
    headline: "Unlock the full magical spellbook adventure",
    body: `The full story follows ${heroName} through Moonbeam Library, a runaway spellbook, and a rescue where calm words turn tangled magic into wonder.`,
    callTitle: "The Spellbook Calls",
    callScene: `A runaway spellbook flutters over Moonbeam Library, opens by itself, and writes ${heroName}'s name in silver stars.`,
    destination: "Moonbeam Library",
    troubleTitle: "Trouble in the Moonbeam Library",
    troubleScene: "The library shelves spin in slow circles because a Tangle Spell has knotted every magic word into a shimmering soup.",
    troubleBeing: "Tangle Spell",
    helper: "a shy baby dragon with smoky sneezes",
    tool: "kindness wand",
    clueOne: "inside the whispering dictionary",
    clueTwo: "above the cupcake spell shelf",
    clueThree: "around the moonlit reading rug",
    sceneFiveTitle: "The Whispering Dictionary",
    sceneFive: "A tiny correct word shivers between two dictionary pages, waiting for someone gentle enough to hear it.",
    sceneSixTitle: "The Cupcake Spell Shelf",
    sceneSix: "A rhyme bubble floats above the cupcake spells, making the sprinkles chant muddled magic in squeaky little voices.",
    sceneSevenTitle: "The Reading Rug Chase",
    sceneSeven: `The final magic word bounces across the moonlit rug, leaving silver footprints that glow when ${heroName} stays calm.`,
    transformationTitle: "The First Kind Spell",
    transformationScene: "When the spell words return, the Tangle Spell glows softly and whispers its first kind spell without wobbling.",
    testQuestion: "The spellbook asks: should magic be loud, fast, or kind?",
    paradeScene: "Moonbeam Library throws a quiet sparkle parade, with floating bookmarks instead of fireworks.",
    bedtimeScene: "As evening arrives, the spellbook becomes a bedtime star above the window.",
    finalTitle: "The Magic Words Come Home",
    finalScene: `${heroName} helps the Tangle Spell choose kind words, and Moonbeam Library shines like a room full of bedtime wishes.`,
    pageCopy: {
      start: {
        panels: [
          `${heroName} is almost ready for bed when a soft tap-tap-tap sounds from the window, like moonlight knocking politely.`,
          `Outside, Moonbeam Library has unfolded in the garden, its towers made from books and its door glowing with ${heroName}'s name.`,
        ],
        speech: ["A library made of moonlight?", "I will be careful with the magic."],
        sound: "TAP-TAP!",
      },
      fountain: {
        title: "The Library Has Lost Its Hush",
        panels: [
          `Inside, ladders slide by themselves, bookmarks flutter like birds, and every whispered word tangles into silver string.`,
          `${heroName} sees the Tangle Spell trembling behind a dictionary and understands this is not misbehaving magic. It is scared magic.`,
        ],
        speech: ["I won't shout.", "Scared magic needs kind words."],
        sound: "WHIRR!",
      },
      "cloud-story": {
        title: "The Spell That Felt Too Small",
        panels: [
          `The Tangle Spell explains that every big spell in the library knew how to shine, but it only knew how to knot things up.`,
          `${heroName} kneels beside the shy baby dragon and says that small magic can still help in a very important way.`,
        ],
        speech: ["Small magic matters.", "Let's find your true spell."],
        sound: "SNIFFLE!",
      },
      "map-maker": {
        title: "The Kindness Wand Wakes",
        panels: [
          `When ${heroName} holds the kindness wand, it does not flash or bang. It warms like a hand held safely in the dark.`,
          `Three silver words float onto the map: Listen, Try, Together. Each one points to a corner of Moonbeam Library.`,
        ],
        speech: ["This magic feels gentle.", "We follow the kind words first."],
        sound: "HUMMM!",
      },
      "library-laugh": {
        title: "The Word That Waited",
        panels: [
          `In the whispering dictionary, the word Listen is folded so small it looks like a silver moth.`,
          `${heroName} waits without grabbing, and the word lands softly on the kindness wand by itself.`,
        ],
        speech: ["I can wait.", "Listening is a spell too."],
        sound: "WHISPER!",
      },
      "bakery-bubble": {
        title: "The Cupcake Rhyme",
        panels: [
          `On the cupcake spell shelf, sprinkles chant the wrong rhyme until every cake grows a tiny hat.`,
          `${heroName} giggles, then gently says the word Try, and the rhyme settles into warm cinnamon sparkle.`,
        ],
        speech: ["Trying again can be funny.", "Let's say it kindly."],
        sound: "POOF!",
      },
      "playground-chase": {
        title: "The Reading Rug Runaround",
        panels: [
          `The final word, Together, races around the moonlit rug, looping past pillows, ladders, and sleepy ink pots.`,
          `${heroName} asks the baby dragon to help, and the little dragon's smoky sneeze makes a perfect silver circle.`,
        ],
        speech: ["Together, little dragon!", "We can guide it home."],
        sound: "ACHOO!",
      },
      "cloud-smile": {
        title: "A Spell Learns To Shine",
        panels: [
          `${heroName} places the three kind words beside the Tangle Spell, and the knots loosen into little ribbons of light.`,
          `The spellbook opens to a new page that reads: The strongest magic is the sort that helps everyone feel safe.`,
        ],
        speech: ["You were not wrong magic.", "You were learning magic."],
        sound: "SHIMMER!",
      },
      "comet-test": {
        title: "The Spellbook's Question",
        panels: [
          `The spellbook lifts one blank page and asks ${heroName} what magic should do when someone feels tangled inside.`,
          `${heroName} thinks of the shy dragon, the Tangle Spell, and every silver word that came home because nobody rushed.`,
        ],
        speech: ["Magic should help.", "Kind is the strongest answer."],
        sound: "HMMM!",
      },
      "town-parade": {
        title: "The Bookmark Parade",
        panels: [
          `Moonbeam Library celebrates with floating bookmarks, candle-soft stars, and tiny cheers that never wake the sleepy shelves.`,
          `${heroName} makes sure the Tangle Spell gets the biggest bookmark, because learning to use kind words was brave.`,
        ],
        speech: ["This cheer is yours too.", "We learned together."],
        sound: "FLIP-FLIP!",
      },
      "bedtime-star": {
        title: "The Window Star",
        panels: [
          `When Moonbeam Library folds itself back into the garden, one silver word stays glowing above ${heroName}'s window.`,
          `${heroName} feels the calm sort of proud that comes after helping someone find their gentle magic.`,
        ],
        speech: ["Listen. Try. Together.", "Goodnight, kind magic."],
        sound: "TWINKLE!",
      },
      "full-ending": {
        panels: [
          `Moonbeam Library settles back into the night, calmer and brighter because ${heroName} chose patience over panic.`,
          `At bedtime, one silver ribbon curls beside the pillow, ready to remind ${heroName} that kind words can untangle almost anything.`,
        ],
        speech: ["Goodnight, Moonbeam Library.", "I know the spell now."],
        sound: "TWINKLE!",
      },
    },
  }),
  fairy: (heroName, heroType) => ({
    title: `${heroName} and the Glow Garden`,
    subtitle: `${heroName} the ${heroType} brings colour back to a sleeping garden by listening before sprinkling sparkle.`,
    lesson: "Gentleness, confidence, and caring for nature",
    headline: "Unlock the full fairy garden adventure",
    body: `The full story follows ${heroName} through Fairy Meadow, missing colours, and a rescue where every tiny creature remembers how to shine.`,
    callTitle: "The Glow Flower Calls",
    callScene: `A glow flower blinks over Fairy Meadow and sends a trail of warm petals floating straight to ${heroName}.`,
    destination: "Fairy Meadow",
    troubleTitle: "Trouble in Fairy Meadow",
    troubleScene: "The glow flowers have forgotten their colours because Dull Dust has covered every petal with a sleepy grey sigh.",
    troubleBeing: "Dull Dust",
    helper: "a tiny bee wearing a brave little backpack",
    tool: "sparkle seed pouch",
    clueOne: "inside the petal library",
    clueTwo: "above the honey cake stall",
    clueThree: "around the mushroom playground",
    sceneFiveTitle: "The Petal Library",
    sceneFive: "A pink giggle of colour is tucked inside a petal book that opens only for careful hands and quiet hope.",
    sceneSixTitle: "The Honey Cake Stall",
    sceneSix: "A yellow glow bubble floats above honey cakes, making sugar stars dance across the sleepy stall.",
    sceneSevenTitle: "The Mushroom Playground",
    sceneSeven: `The biggest glow races around mushroom steps and leafy slides, waiting for ${heroName} to guide it home.`,
    transformationTitle: "The First Flower Glow",
    transformationScene: "When the colours return, Dull Dust turns into soft silver glitter and admits it only wanted to feel noticed.",
    testQuestion: "The glow flower asks: should magic sparkle for one person or help everyone bloom?",
    paradeScene: "Fairy Meadow throws a tiny petal parade with bubbles instead of fireworks.",
    bedtimeScene: "As evening arrives, the glow flower becomes a bedtime star above the window.",
    finalTitle: "The Garden Glows Again",
    finalScene: `${heroName} helps Dull Dust share its worry, and Fairy Meadow blooms in colours bright enough for dreams.`,
    pageCopy: {
      start: {
        panels: [
          `A petal lands on ${heroName}'s pillow, warm as a tiny lantern and dusted with sleepy gold.`,
          `When ${heroName} follows it, the bedroom wall opens into Fairy Meadow, where every flower is waiting in the dark.`,
        ],
        speech: ["The flowers need help.", "I can be gentle."],
        sound: "FLUTTER!",
      },
      fountain: {
        title: "The Meadow Without Colour",
        panels: [
          `Fairy Meadow should be humming with pinks, blues, yellows, and greens, but the petals hang pale and quiet.`,
          `${heroName} notices Dull Dust hiding under a leaf, not laughing at the flowers, just looking worried it will be swept away.`,
        ],
        speech: ["You can come out.", "We can fix colour without rushing."],
        sound: "HUSH!",
      },
      "cloud-story": {
        title: "Why Dull Dust Hid The Glow",
        panels: [
          `Dull Dust whispers that sparkly things always get chosen first, and plain things are brushed into corners.`,
          `${heroName} holds out the sparkle seed pouch and promises the meadow will need every kind of glow, even the quiet kind.`,
        ],
        speech: ["Quiet can be beautiful.", "Let's grow together."],
        sound: "PIP!",
      },
      "map-maker": {
        title: "Three Seeds Of Colour",
        panels: [
          `${heroName} shakes the sparkle seed pouch once, and three seeds float up: Rose, Honey, and Fern.`,
          `The tiny bee points the way with its backpack lantern, buzzing softly so nobody startles the sleepy flowers.`,
        ],
        speech: ["Rose, Honey, Fern.", "One colour at a time."],
        sound: "BUZZ!",
      },
      "library-laugh": {
        title: "The Rose Petal Page",
        panels: [
          `Inside the petal library, a rose-coloured glow hides between two pages that smell faintly of summer rain.`,
          `${heroName} opens the book with careful hands, and the first colour curls out like a sleepy ribbon.`,
        ],
        speech: ["Softly does it.", "Hello, Rose."],
        sound: "RUSTLE!",
      },
      "bakery-bubble": {
        title: "The Honey Glow",
        panels: [
          `At the honey cake stall, a yellow glow bubble wobbles above the cakes, too shy to land on a grey petal.`,
          `${heroName} asks the tiny bee to hum a brave little tune, and Honey floats down warm and golden.`,
        ],
        speech: ["Your hum helps.", "Honey has come home."],
        sound: "HMMM-BUZZ!",
      },
      "playground-chase": {
        title: "The Fern Slide Trail",
        panels: [
          `The last colour, Fern, darts around mushroom steps and leafy slides, leaving green sparkles wherever it almost lands.`,
          `${heroName} makes a quiet path with the meadow creatures so Fern can feel invited instead of chased.`,
        ],
        speech: ["We guide, not grab.", "This way, Fern."],
        sound: "BOING!",
      },
      "cloud-smile": {
        title: "The Quiet Glitter",
        panels: [
          `When the colours return, ${heroName} sprinkles a little silver dust around each bright petal so Dull Dust belongs too.`,
          `The meadow does not become less colourful. It becomes deeper, softer, and more magical than before.`,
        ],
        speech: ["You belong in the garden.", "Every glow has a place."],
        sound: "GLOW!",
      },
      "comet-test": {
        title: "The Glow Flower's Question",
        panels: [
          `The oldest glow flower bends toward ${heroName} and asks what a garden should do with someone who feels plain.`,
          `${heroName} looks at the bright petals and silver dust together, and the answer feels warm in their chest.`,
        ],
        speech: ["Make room for them.", "Every kind of shine matters."],
        sound: "GLOW-HUM!",
      },
      "town-parade": {
        title: "The Petal Parade",
        panels: [
          `Fairy Meadow celebrates with fireflies, petal drums, honey lanterns, and bubbles that glow in every colour ${heroName} rescued.`,
          `${heroName} walks beside Dull Dust so the silver glitter can shimmer proudly with the roses, honey cakes, and fern leaves.`,
        ],
        speech: ["We all made it beautiful.", "Silver belongs too."],
        sound: "POP-POP!",
      },
      "bedtime-star": {
        title: "The Glow Beside The Pillow",
        panels: [
          `When Fairy Meadow fades gently back through the wall, one glow flower stays beside ${heroName}'s pillow.`,
          `Its petals shine rose, honey, fern, and silver, quiet enough for sleep and bright enough for dreams.`,
        ],
        speech: ["Goodnight, colours.", "I will remember every glow."],
        sound: "TWINKLE!",
      },
      "full-ending": {
        panels: [
          `Fairy Meadow shines in layers of colour, with bright petals, quiet silver dust, and firefly lights swaying together.`,
          `${heroName} carries one sleepy glow flower home, where it becomes a night-light made from courage and care.`,
        ],
        speech: ["Goodnight, little meadow.", "I helped everyone bloom."],
        sound: "SHINE!",
      },
    },
  }),
  astronaut: (heroName, heroType) => ({
    title: `${heroName} and the Star Rescue`,
    subtitle: `${heroName} the ${heroType} discovers that space feels friendliest when nobody is left behind.`,
    lesson: "Bravery, calm thinking, and helping others feel at home",
    headline: "Unlock the full space rescue adventure",
    body: `The full story follows ${heroName} through Moonbase Kindness, a lonely star, and a teamwork mission across the moonbeams.`,
    callTitle: "The Lonely Star Calls",
    callScene: `A lonely star blinks SOS above Moonbase Kindness and points a silver beam toward ${heroName}.`,
    destination: "Moonbase Kindness",
    troubleTitle: "Trouble at Moonbase Kindness",
    troubleScene: "The moonbeams are wobbling because a homesick moon robot knocked the star path out of line.",
    troubleBeing: "homesick moon robot",
    helper: "a tiny comet guide with a flickering tail",
    tool: "gravity boots",
    clueOne: "inside the moon map room",
    clueTwo: "above the space snack station",
    clueThree: "around the crater playground",
    sceneFiveTitle: "The Moon Map Room",
    sceneFive: "A missing star coordinate is trapped between two glowing moon maps.",
    sceneSixTitle: "The Space Snack Station",
    sceneSix: "A light bubble floats above the space snacks, making crumbs orbit in circles.",
    sceneSevenTitle: "The Crater Playground",
    sceneSeven: "The final moonbeam zooms around craters, bouncing like a silver ball.",
    transformationTitle: "The First Star Smile",
    transformationScene: "When the moonbeams line up, the moon robot glows and admits it missed its friends.",
    testQuestion: "The lonely star asks: should heroes rush ahead or bring everyone home together?",
    paradeScene: "Moonbase Kindness throws a quiet orbit parade under safe twinkling lights.",
    bedtimeScene: "As evening arrives, the rescued star becomes a bedtime light above the window.",
    finalTitle: "The Stars Shine Home",
    finalScene: `${heroName} helps the moon robot feel brave again, and the star path shines across space.`,
  }),
  princess: (heroName, heroType) => ({
    title: `${heroName} and the Starlight Crown`,
    subtitle: `${heroName} the ${heroType} learns that a true royal heart listens first and helps everyone feel important.`,
    lesson: "Leadership, kindness, and sharing the spotlight",
    headline: "Unlock the full royal starlight adventure",
    body: `The full story follows ${heroName} through Starlight Castle, a worried crown, and a celebration where every small voice matters.`,
    callTitle: "The Crown Calls",
    callScene: `A starlight crown twinkles above the castle garden and writes ${heroName}'s name in gold across the evening sky.`,
    destination: "Starlight Castle",
    troubleTitle: "Trouble at Starlight Castle",
    troubleScene: "The royal wishes are trapped in bubbles because the Crown of Feelings is scared that only one person will be allowed to shine.",
    troubleBeing: "Crown of Feelings",
    helper: "a page with a wobbly tray of invitations",
    tool: "wish compass",
    clueOne: "inside the royal story room",
    clueTwo: "above the celebration cake table",
    clueThree: "around the castle playground",
    sceneFiveTitle: "The Royal Story Room",
    sceneFive: "A tiny wish is tucked inside a very serious royal book, waiting for a leader who reads with care.",
    sceneSixTitle: "The Celebration Cake Table",
    sceneSix: "A wish bubble floats above the cakes, making sugar pearls dance like little palace stars.",
    sceneSevenTitle: "The Castle Playground",
    sceneSeven: "The biggest wish bounces around the castle slides and ribbon swings, hoping nobody gets left out.",
    transformationTitle: "The First Crown Smile",
    transformationScene: "When the wishes return, the crown learns that a shared spotlight can make the whole castle brighter.",
    testQuestion: "The crown asks: should leaders be loud, fancy, or kind?",
    paradeScene: "Starlight Castle throws a gentle royal parade where every helper gets a cheer.",
    bedtimeScene: "As evening arrives, the crown becomes a bedtime star above the window.",
    finalTitle: "The Castle Shines Together",
    finalScene: `${heroName} helps the crown share its worries, and every royal wish finds a happy home under the starlight.`,
    pageCopy: {
      start: {
        panels: [
          `Just as the stars appear, a tiny golden crown rolls across ${heroName}'s floor and stops beside the slippers.`,
          `Through the window, Starlight Castle glows on the hill, but its tallest tower is blinking as if it might cry.`,
        ],
        speech: ["A crown came to find me.", "I'll listen before I lead."],
        sound: "TING!",
      },
      fountain: {
        title: "The Wishes In The Bubbles",
        panels: [
          `In the castle garden, hundreds of wish bubbles float above the roses, each one holding a tiny hopeful voice.`,
          `${heroName} sees the Crown of Feelings tucked beneath a velvet cushion, afraid that shining means leaving others in shadow.`,
        ],
        speech: ["A true crown listens.", "No wish gets left behind."],
        sound: "POP!",
      },
      "cloud-story": {
        title: "The Crown's Small Worry",
        panels: [
          `The crown admits it has heard plenty of speeches and parades, but not enough thank-yous or quiet voices.`,
          `${heroName} asks the page to set down the wobbly tray, because royal work starts better when everyone feels steady.`,
        ],
        speech: ["Tell me the small voices.", "We can make room."],
        sound: "WOBBLE!",
      },
      "map-maker": {
        title: "The Wish Compass Turns",
        panels: [
          `The wish compass spins past the ballroom and points instead to hidden places where quiet hopes have been waiting.`,
          `${heroName} draws a royal route that includes the story room, cake table, and playground, because every corner of the castle matters.`,
        ],
        speech: ["Leadership is noticing.", "The map includes everyone."],
        sound: "CLICK!",
      },
      "library-laugh": {
        title: "The Story Room Wish",
        panels: [
          `Inside the royal story room, a tiny wish is tucked between pages about brave queens, helpful pages, and children who spoke up kindly.`,
          `${heroName} reads slowly until the wish floats out and whispers, "Please let quiet voices count too."`,
        ],
        speech: ["Quiet voices count.", "I heard your wish."],
        sound: "PAGE!",
      },
      "bakery-bubble": {
        title: "The Cake Table Wish",
        panels: [
          `Above the celebration cakes, a wish bubble bobs between sugar pearls, too nervous to join the party.`,
          `${heroName} asks the page to steady the tray, then invites the bubble down with a smile instead of a royal command.`,
        ],
        speech: ["No commands needed.", "You can join when you are ready."],
        sound: "PLINK!",
      },
      "playground-chase": {
        title: "The Ribbon Swing Wish",
        panels: [
          `The biggest wish bounces around castle slides and ribbon swings, carrying the hope that nobody gets left out of the games.`,
          `${heroName} makes a circle on the grass so every child, helper, and shy little wish has a place to land.`,
        ],
        speech: ["Make the circle wider.", "Everyone fits here."],
        sound: "SWISH!",
      },
      "cloud-smile": {
        title: "The Crown Learns To Share",
        panels: [
          `${heroName} places the rescued wishes around the Crown of Feelings, and each one adds a different kind of sparkle.`,
          `The crown sees that sharing the spotlight does not make it dimmer. It makes the whole castle glow.`,
        ],
        speech: ["Your shine can be shared.", "Look how bright we are together."],
        sound: "GLOW!",
      },
      "comet-test": {
        title: "The Crown's Royal Question",
        panels: [
          `The Crown of Feelings asks ${heroName} what a leader should do when the room is full of louder voices.`,
          `${heroName} remembers the story room, the cake table, the playground, and every small wish that needed space.`,
        ],
        speech: ["A leader listens for the quietest voice.", "Kindness is royal too."],
        sound: "HMMM!",
      },
      "town-parade": {
        title: "A Parade For Every Helper",
        panels: [
          `${heroName} walks beside the gardeners, bakers, pages, guards, and children instead of waving from far away.`,
          `The Crown of Feelings shines brightest when it sees that being royal can mean making other people feel important.`,
        ],
        speech: ["This cheer is for all of us.", "The castle shines together."],
        sound: "HOORAY!",
      },
      "bedtime-star": {
        title: "The Castle Star",
        panels: [
          `When the royal parade quiets, Starlight Castle sends one soft gold star to rest above ${heroName}'s window.`,
          `It glows with every wish that found a home, gentle enough for sleep and grand enough for dreams.`,
        ],
        speech: ["Goodnight, Starlight Castle.", "I will remember to listen."],
        sound: "TWINKLE!",
      },
      "full-ending": {
        panels: [
          `At the final celebration, ${heroName} places the crown on a cushion in the middle so everyone can add one kind wish.`,
          `By bedtime, the castle star glows above the window, reminding ${heroName} that the best leaders make room for every heart.`,
        ],
        speech: ["Every wish matters.", "That is how castles shine."],
        sound: "SPARKLE!",
      },
    },
  }),
  "dragon-trainer": (heroName, heroType) => ({
    title: `${heroName} and the Dragon's Brave Roar`,
    subtitle: `${heroName} the ${heroType} discovers that even fiery friends need patience and gentle courage.`,
    lesson: "Patience, trust, and helping big feelings settle",
    headline: "Unlock the full dragon-training adventure",
    body: `The full story follows ${heroName} through Ember Valley, a nervous dragon, and a rescue where trust is stronger than shouting.`,
    callTitle: "The Dragon Scale Calls",
    callScene: `A golden dragon scale glows above Ember Valley and sends warm sparks toward ${heroName}.`,
    destination: "Ember Valley",
    troubleTitle: "Trouble in Ember Valley",
    troubleScene: "The training bells are clanging because a young dragon has lost its brave roar.",
    troubleBeing: "young dragon",
    helper: "a tiny fire lizard carrying a safety flag",
    tool: "calm courage whistle",
    clueOne: "inside the dragon handbook cave",
    clueTwo: "above the warm biscuit stall",
    clueThree: "around the lava-stone playground",
    sceneFiveTitle: "The Dragon Handbook Cave",
    sceneFive: "A brave roar clue is tucked between two pages of an old dragon handbook.",
    sceneSixTitle: "The Warm Biscuit Stall",
    sceneSix: "A courage bubble floats above cinnamon biscuits, making sugar sparks dance.",
    sceneSevenTitle: "The Lava-Stone Playground",
    sceneSeven: "The final roar echo bounces around safe lava-stone steps.",
    transformationTitle: "The First Gentle Roar",
    transformationScene: "When the echoes return, the young dragon makes a small proud roar and smiles.",
    testQuestion: "The dragon scale asks: should trainers be bossy, fast, or kind?",
    paradeScene: "Ember Valley throws a warm lantern parade with soft dragon puffs in the sky.",
    bedtimeScene: "As evening arrives, the dragon scale becomes a bedtime star above the window.",
    finalTitle: "The Brave Roar Comes Home",
    finalScene: `${heroName} helps the young dragon trust itself, and Ember Valley glows with gentle courage.`,
  }),
  ninja: (heroName, heroType) => ({
    title: `${heroName} and the Silent Star Mission`,
    subtitle: `${heroName} the ${heroType} learns that focus, fairness, and kindness are stronger than sneaking alone.`,
    lesson: "Focus, self-control, and using skill to help",
    headline: "Unlock the full ninja mission",
    body: `The full story follows ${heroName} through Lantern Rooftops, missing calm bells, and a mission where quiet courage saves the day.`,
    callTitle: "The Silent Star Calls",
    callScene: `A silver ninja star glides over Lantern Rooftops and lands gently beside ${heroName}.`,
    destination: "Lantern Rooftops",
    troubleTitle: "Trouble on Lantern Rooftops",
    troubleScene: "The calm bells have vanished because the Rush Shadow made everyone hurry and bump into each other.",
    troubleBeing: "Rush Shadow",
    helper: "a tiny apprentice with tangled training ribbons",
    tool: "focus lantern",
    clueOne: "inside the quiet scroll room",
    clueTwo: "above the rice cake stall",
    clueThree: "around the rooftop practice course",
    sceneFiveTitle: "The Quiet Scroll Room",
    sceneFive: "A calm bell note is tucked between two scrolls that only open for steady breathing.",
    sceneSixTitle: "The Rice Cake Stall",
    sceneSix: "A focus bubble floats above rice cakes, making sesame seeds dance.",
    sceneSevenTitle: "The Rooftop Practice Course",
    sceneSeven: "The final calm bell note bounces across stepping stones and lantern ropes.",
    transformationTitle: "The First Quiet Smile",
    transformationScene: "When the bells return, the Rush Shadow slows down and discovers calm feels safe.",
    testQuestion: "The silent star asks: should skill be used to show off or help others?",
    paradeScene: "Lantern Rooftops glow with a quiet parade of soft lights.",
    bedtimeScene: "As evening arrives, the silent star becomes a bedtime light above the window.",
    finalTitle: "The Calm Bells Ring",
    finalScene: `${heroName} helps Rush Shadow slow down, and the rooftops ring with peaceful courage.`,
  }),
  pirate: (heroName, heroType) => ({
    title: `${heroName} and the Sharing Treasure`,
    subtitle: `${heroName} the ${heroType} finds that the best treasure is fair, kind, and shared.`,
    lesson: "Fairness, honesty, and teamwork",
    headline: "Unlock the full pirate treasure adventure",
    body: `The full story follows ${heroName} across Starfish Cove, a worried map, and a treasure that only opens for teamwork.`,
    callTitle: "The Treasure Map Calls",
    callScene: `A glowing treasure map flutters over Starfish Cove and draws ${heroName}'s name in dotted lines.`,
    destination: "Starfish Cove",
    troubleTitle: "Trouble at Starfish Cove",
    troubleScene: "The treasure chest will not open because the Greedy Fog wants all the gold for itself.",
    troubleBeing: "Greedy Fog",
    helper: "a small deckhand with a compass bigger than both hands",
    tool: "fair-share compass",
    clueOne: "inside the captain's log room",
    clueTwo: "above the sea biscuit barrel",
    clueThree: "around the sandy playground",
    sceneFiveTitle: "The Captain's Log",
    sceneFive: "A missing map clue is tucked inside a very serious captain's log.",
    sceneSixTitle: "The Sea Biscuit Barrel",
    sceneSix: "A clue bubble floats above sea biscuits, making crumbs dance like tiny boats.",
    sceneSevenTitle: "The Sandy Playground",
    sceneSeven: "The final clue races around driftwood swings and shell slides.",
    transformationTitle: "The First Fair Share",
    transformationScene: "When the clues return, Greedy Fog learns that shared treasure makes more smiles.",
    testQuestion: "The map asks: should captains grab treasure or guide the crew fairly?",
    paradeScene: "Starfish Cove throws a tiny dock parade with bubbles instead of cannon booms.",
    bedtimeScene: "As evening arrives, the map becomes a bedtime star above the window.",
    finalTitle: "The Treasure Opens",
    finalScene: `${heroName} helps Greedy Fog share, and the treasure chest opens to reveal kindness coins.`,
  }),
  knight: (heroName, heroType) => ({
    title: `${heroName} and the Gentle Shield`,
    subtitle: `${heroName} the ${heroType} learns that true bravery protects, listens, and stands up kindly.`,
    lesson: "Bravery, protection, and gentle leadership",
    headline: "Unlock the full knightly quest",
    body: `The full story follows ${heroName} through Kindness Keep, a worried shield, and a quest where gentle bravery wins.`,
    callTitle: "The Shield Calls",
    callScene: `A glowing shield rises above Kindness Keep and reflects ${heroName}'s name in gold.`,
    destination: "Kindness Keep",
    troubleTitle: "Trouble at Kindness Keep",
    troubleScene: "The castle gates are stuck because the Worry Wall thinks everyone outside might be scary.",
    troubleBeing: "Worry Wall",
    helper: "a tiny squire carrying a velvet banner",
    tool: "gentle shield",
    clueOne: "inside the castle story room",
    clueTwo: "above the banquet cake table",
    clueThree: "around the courtyard playground",
    sceneFiveTitle: "The Castle Story Room",
    sceneFive: "A brave word is tucked inside a knightly storybook.",
    sceneSixTitle: "The Banquet Cake Table",
    sceneSix: "A courage bubble floats above the cakes, making sugar shields sparkle.",
    sceneSevenTitle: "The Courtyard Playground",
    sceneSeven: "The final brave word bounces around hay bales and ribbon flags.",
    transformationTitle: "The First Open Gate",
    transformationScene: "When the brave words return, Worry Wall opens one tiny doorway and peeks out.",
    testQuestion: "The shield asks: should brave knights shout, charge, or protect kindly?",
    paradeScene: "Kindness Keep throws a soft banner parade where every helper feels safe.",
    bedtimeScene: "As evening arrives, the shield becomes a bedtime star above the window.",
    finalTitle: "The Gates Open Kindly",
    finalScene: `${heroName} helps Worry Wall feel safe, and Kindness Keep welcomes everyone in.`,
  }),
  mermaid: (heroName, heroType) => ({
    title: `${heroName} and the Pearl of Kindness`,
    subtitle: `${heroName} the ${heroType} dives into a shimmering sea quest where listening helps every creature shine.`,
    lesson: "Kindness, courage, and caring for others",
    headline: "Unlock the full mermaid sea adventure",
    body: `The full story follows ${heroName} through Coral Cove, a worried pearl, and an underwater rescue filled with courage and care.`,
    callTitle: "The Pearl Calls",
    callScene: `A glowing pearl rises from Coral Cove and sends a silver wave toward ${heroName}.`,
    destination: "Coral Cove",
    troubleTitle: "Trouble in Coral Cove",
    troubleScene: "The coral lights have gone dim because the Lonely Pearl hid every shimmer at the bottom of the reef.",
    troubleBeing: "Lonely Pearl",
    helper: "a shy seahorse carrying a shell lantern",
    tool: "kindness shell",
    clueOne: "inside the shell library",
    clueTwo: "above the kelp cake stall",
    clueThree: "around the bubble playground",
    sceneFiveTitle: "The Shell Library",
    sceneFive: "A tiny shimmer is tucked inside a shell book that opens only for gentle voices.",
    sceneSixTitle: "The Kelp Cake Stall",
    sceneSix: "A shimmer bubble floats above kelp cakes, making sea-sugar sparkle.",
    sceneSevenTitle: "The Bubble Playground",
    sceneSeven: "The biggest shimmer bounces through bubble hoops and coral slides.",
    transformationTitle: "The First Pearl Glow",
    transformationScene: "When the shimmers return, the Lonely Pearl glows softly and asks to join the reef.",
    testQuestion: "The pearl asks: should heroes sparkle alone or help everyone shine?",
    paradeScene: "Coral Cove throws a quiet bubble parade with lantern fish lighting the way.",
    bedtimeScene: "As evening arrives, the pearl becomes a bedtime star above the window.",
    finalTitle: "The Reef Shines Again",
    finalScene: `${heroName} helps the Lonely Pearl feel welcome, and Coral Cove glows from reef to shore.`,
  }),
  "unicorn-rider": (heroName, heroType) => ({
    title: `${heroName} and the Rainbow Rein`,
    subtitle: `${heroName} the ${heroType} learns that trust and kindness guide even the brightest magic.`,
    lesson: "Trust, confidence, and gentle leadership",
    headline: "Unlock the full unicorn riding adventure",
    body: `The full story follows ${heroName} across Rainbow Meadow, a nervous unicorn, and a ride where trust saves the day.`,
    callTitle: "The Rainbow Rein Calls",
    callScene: `A rainbow rein floats above Rainbow Meadow and sparkles directly toward ${heroName}.`,
    destination: "Rainbow Meadow",
    troubleTitle: "Trouble in Rainbow Meadow",
    troubleScene: "The rainbow bridge has faded because a nervous unicorn is scared to make the first leap.",
    troubleBeing: "nervous unicorn",
    helper: "a little cloud foal with silver hooves",
    tool: "trusty rainbow rein",
    clueOne: "inside the meadow story nook",
    clueTwo: "above the oatcake picnic",
    clueThree: "around the rainbow practice course",
    sceneFiveTitle: "The Meadow Story Nook",
    sceneFive: "A brave colour is tucked inside a storybook about first tries.",
    sceneSixTitle: "The Oatcake Picnic",
    sceneSix: "A colour bubble floats above the oatcakes, making rainbow crumbs dance.",
    sceneSevenTitle: "The Rainbow Practice Course",
    sceneSeven: "The final colour races around hoops, flags, and soft cloud jumps.",
    transformationTitle: "The First Rainbow Step",
    transformationScene: "When the colours return, the unicorn takes one tiny brave step and the bridge glows.",
    testQuestion: "The rainbow rein asks: should riders pull hard or guide with care?",
    paradeScene: "Rainbow Meadow throws a soft hoofbeat parade under gentle colours.",
    bedtimeScene: "As evening arrives, the rainbow rein becomes a bedtime star above the window.",
    finalTitle: "The Rainbow Bridge Returns",
    finalScene: `${heroName} helps the nervous unicorn trust itself, and the rainbow bridge shines again.`,
  }),
  "dinosaur-expert": (heroName, heroType) => ({
    title: `${heroName} and the Dino Egg Rescue`,
    subtitle: `${heroName} the ${heroType} follows fossil clues and learns that big discoveries need gentle hands and patient eyes.`,
    lesson: "Curiosity, patience, and caring for nature",
    headline: "Unlock the full dinosaur rescue",
    body: `The full story follows ${heroName} through Fossil Valley, a missing egg, and a rescue where careful thinking keeps tiny dinosaurs safe.`,
    callTitle: "The Fossil Calls",
    callScene: `A golden fossil glows in Fossil Valley and points a trail of tiny, urgent footprints toward ${heroName}.`,
    destination: "Fossil Valley",
    troubleTitle: "Trouble in Fossil Valley",
    troubleScene: "A dino egg has rolled away because Rumble Hill shook when everyone rushed too fast through the valley.",
    troubleBeing: "Rumble Hill",
    helper: "a tiny triceratops with muddy knees",
    tool: "fossil finder",
    clueOne: "inside the fossil record cave",
    clueTwo: "above the leaf snack pile",
    clueThree: "around the dino playground",
    sceneFiveTitle: "The Fossil Record Cave",
    sceneFive: "A footprint clue is pressed into stone between two ancient leaf prints, soft enough to need careful eyes.",
    sceneSixTitle: "The Leaf Snack Pile",
    sceneSix: "A clue bubble floats above leafy snacks, making fern crumbs dance beside tiny tooth marks.",
    sceneSevenTitle: "The Dino Playground",
    sceneSeven: `The final footprint races around log bridges and soft mud slides, leading ${heroName} closer to the nest.`,
    transformationTitle: "The First Gentle Rumble",
    transformationScene: "When the clues return, Rumble Hill settles down and the egg nest glows with warm speckled light.",
    testQuestion: "The fossil asks: should explorers rush or protect what they find?",
    paradeScene: "Fossil Valley throws a stomp-soft parade so the tiny egg can rest.",
    bedtimeScene: "As evening arrives, the fossil becomes a bedtime star above the window.",
    finalTitle: "The Dino Egg Comes Home",
    finalScene: `${heroName} helps Rumble Hill calm down, and the dino egg returns safely to its nest beneath the fern trees.`,
    pageCopy: {
      start: {
        panels: [
          `${heroName} finds a glowing fossil beside the bed, warm with tiny footprints that appear one by one across the floor.`,
          `The footprints lead to Fossil Valley, where fern trees sway under golden sunset and a worried chirp echoes through the leaves.`,
        ],
        speech: ["Those footprints are a clue.", "I'll be careful."],
        sound: "CHIRP!",
      },
      fountain: {
        title: "The Egg That Rolled Away",
        panels: [
          `A baby dinosaur nest sits beneath the fern trees, but one speckled egg is missing from the soft moss.`,
          `${heroName} spots Rumble Hill shaking in the distance and knows the valley needs calm feet, quiet eyes, and a clever plan.`,
        ],
        speech: ["No rushing near an egg.", "We follow the clues gently."],
        sound: "RUMBLE!",
      },
      "cloud-story": {
        title: "Rumble Hill Did Not Mean To Shake",
        panels: [
          `Rumble Hill explains that every explorer stomped past too quickly, and all the noise made the stones jump with worry.`,
          `${heroName} pats the tiny triceratops on its muddy back and shows everyone how to step softly like falling leaves.`,
        ],
        speech: ["The hill was worried.", "Soft steps, everyone."],
        sound: "THUD-SHH!",
      },
      "map-maker": {
        title: "The Fossil Finder Map",
        panels: [
          `The fossil finder glows whenever ${heroName} looks closely instead of quickly, tracing careful circles in the warm dust.`,
          `A footprint, a fern crumb, and a tiny shell mark the trail from the nest toward the safest hollow in the valley.`,
        ],
        speech: ["Slow looking finds more.", "The egg left a gentle trail."],
        sound: "BEEP!",
      },
      "library-laugh": {
        title: "The Footprint In Stone",
        panels: [
          `Inside the fossil record cave, ${heroName} finds a tiny footprint pressed into soft stone beside an ancient fern shape.`,
          `The tiny triceratops wants to rush ahead, but ${heroName} shows how careful eyes can protect delicate clues.`,
        ],
        speech: ["Look closely.", "This clue is fragile."],
        sound: "TAP!",
      },
      "bakery-bubble": {
        title: "The Leaf Snack Clue",
        panels: [
          `Near the leaf snack pile, fern crumbs dance in a little bubble beside two tiny tooth marks.`,
          `${heroName} notices the egg did not roll alone; a baby dinosaur must have tried to follow and got worried too.`,
        ],
        speech: ["The baby was scared.", "We help the egg and the little one."],
        sound: "CRUNCH!",
      },
      "playground-chase": {
        title: "The Mud Slide Clue",
        panels: [
          `The last footprint is half-hidden beside a mud slide, where the egg must have rolled without cracking its spotted shell.`,
          `${heroName} asks the bigger dinosaurs to wait back, then builds a soft fern path with the tiny triceratops.`,
        ],
        speech: ["Give the egg space.", "Fern path first."],
        sound: "SQUELCH!",
      },
      "cloud-smile": {
        title: "Rumble Hill Settles",
        panels: [
          `${heroName} follows the fern path to a warm hollow where the egg rests safely in a patch of moss.`,
          `Rumble Hill takes one slow breath, then another, until the stones stop jumping and the valley grows peaceful.`,
        ],
        speech: ["Slow breaths, big hill.", "The egg is safe."],
        sound: "RUMMM...",
      },
      "comet-test": {
        title: "The Fossil's Question",
        panels: [
          `The golden fossil glows and asks ${heroName} what explorers should do when a discovery feels exciting and important.`,
          `${heroName} thinks of the fragile footprint, the worried baby dinosaur, and the egg that needed gentle hands.`,
        ],
        speech: ["Protect it first.", "Discovery needs care."],
        sound: "HMMM!",
      },
      "town-parade": {
        title: "The Stomp-Soft Parade",
        panels: [
          `Fossil Valley celebrates with a stomp-soft parade, where every dinosaur lifts its feet carefully so the egg can rest.`,
          `${heroName} leads from the front, showing that being an expert means noticing small things and keeping them safe.`,
        ],
        speech: ["Soft steps, everyone.", "Tiny things matter."],
        sound: "STOMP-SOFT!",
      },
      "bedtime-star": {
        title: "The Fossil Night-Light",
        panels: [
          `As evening settles over the fern trees, the golden fossil sends one warm glow back home with ${heroName}.`,
          `Beside the bed, it shines like a tiny nest light, full of careful thinking and brave kindness.`,
        ],
        speech: ["Goodnight, Fossil Valley.", "I used gentle hands."],
        sound: "TWINKLE!",
      },
      "full-ending": {
        panels: [
          `${heroName} carries the egg the last little way on a bed of ferns, while Rumble Hill keeps perfectly still.`,
          `When the egg nest glows again, Fossil Valley cheers in whisper-soft roars so the smallest dinosaur can sleep.`,
        ],
        speech: ["Home safe.", "Big discoveries need gentle hands."],
        sound: "SOFT ROAR!",
      },
    },
  }),
  "pop-star": (heroName, heroType) => ({
    title: `${heroName} and the Song of Shine`,
    subtitle: `${heroName} the ${heroType} discovers that the best performance helps everyone find their voice.`,
    lesson: "Confidence, creativity, and sharing the spotlight",
    headline: "Unlock the full pop star performance",
    body: `The full story follows ${heroName} through Melody Theatre, a missing song, and a show where every voice matters.`,
    callTitle: "The Microphone Calls",
    callScene: `A sparkling microphone glows above Melody Theatre and hums ${heroName}'s name.`,
    destination: "Melody Theatre",
    troubleTitle: "Trouble at Melody Theatre",
    troubleScene: "The final song has gone quiet because the Stage Fright Shadow thinks every note must be perfect.",
    troubleBeing: "Stage Fright Shadow",
    helper: "a nervous dancer hiding behind the curtain",
    tool: "confidence microphone",
    clueOne: "inside the lyric library",
    clueTwo: "above the backstage cupcake table",
    clueThree: "around the rehearsal floor",
    sceneFiveTitle: "The Lyric Library",
    sceneFive: "A tiny chorus is tucked between two pages of a very serious songbook.",
    sceneSixTitle: "The Backstage Cupcakes",
    sceneSix: "A music bubble floats above cupcakes, making sprinkles tap a beat.",
    sceneSevenTitle: "The Rehearsal Floor",
    sceneSeven: "The biggest note dances across spotlights, steps, and ribbon marks.",
    transformationTitle: "The First Brave Note",
    transformationScene: "When the notes return, Stage Fright Shadow hums quietly and feels less alone.",
    testQuestion: "The microphone asks: should stars shine alone or help the whole stage glow?",
    paradeScene: "Melody Theatre throws a gentle encore parade with soft lights and happy claps.",
    bedtimeScene: "As evening arrives, the microphone becomes a bedtime star above the window.",
    finalTitle: "The Song Returns",
    finalScene: `${heroName} helps Stage Fright Shadow sing bravely, and Melody Theatre fills with joyful music.`,
  }),
  "race-driver": (heroName, heroType) => ({
    title: `${heroName} and the Rainbow Race`,
    subtitle: `${heroName} the ${heroType} learns that a kind race is safer, fairer, and more fun for everyone.`,
    lesson: "Fair play, safety, and steady confidence",
    headline: "Unlock the full racing adventure",
    body: `The full story follows ${heroName} around Speedy City Circuit, a wobbly racer, and a finish where fairness wins.`,
    callTitle: "The Checkered Flag Calls",
    callScene: `A checkered flag made of lightning waves above Speedy City Circuit and points toward ${heroName}.`,
    destination: "Speedy City Circuit",
    troubleTitle: "Trouble at Speedy City Circuit",
    troubleScene: "The race lights are stuck on hurry because Turbo Worry thinks winning matters more than safety.",
    troubleBeing: "Turbo Worry",
    helper: "a small mechanic with oil on their nose",
    tool: "fair-play turbo badge",
    clueOne: "inside the pit-stop map room",
    clueTwo: "above the track snack stand",
    clueThree: "around the practice course",
    sceneFiveTitle: "The Pit-Stop Map Room",
    sceneFive: "A safe route clue is tucked between two track maps.",
    sceneSixTitle: "The Track Snack Stand",
    sceneSix: "A clue bubble floats above flapjacks, making crumbs race in circles.",
    sceneSevenTitle: "The Practice Course",
    sceneSeven: "The final route marker zooms around cones, flags, and gentle bends.",
    transformationTitle: "The First Fair Lap",
    transformationScene: "When the route markers return, Turbo Worry slows down and lets everyone line up safely.",
    testQuestion: "The flag asks: should racers win at any cost or help everyone finish proud?",
    paradeScene: "Speedy City Circuit throws a victory lap parade where every racer is cheered.",
    bedtimeScene: "As evening arrives, the checkered flag becomes a bedtime star above the window.",
    finalTitle: "The Kind Race Wins",
    finalScene: `${heroName} helps Turbo Worry slow down, and the Rainbow Race becomes fair, safe, and joyful.`,
  }),
  doctor: (heroName, heroType) => ({
    title: `${heroName} and the Care Town Check-Up`,
    subtitle: `${heroName} the ${heroType} shows that helping works best with calm words and careful listening.`,
    lesson: "Care, calm problem-solving, and empathy",
    headline: "Unlock the full caring doctor adventure",
    body: `The full story follows ${heroName} through Care Town, a worried waiting room, and a rescue where everyone feels looked after.`,
    callTitle: "The Stethoscope Calls",
    callScene: `A glowing stethoscope shines above Care Town and beats a gentle rhythm for ${heroName}.`,
    destination: "Care Town",
    troubleTitle: "Trouble in Care Town",
    troubleScene: "The waiting room is noisy because Worry Fever made everyone forget to breathe slowly and ask for help.",
    troubleBeing: "Worry Fever",
    helper: "a tired helper holding a clipboard",
    tool: "kindness checklist",
    clueOne: "inside the story clinic",
    clueTwo: "above the snack trolley",
    clueThree: "around the recovery play corner",
    sceneFiveTitle: "The Story Clinic",
    sceneFive: "A calm breath clue is tucked inside a picture book about feeling better.",
    sceneSixTitle: "The Snack Trolley",
    sceneSix: "A care bubble floats above crackers, making tiny crumbs dance.",
    sceneSevenTitle: "The Recovery Play Corner",
    sceneSeven: "The final calm clue bounces around soft blocks and friendly posters.",
    transformationTitle: "The First Calm Breath",
    transformationScene: "When the clues return, Worry Fever shrinks and everyone remembers one slow breath.",
    testQuestion: "The stethoscope asks: should helpers rush, guess, or listen carefully?",
    paradeScene: "Care Town throws a quiet thank-you parade for every helper.",
    bedtimeScene: "As evening arrives, the stethoscope becomes a bedtime star above the window.",
    finalTitle: "Care Town Feels Better",
    finalScene: `${heroName} helps Worry Fever settle, and Care Town learns that calm care helps everyone heal.`,
  }),
  "basketball-player": (heroName, heroType) => ({
    title: `${heroName} and the Teamwork Shot`,
    subtitle: `${heroName} the ${heroType} learns that great players lift the whole team before taking the final shot.`,
    lesson: "Teamwork, confidence, and fair play",
    headline: "Unlock the full basketball teamwork story",
    body: `The full story follows ${heroName} through Bounce Arena, missing team spirit, and a final play where everyone matters.`,
    callTitle: "The Golden Ball Calls",
    callScene: `A golden basketball bounces over Bounce Arena and spins ${heroName}'s name in the air.`,
    destination: "Bounce Arena",
    troubleTitle: "Trouble at Bounce Arena",
    troubleScene: "The scoreboard is frozen because Solo Shadow made everyone try to win alone.",
    troubleBeing: "Solo Shadow",
    helper: "a nervous teammate with untied laces",
    tool: "team spirit wristband",
    clueOne: "inside the playbook room",
    clueTwo: "above the half-time snack bench",
    clueThree: "around the practice court",
    sceneFiveTitle: "The Playbook Room",
    sceneFive: "A passing clue is tucked between two pages of a team playbook.",
    sceneSixTitle: "The Half-Time Snack Bench",
    sceneSix: "A teamwork bubble floats above orange slices, making juice drops bounce.",
    sceneSevenTitle: "The Practice Court",
    sceneSeven: "The final team clue dribbles around cones, hoops, and cheering benches.",
    transformationTitle: "The First Team Pass",
    transformationScene: "When the clues return, Solo Shadow sees the ball move faster when everyone helps.",
    testQuestion: "The golden ball asks: should heroes score alone or make the whole team stronger?",
    paradeScene: "Bounce Arena throws a tiny trophy parade where every player gets a cheer.",
    bedtimeScene: "As evening arrives, the golden ball becomes a bedtime star above the window.",
    finalTitle: "The Teamwork Shot Goes In",
    finalScene: `${heroName} helps Solo Shadow pass the ball, and Bounce Arena learns that teamwork wins hearts.`,
  }),
  spy: modernStoryTheme({
    title: (heroName) => `${heroName} and the Kindness Code`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} discovers that the best secret agents protect people with patience, honesty, and care.`,
    lesson: "Honesty, focus, and using secrets responsibly",
    headline: "Unlock the full secret mission story",
    destination: "Moonlight Mission HQ",
    signal: "The Kindness Code",
    troubleTitle: "Trouble at Mission HQ",
    troubleScene: "The mission screens are blinking because Whisper Static has muddled every message into half-truths.",
    troubleBeing: "Whisper Static",
    helper: "a junior agent with a notebook full of crossed-out clues",
    tool: "truth compass",
    clueOne: "inside the quiet evidence room",
    clueTwo: "above the cocoa cart",
    clueThree: "around the laser practice maze",
    sceneFiveTitle: "The Evidence Room",
    sceneFive: "A truthful clue is tucked inside a folder that opens only when the whole story is heard.",
    sceneSixTitle: "The Cocoa Cart",
    sceneSix: "A message bubble floats above the cocoa cups, making marshmallows tap out a code.",
    sceneSevenTitle: "The Laser Maze",
    sceneSeven: "The final clue glides through safe red beams, mirrors, and moonlit floor tiles.",
    transformationTitle: "The First Honest Message",
    transformationScene: "When the messages return, Whisper Static softens and admits it was scared of being misunderstood.",
    testQuestion: "The code asks: should agents hide the truth or help people understand it safely?",
    paradeScene: "Mission HQ celebrates with quiet badges, warm cocoa, and no noisy alarms.",
    bedtimeScene: "As evening arrives, the Kindness Code becomes a tiny bedtime light above the window.",
    finalTitle: "The Mission Turns Kind",
    finalScene: (heroName) => `${heroName} helps Whisper Static tell the truth gently, and Mission HQ shines with trust again.`,
  }),
  prince: modernStoryTheme({
    title: (heroName) => `${heroName} and the Listening Crown`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that real leadership begins by listening before deciding.`,
    lesson: "Leadership, listening, and sharing responsibility",
    headline: "Unlock the full royal listening adventure",
    destination: "Kindness Kingdom",
    signal: "The Listening Crown",
    troubleTitle: "Trouble in Kindness Kingdom",
    troubleScene: "The royal bell is ringing too loudly because Bossy Echo wants every decision made its way.",
    troubleBeing: "Bossy Echo",
    helper: "a young page carrying three different royal requests",
    tool: "listening crown",
    clueOne: "inside the council story room",
    clueTwo: "above the royal picnic table",
    clueThree: "around the courtyard games",
    sceneFiveTitle: "The Council Story Room",
    sceneFive: "A fair idea is tucked inside a storybook about taking turns.",
    sceneSixTitle: "The Royal Picnic",
    sceneSix: "A kindness bubble floats above jam tarts, making sugar pearls sparkle.",
    sceneSevenTitle: "The Courtyard Games",
    sceneSeven: "The final idea bounces between ribbons, hoops, and laughing helpers.",
    transformationTitle: "The First Fair Choice",
    transformationScene: "When every voice is heard, Bossy Echo becomes a soft reminder to listen twice.",
    testQuestion: "The crown asks: should leaders be loudest, fanciest, or fairest?",
    paradeScene: "Kindness Kingdom throws a gentle parade where every helper gets a royal thank-you.",
    bedtimeScene: "As evening arrives, the crown becomes a bedtime star above the castle window.",
    finalTitle: "The Kingdom Listens",
    finalScene: (heroName) => `${heroName} helps Bossy Echo listen, and Kindness Kingdom makes its fairest choice yet.`,
  }),
  "zoo-keeper": modernStoryTheme({
    title: (heroName) => `${heroName} and the Moonlit Zoo Rescue`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} helps every animal feel safe, understood, and ready for bedtime.`,
    lesson: "Gentleness, responsibility, and caring for animals",
    headline: "Unlock the full animal rescue story",
    destination: "Moonlit Zoo",
    signal: "The Keeper Lantern",
    troubleTitle: "Trouble at Moonlit Zoo",
    troubleScene: "The animal lights are flickering because Jumble Roar has mixed up every bedtime routine.",
    troubleBeing: "Jumble Roar",
    helper: "a sleepy penguin holding a tiny timetable",
    tool: "keeper lantern",
    clueOne: "inside the animal care room",
    clueTwo: "above the fruit snack station",
    clueThree: "around the climbing play rocks",
    sceneFiveTitle: "The Animal Care Room",
    sceneFive: "A bedtime clue is tucked beside the soft brushes and clean water bowls.",
    sceneSixTitle: "The Fruit Snack Station",
    sceneSix: "A calm bubble floats above sliced apples, making tiny stars shimmer.",
    sceneSevenTitle: "The Climbing Rocks",
    sceneSeven: "The final routine clue hops across safe rocks, ropes, and sleepy pawprints.",
    transformationTitle: "The First Calm Roar",
    transformationScene: "When the routines return, Jumble Roar becomes a gentle goodnight hum.",
    testQuestion: "The lantern asks: should helpers hurry, shout, or notice what each animal needs?",
    paradeScene: "Moonlit Zoo celebrates with quiet paws, tiny waves, and a bedtime lantern glow.",
    bedtimeScene: "As evening arrives, the keeper lantern shines softly above every cosy den.",
    finalTitle: "The Zoo Sleeps Safely",
    finalScene: (heroName) => `${heroName} helps Jumble Roar settle, and Moonlit Zoo drifts into a peaceful sleep.`,
  }),
  artist: modernStoryTheme({
    title: (heroName) => `${heroName} and the Colour Wish`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that art can turn big feelings into something bright and shareable.`,
    lesson: "Creativity, confidence, and expressing feelings",
    headline: "Unlock the full colour-filled story",
    destination: "Rainbow Studio",
    signal: "The Colour Wish",
    troubleTitle: "Trouble in Rainbow Studio",
    troubleScene: "Every colour has faded because Smudge Worry thinks mistakes ruin the whole picture.",
    troubleBeing: "Smudge Worry",
    helper: "a paintbrush with bristles sticking out in every direction",
    tool: "brave colour palette",
    clueOne: "inside the sketchbook corner",
    clueTwo: "above the paint-splatter snack table",
    clueThree: "around the mural wall",
    sceneFiveTitle: "The Sketchbook Corner",
    sceneFive: "A brave line is waiting on a blank page, ready to become something new.",
    sceneSixTitle: "The Paint-Splatter Snack Table",
    sceneSix: "A colour bubble floats above biscuits, making crumbs sparkle pink, blue, and gold.",
    sceneSevenTitle: "The Mural Wall",
    sceneSeven: "The final colour races across the wall, leaving a trail of stars behind.",
    transformationTitle: "The First Happy Smudge",
    transformationScene: "When the colours return, Smudge Worry learns that some mistakes become magic.",
    testQuestion: "The colour wish asks: should artists hide mistakes or turn them into ideas?",
    paradeScene: "Rainbow Studio throws a tiny gallery parade where every picture gets a proud clap.",
    bedtimeScene: "As evening arrives, the Colour Wish becomes a bright little star above the bed.",
    finalTitle: "The Picture Shines",
    finalScene: (heroName) => `${heroName} helps Smudge Worry feel brave, and Rainbow Studio glows with new ideas.`,
  }),
  firefighter: modernStoryTheme({
    title: (heroName) => `${heroName} and the Brave Bell`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} shows that helping means staying calm, checking first, and working as a team.`,
    lesson: "Calm bravery, safety, and teamwork",
    headline: "Unlock the full brave rescue story",
    destination: "Safety Street",
    signal: "The Brave Bell",
    troubleTitle: "Trouble on Safety Street",
    troubleScene: "The alarm bell is clanging because Panic Smoke has made everyone rush in different directions.",
    troubleBeing: "Panic Smoke",
    helper: "a little fire engine with a wobbly ladder",
    tool: "calm rescue checklist",
    clueOne: "inside the safety map room",
    clueTwo: "above the water bottle stand",
    clueThree: "around the practice yard",
    sceneFiveTitle: "The Safety Map Room",
    sceneFive: "A safe route clue glows on the map, showing the calmest way forward.",
    sceneSixTitle: "The Water Bottle Stand",
    sceneSix: "A cool blue bubble floats above the bottles and sparkles like raindrops.",
    sceneSevenTitle: "The Practice Yard",
    sceneSeven: "The final clue rolls around cones, hoses, and soft practice mats.",
    transformationTitle: "The First Calm Alarm",
    transformationScene: "When the plan is clear, Panic Smoke thins into a tiny puff and listens.",
    testQuestion: "The brave bell asks: should helpers rush first or check how to keep everyone safe?",
    paradeScene: "Safety Street celebrates with quiet sirens, high-fives, and careful thank-yous.",
    bedtimeScene: "As evening arrives, the Brave Bell becomes a small golden bedtime star.",
    finalTitle: "Safety Street Is Calm",
    finalScene: (heroName) => `${heroName} helps Panic Smoke settle, and Safety Street learns that calm courage saves the day.`,
  }),
  teacher: modernStoryTheme({
    title: (heroName) => `${heroName} and the Wonder Lesson`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} helps a classroom discover that every question can become a doorway.`,
    lesson: "Curiosity, patience, and helping everyone learn",
    headline: "Unlock the full classroom wonder story",
    destination: "Wonder School",
    signal: "The Golden Pencil",
    troubleTitle: "Trouble at Wonder School",
    troubleScene: "The classroom questions have hidden under the desks because Wobble Doubt thinks mistakes are embarrassing.",
    troubleBeing: "Wobble Doubt",
    helper: "a shy student holding a question card",
    tool: "wonder pencil",
    clueOne: "inside the reading corner",
    clueTwo: "above the fruit snack tray",
    clueThree: "around the playground chalk path",
    sceneFiveTitle: "The Reading Corner",
    sceneFive: "A brave question is tucked between two pages of a friendly book.",
    sceneSixTitle: "The Snack Tray",
    sceneSix: "A learning bubble floats above apple slices, making the crumbs form tiny letters.",
    sceneSevenTitle: "The Chalk Path",
    sceneSeven: "The final question hops along chalk stars, numbers, and rainbow arrows.",
    transformationTitle: "The First Brave Question",
    transformationScene: "When questions return, Wobble Doubt learns that mistakes help brains grow.",
    testQuestion: "The pencil asks: should learners know everything already or feel safe to try?",
    paradeScene: "Wonder School throws a quiet learning parade with stickers for every brave try.",
    bedtimeScene: "As evening arrives, the golden pencil becomes a bedtime star above the desk.",
    finalTitle: "The Class Learns Together",
    finalScene: (heroName) => `${heroName} helps Wobble Doubt ask for help, and Wonder School fills with brave ideas.`,
  }),
  vet: modernStoryTheme({
    title: (heroName) => `${heroName} and the Pawprint Promise`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} helps worried pets feel safe with gentle hands and calm words.`,
    lesson: "Empathy, patience, and caring for animals",
    headline: "Unlock the full pet care story",
    destination: "Pawprint Clinic",
    signal: "The Pawprint Promise",
    troubleTitle: "Trouble at Pawprint Clinic",
    troubleScene: "The waiting room is full of tiny whimpers because Worry Whiskers thinks check-ups are scary.",
    troubleBeing: "Worry Whiskers",
    helper: "a kitten tucked inside a soft blue blanket",
    tool: "gentle check-up kit",
    clueOne: "inside the cosy blanket basket",
    clueTwo: "above the treat jar",
    clueThree: "around the recovery play mat",
    sceneFiveTitle: "The Blanket Basket",
    sceneFive: "A comfort clue is tucked under the softest blanket in the basket.",
    sceneSixTitle: "The Treat Jar",
    sceneSix: "A trust bubble floats above tiny treats, making crumbs twinkle like stars.",
    sceneSevenTitle: "The Recovery Play Mat",
    sceneSeven: "The final comfort clue rolls past soft toys, pawprints, and gentle lights.",
    transformationTitle: "The First Calm Purr",
    transformationScene: "When the comfort clues return, Worry Whiskers takes one slow breath and purrs.",
    testQuestion: "The pawprint asks: should helpers rush pets or help them feel safe first?",
    paradeScene: "Pawprint Clinic celebrates with quiet tail wags and tiny thank-you cards.",
    bedtimeScene: "As evening arrives, the pawprint promise becomes a bedtime star above the window.",
    finalTitle: "Every Pet Feels Safe",
    finalScene: (heroName) => `${heroName} helps Worry Whiskers feel brave, and every pet at Pawprint Clinic feels cared for.`,
  }),
  chef: modernStoryTheme({
    title: (heroName) => `${heroName} and the Kindness Kitchen`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} discovers that the best recipes are made with sharing, patience, and care.`,
    lesson: "Sharing, patience, and creativity",
    headline: "Unlock the full kitchen adventure",
    destination: "Kindness Kitchen",
    signal: "The Golden Spoon",
    troubleTitle: "Trouble in Kindness Kitchen",
    troubleScene: "The recipe book is flapping because Mix-Up Crumbs have swapped every ingredient.",
    troubleBeing: "Mix-Up Crumbs",
    helper: "a tiny sous-chef balancing a bowl with both hands",
    tool: "sharing spoon",
    clueOne: "inside the recipe shelf",
    clueTwo: "above the fruit bowl",
    clueThree: "around the baking table",
    sceneFiveTitle: "The Recipe Shelf",
    sceneFive: "A missing ingredient clue is tucked inside a recipe for bedtime star biscuits.",
    sceneSixTitle: "The Fruit Bowl",
    sceneSix: "A flavour bubble floats above oranges, making peel curls dance.",
    sceneSevenTitle: "The Baking Table",
    sceneSeven: "The final recipe clue skates through flour, sprinkles, and rolling pins.",
    transformationTitle: "The First Shared Bite",
    transformationScene: "When the recipe returns, Mix-Up Crumbs learns that food tastes better when everyone is included.",
    testQuestion: "The spoon asks: should cooks keep the best bite or share the meal?",
    paradeScene: "Kindness Kitchen celebrates with tiny aprons, warm biscuits, and happy helpers.",
    bedtimeScene: "As evening arrives, the golden spoon becomes a cosy bedtime star.",
    finalTitle: "The Recipe Works",
    finalScene: (heroName) => `${heroName} helps Mix-Up Crumbs share, and Kindness Kitchen smells like warm magic again.`,
  }),
  "robot-builder": modernStoryTheme({
    title: (heroName) => `${heroName} and the Robot Heart`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that clever inventions work best when they help people feel understood.`,
    lesson: "Problem solving, empathy, and responsible technology",
    headline: "Unlock the full robot-building story",
    destination: "Spark Lab",
    signal: "The Robot Heart",
    troubleTitle: "Trouble in Spark Lab",
    troubleScene: "The helper robot is beeping in circles because Glitch Grumble forgot why it was built.",
    troubleBeing: "Glitch Grumble",
    helper: "a rolling toolbox with a squeaky wheel",
    tool: "kindness circuit",
    clueOne: "inside the blueprint drawer",
    clueTwo: "above the snack-charging station",
    clueThree: "around the test track",
    sceneFiveTitle: "The Blueprint Drawer",
    sceneFive: "A missing circuit clue is tucked between two blueprints marked HELP FIRST.",
    sceneSixTitle: "The Charging Snack Station",
    sceneSix: "A power bubble floats above robot-shaped crackers, making sparks dance safely.",
    sceneSevenTitle: "The Test Track",
    sceneSeven: "The final circuit clue rolls around ramps, buttons, and glowing arrows.",
    transformationTitle: "The First Helpful Beep",
    transformationScene: "When the circuit returns, Glitch Grumble remembers that clever tools should be kind tools.",
    testQuestion: "The robot heart asks: should inventions impress people or help them?",
    paradeScene: "Spark Lab celebrates with soft beeps, tiny lights, and a teamwork badge.",
    bedtimeScene: "As evening arrives, the robot heart becomes a small night-light above the desk.",
    finalTitle: "The Robot Helps Again",
    finalScene: (heroName) => `${heroName} helps Glitch Grumble find its purpose, and Spark Lab glows with kind inventions.`,
  }),
  inventor: modernStoryTheme({
    title: (heroName) => `${heroName} and the Try-Again Machine`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} discovers that the brightest ideas often begin with one brave wobble.`,
    lesson: "Resilience, creativity, and learning from mistakes",
    headline: "Unlock the full invention adventure",
    destination: "Idea Workshop",
    signal: "The Try-Again Machine",
    troubleTitle: "Trouble in Idea Workshop",
    troubleScene: "Every invention has stopped halfway because Fizzle Doubt thinks first tries must be perfect.",
    troubleBeing: "Fizzle Doubt",
    helper: "a little wind-up helper carrying spare buttons",
    tool: "try-again toolkit",
    clueOne: "inside the sketch drawer",
    clueTwo: "above the biscuit-powered battery",
    clueThree: "around the test bench",
    sceneFiveTitle: "The Sketch Drawer",
    sceneFive: "A brave idea is hiding under sketches full of crossings-out and stars.",
    sceneSixTitle: "The Biscuit Battery",
    sceneSix: "An idea bubble floats above the biscuit battery and crackles with safe golden sparks.",
    sceneSevenTitle: "The Test Bench",
    sceneSeven: "The final idea bounces around springs, wheels, and cheerful warning lights.",
    transformationTitle: "The First Brilliant Wobble",
    transformationScene: "When the ideas return, Fizzle Doubt learns that wobbling is part of inventing.",
    testQuestion: "The machine asks: should inventors stop at the first mistake or learn what it teaches?",
    paradeScene: "Idea Workshop celebrates with little machines that clap, spin, and whistle softly.",
    bedtimeScene: "As evening arrives, the Try-Again Machine becomes a quiet bedtime star.",
    finalTitle: "The Idea Works",
    finalScene: (heroName) => `${heroName} helps Fizzle Doubt try again, and Idea Workshop fills with brave new inventions.`,
  }),
  scientist: modernStoryTheme({
    title: (heroName) => `${heroName} and the Wonder Experiment`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} follows the clues and learns that good questions are a kind of magic.`,
    lesson: "Curiosity, careful thinking, and asking good questions",
    headline: "Unlock the full science adventure",
    destination: "Wonder Lab",
    signal: "The Glow Question",
    troubleTitle: "Trouble in Wonder Lab",
    troubleScene: "The experiment bubbles are floating away because Guessy Mist wants answers before questions.",
    troubleBeing: "Guessy Mist",
    helper: "a lab assistant with safety goggles too big for their face",
    tool: "question notebook",
    clueOne: "inside the observation corner",
    clueTwo: "above the safe snack table",
    clueThree: "around the bubble test zone",
    sceneFiveTitle: "The Observation Corner",
    sceneFive: "A careful clue is waiting beside the magnifying glass and a row of tiny notes.",
    sceneSixTitle: "The Safe Snack Table",
    sceneSix: "A question bubble floats above crackers, making crumbs line up like data points.",
    sceneSevenTitle: "The Bubble Test Zone",
    sceneSeven: "The final clue drifts between bubbles, measuring marks, and soft blue lights.",
    transformationTitle: "The First Careful Answer",
    transformationScene: "When the questions return, Guessy Mist slows down and discovers the answer was waiting patiently.",
    testQuestion: "The glow question asks: should scientists guess fast or look carefully?",
    paradeScene: "Wonder Lab celebrates with quiet wow sounds and a sticker for every good question.",
    bedtimeScene: "As evening arrives, the Glow Question becomes a bedtime star above the notebook.",
    finalTitle: "The Wonder Grows",
    finalScene: (heroName) => `${heroName} helps Guessy Mist ask better questions, and Wonder Lab glows with discovery.`,
  }),
  pilot: modernStoryTheme({
    title: (heroName) => `${heroName} and the Cloud Compass`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that the safest adventures begin with calm checks and a caring crew.`,
    lesson: "Preparation, calm courage, and teamwork",
    headline: "Unlock the full flying adventure",
    destination: "Cloud Harbour",
    signal: "The Cloud Compass",
    troubleTitle: "Trouble at Cloud Harbour",
    troubleScene: "The runway lights are twinkling in the wrong order because Hurry Wind wants everyone to take off too soon.",
    troubleBeing: "Hurry Wind",
    helper: "a tiny ground-crew helper waving two bright flags",
    tool: "cloud compass",
    clueOne: "inside the flight map room",
    clueTwo: "above the cocoa trolley",
    clueThree: "around the practice runway",
    sceneFiveTitle: "The Flight Map Room",
    sceneFive: "A safe route clue glows on a map of moonlit cloud paths.",
    sceneSixTitle: "The Cocoa Trolley",
    sceneSix: "A warm bubble floats above cocoa cups, making marshmallows drift like clouds.",
    sceneSevenTitle: "The Practice Runway",
    sceneSeven: "The final route clue glides past flags, lights, and soft cloud markers.",
    transformationTitle: "The First Calm Take-Off",
    transformationScene: "When the route returns, Hurry Wind slows into a gentle breeze.",
    testQuestion: "The compass asks: should pilots rush upward or check everyone is ready?",
    paradeScene: "Cloud Harbour celebrates with quiet wing waves and sparkling runway lights.",
    bedtimeScene: "As evening arrives, the Cloud Compass becomes a soft star above the window.",
    finalTitle: "The Flight Is Safe",
    finalScene: (heroName) => `${heroName} helps Hurry Wind slow down, and Cloud Harbour is ready for a safe, beautiful flight.`,
  }),
  "marine-biologist": modernStoryTheme({
    title: (heroName) => `${heroName} and the Coral Song`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} dives into a glowing reef and learns that careful noticing can protect a whole underwater world.`,
    lesson: "Curiosity, care for nature, and gentle problem solving",
    headline: "Unlock the full ocean discovery story",
    destination: "Coral Lantern Reef",
    signal: "The Coral Song",
    troubleTitle: "Trouble at Coral Lantern Reef",
    troubleScene: "The reef lights are fading because Muddle Tide has swept every sea creature's bedtime song into the wrong shell.",
    troubleBeing: "Muddle Tide",
    helper: "a tiny seahorse carrying a shell notebook",
    tool: "reef-listening scanner",
    clueOne: "inside the shell science nook",
    clueTwo: "above the kelp snack garden",
    clueThree: "around the bubble current course",
    sceneFiveTitle: "The Shell Science Nook",
    sceneFive: "A missing song note is tucked inside a shell that hums when someone listens carefully.",
    sceneSixTitle: "The Kelp Snack Garden",
    sceneSix: "A song bubble floats above the kelp, making sea-sugar shimmer.",
    sceneSevenTitle: "The Bubble Current Course",
    sceneSeven: "The final note drifts through bubble hoops, coral arches, and soft moonlit currents.",
    transformationTitle: "The First Reef Glow",
    transformationScene: "When the songs return, Muddle Tide settles into a calm wave and the reef glows again.",
    testQuestion: "The coral song asks: should explorers grab answers or observe gently first?",
    paradeScene: "Coral Lantern Reef celebrates with quiet bubbles, tiny fin waves, and glowing shells.",
    bedtimeScene: "As evening arrives, the coral song becomes a soft blue bedtime light.",
    finalTitle: "The Reef Sings Again",
    finalScene: (heroName) => `${heroName} helps Muddle Tide listen, and Coral Lantern Reef shines with every creature's song.`,
  }),
  "horse-rider": modernStoryTheme({
    title: (heroName) => `${heroName} and the Trusty Trail`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that trust is built with calm hands, kind words, and patient steps.`,
    lesson: "Trust, patience, and gentle leadership",
    headline: "Unlock the full riding adventure",
    destination: "Meadowlight Stables",
    signal: "The Silver Horseshoe",
    troubleTitle: "Trouble at Meadowlight Stables",
    troubleScene: "The trail gates are stuck because Nervous Neigh thinks every new path might be too difficult.",
    troubleBeing: "Nervous Neigh",
    helper: "a stable helper with a pocket full of apple slices",
    tool: "trusty trail ribbon",
    clueOne: "inside the tack room",
    clueTwo: "above the apple bucket",
    clueThree: "around the practice paddock",
    sceneFiveTitle: "The Tack Room",
    sceneFive: "A trust clue is tucked beside a soft brush and a neatly folded saddle blanket.",
    sceneSixTitle: "The Apple Bucket",
    sceneSix: "A confidence bubble floats above apple slices, making sweet crumbs sparkle.",
    sceneSevenTitle: "The Practice Paddock",
    sceneSeven: "The final trail clue trots around cones, rails, and soft hoofprints.",
    transformationTitle: "The First Calm Step",
    transformationScene: "When the trail clues return, Nervous Neigh takes one proud step and the gate opens.",
    testQuestion: "The horseshoe asks: should riders pull hard or guide with care?",
    paradeScene: "Meadowlight Stables celebrates with quiet hoofbeats and ribbon waves.",
    bedtimeScene: "As evening arrives, the silver horseshoe becomes a bedtime star above the stable.",
    finalTitle: "The Trail Opens",
    finalScene: (heroName) => `${heroName} helps Nervous Neigh trust the path, and Meadowlight Stables glows with gentle courage.`,
  }),
  "pet-trainer": modernStoryTheme({
    title: (heroName) => `${heroName} and the Good Listen Lesson`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} discovers that training works best with patience, praise, and understanding.`,
    lesson: "Patience, kindness, and clear communication",
    headline: "Unlock the full pet-training story",
    destination: "Happy Paws Park",
    signal: "The Golden Treat Pouch",
    troubleTitle: "Trouble at Happy Paws Park",
    troubleScene: "Every trick has turned muddled because Tumble Bark is too excited to listen.",
    troubleBeing: "Tumble Bark",
    helper: "a tiny puppy wearing a training bandana",
    tool: "kindness clicker",
    clueOne: "inside the calm corner",
    clueTwo: "above the treat station",
    clueThree: "around the agility tunnel",
    sceneFiveTitle: "The Calm Corner",
    sceneFive: "A listening clue is tucked under a soft mat where everyone can breathe slowly.",
    sceneSixTitle: "The Treat Station",
    sceneSix: "A praise bubble floats above the treats, making crumbs sparkle like little rewards.",
    sceneSevenTitle: "The Agility Tunnel",
    sceneSeven: "The final clue zooms around tunnels, hoops, and wagging practice flags.",
    transformationTitle: "The First Good Listen",
    transformationScene: "When the clues return, Tumble Bark sits proudly and waits for the next kind word.",
    testQuestion: "The treat pouch asks: should trainers shout louder or make learning feel safe?",
    paradeScene: "Happy Paws Park celebrates with tiny certificates and happy tail wags.",
    bedtimeScene: "As evening arrives, the golden treat pouch becomes a soft bedtime star.",
    finalTitle: "The Park Learns Together",
    finalScene: (heroName) => `${heroName} helps Tumble Bark listen, and Happy Paws Park learns with patience and praise.`,
  }),
  gymnast: modernStoryTheme({
    title: (heroName) => `${heroName} and the Balance Beam Wish`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that brave balance grows from practice, breath, and trying again.`,
    lesson: "Confidence, resilience, and steady practice",
    headline: "Unlock the full gymnastics story",
    destination: "Twinkle Gym",
    signal: "The Balance Beam Wish",
    troubleTitle: "Trouble at Twinkle Gym",
    troubleScene: "The practice stars are wobbling because Flippy Doubt thinks every move must be perfect.",
    troubleBeing: "Flippy Doubt",
    helper: "a teammate holding a sparkly chalk bag",
    tool: "steady-star chalk",
    clueOne: "inside the stretch mat corner",
    clueTwo: "above the water bottle bench",
    clueThree: "around the practice beam",
    sceneFiveTitle: "The Stretch Mat Corner",
    sceneFive: "A calm-breath clue is tucked beside the soft mats and warm-up cards.",
    sceneSixTitle: "The Water Bottle Bench",
    sceneSix: "A confidence bubble floats above the bottles, making droplets shine.",
    sceneSevenTitle: "The Practice Beam",
    sceneSeven: "The final balance clue tiptoes along the beam, rings, and foam blocks.",
    transformationTitle: "The First Brave Balance",
    transformationScene: "When the clues return, Flippy Doubt tries one small move and smiles.",
    testQuestion: "The beam asks: should gymnasts stop after a wobble or breathe and try again?",
    paradeScene: "Twinkle Gym celebrates with quiet claps, ribbon twirls, and proud bows.",
    bedtimeScene: "As evening arrives, the balance wish becomes a star above the window.",
    finalTitle: "The Wobble Becomes Wonder",
    finalScene: (heroName) => `${heroName} helps Flippy Doubt try again, and Twinkle Gym sparkles with steady courage.`,
  }),
  swimmer: modernStoryTheme({
    title: (heroName) => `${heroName} and the Calm Current`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} discovers that confidence in the water begins with calm, safety, and steady strokes.`,
    lesson: "Safety, confidence, and steady effort",
    headline: "Unlock the full swimming story",
    destination: "Ripple Pool",
    signal: "The Calm Current",
    troubleTitle: "Trouble at Ripple Pool",
    troubleScene: "The lane lines are wiggling because Splash Panic is making everyone hurry their strokes.",
    troubleBeing: "Splash Panic",
    helper: "a swim buddy holding a bright kickboard",
    tool: "steady stroke badge",
    clueOne: "inside the poolside safety station",
    clueTwo: "above the towel bench",
    clueThree: "around the bubble lane",
    sceneFiveTitle: "The Safety Station",
    sceneFive: "A calm rule clue is tucked beside goggles, floats, and a careful checklist.",
    sceneSixTitle: "The Towel Bench",
    sceneSix: "A breathing bubble floats above folded towels, rising and falling slowly.",
    sceneSevenTitle: "The Bubble Lane",
    sceneSeven: "The final stroke clue swims through bubbles, flags, and moonlit ripples.",
    transformationTitle: "The First Steady Stroke",
    transformationScene: "When the clues return, Splash Panic becomes a calm little ripple.",
    testQuestion: "The current asks: should swimmers rush or move safely one stroke at a time?",
    paradeScene: "Ripple Pool celebrates with gentle splashes and shiny swim badges.",
    bedtimeScene: "As evening arrives, the calm current becomes a soft blue bedtime light.",
    finalTitle: "The Pool Feels Brave",
    finalScene: (heroName) => `${heroName} helps Splash Panic slow down, and Ripple Pool glows with safe confidence.`,
  }),
  "ice-skater": modernStoryTheme({
    title: (heroName) => `${heroName} and the Snowflake Spin`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that graceful moments are made from practice, courage, and kind support.`,
    lesson: "Practice, confidence, and kindness after mistakes",
    headline: "Unlock the full ice-skating story",
    destination: "Snowlight Rink",
    signal: "The Snowflake Spin",
    troubleTitle: "Trouble at Snowlight Rink",
    troubleScene: "The rink music has gone shaky because Slip-Shiver is scared of falling.",
    troubleBeing: "Slip-Shiver",
    helper: "a rink friend with sparkly mittens",
    tool: "brave-blade ribbon",
    clueOne: "inside the warm-up corner",
    clueTwo: "above the cocoa bench",
    clueThree: "around the practice circle",
    sceneFiveTitle: "The Warm-Up Corner",
    sceneFive: "A steady clue is tucked beside scarf stretches and tiny skate marks.",
    sceneSixTitle: "The Cocoa Bench",
    sceneSix: "A courage bubble floats above cocoa cups, making marshmallows twirl.",
    sceneSevenTitle: "The Practice Circle",
    sceneSeven: "The final spin clue glides around cones, lights, and silver snowflakes.",
    transformationTitle: "The First Brave Glide",
    transformationScene: "When the clues return, Slip-Shiver glides slowly and discovers falling is part of learning.",
    testQuestion: "The snowflake asks: should skaters hide after a slip or try again with care?",
    paradeScene: "Snowlight Rink celebrates with soft music, mitten claps, and shining circles.",
    bedtimeScene: "As evening arrives, the snowflake spin becomes a bedtime star on the window.",
    finalTitle: "The Rink Glows Again",
    finalScene: (heroName) => `${heroName} helps Slip-Shiver feel brave, and Snowlight Rink shines with gentle glides.`,
  }),
  ballerina: modernStoryTheme({
    title: (heroName) => `${heroName} and the Moonlit Dance`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} discovers that the most beautiful dance helps every performer feel seen.`,
    lesson: "Confidence, expression, and sharing the spotlight",
    headline: "Unlock the full dance story",
    destination: "Moonlit Theatre",
    signal: "The Satin Star",
    troubleTitle: "Trouble at Moonlit Theatre",
    troubleScene: "The curtain will not rise because Tiptoe Worry thinks only perfect dancers deserve the stage.",
    troubleBeing: "Tiptoe Worry",
    helper: "a young dancer holding a ribbon wand",
    tool: "kindness slippers",
    clueOne: "inside the costume corner",
    clueTwo: "above the backstage snack tray",
    clueThree: "around the rehearsal marks",
    sceneFiveTitle: "The Costume Corner",
    sceneFive: "A brave step clue is tucked beside soft ribbons and moon-coloured fabric.",
    sceneSixTitle: "The Backstage Snack Tray",
    sceneSix: "A rhythm bubble floats above biscuits, making crumbs tap a tiny beat.",
    sceneSevenTitle: "The Rehearsal Marks",
    sceneSeven: "The final step clue twirls across tape marks, mirrors, and warm stage lights.",
    transformationTitle: "The First Gentle Bow",
    transformationScene: "When the steps return, Tiptoe Worry learns that dancing is about feeling, not perfection.",
    testQuestion: "The satin star asks: should performers shine alone or help the whole stage glow?",
    paradeScene: "Moonlit Theatre celebrates with ribbon waves and quiet, proud applause.",
    bedtimeScene: "As evening arrives, the satin star becomes a bedtime light above the mirror.",
    finalTitle: "The Dance Begins",
    finalScene: (heroName) => `${heroName} helps Tiptoe Worry dance bravely, and Moonlit Theatre glows with shared confidence.`,
  }),
  musician: modernStoryTheme({
    title: (heroName) => `${heroName} and the Brave Note`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that music sounds best when every voice has room to join.`,
    lesson: "Creativity, teamwork, and brave expression",
    headline: "Unlock the full music story",
    destination: "Harmony Hall",
    signal: "The Brave Note",
    troubleTitle: "Trouble at Harmony Hall",
    troubleScene: "The instruments are playing over each other because Loud Solo wants every song to belong to it.",
    troubleBeing: "Loud Solo",
    helper: "a quiet drummer tapping on their knees",
    tool: "harmony tuner",
    clueOne: "inside the music library",
    clueTwo: "above the backstage snack stand",
    clueThree: "around the rehearsal circle",
    sceneFiveTitle: "The Music Library",
    sceneFive: "A harmony clue is tucked between two pages of a songbook.",
    sceneSixTitle: "The Backstage Snack Stand",
    sceneSix: "A rhythm bubble floats above crackers, making crumbs tap in time.",
    sceneSevenTitle: "The Rehearsal Circle",
    sceneSeven: "The final note dances around music stands, cables, and soft spotlight dots.",
    transformationTitle: "The First Shared Chord",
    transformationScene: "When the notes return, Loud Solo hears how beautiful the band sounds together.",
    testQuestion: "The brave note asks: should musicians play louder or listen better?",
    paradeScene: "Harmony Hall celebrates with a gentle encore where every instrument has a turn.",
    bedtimeScene: "As evening arrives, the Brave Note becomes a tiny star humming above the bed.",
    finalTitle: "The Song Fits Together",
    finalScene: (heroName) => `${heroName} helps Loud Solo listen, and Harmony Hall fills with music everyone built together.`,
  }),
  dancer: modernStoryTheme({
    title: (heroName) => `${heroName} and the Glow-Step Groove`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} finds courage in movement and helps everyone dance in their own way.`,
    lesson: "Confidence, inclusion, and joyful self-expression",
    headline: "Unlock the full dance-floor story",
    destination: "Glow-Step Studio",
    signal: "The Groove Star",
    troubleTitle: "Trouble at Glow-Step Studio",
    troubleScene: "The dance floor has frozen because Freeze Beat thinks every move must look the same.",
    troubleBeing: "Freeze Beat",
    helper: "a shy dancer counting quietly under their breath",
    tool: "confidence speaker",
    clueOne: "inside the mirror corner",
    clueTwo: "above the smoothie table",
    clueThree: "around the practice floor",
    sceneFiveTitle: "The Mirror Corner",
    sceneFive: "A brave move clue is hiding in the mirror, waiting for someone to smile at themselves.",
    sceneSixTitle: "The Smoothie Table",
    sceneSix: "A rhythm bubble floats above smoothies, making straws tap a bright beat.",
    sceneSevenTitle: "The Practice Floor",
    sceneSeven: "The final groove clue spins between lights, arrows, and colourful floor marks.",
    transformationTitle: "The First Free Step",
    transformationScene: "When the moves return, Freeze Beat learns that different dances can still belong together.",
    testQuestion: "The groove star asks: should dancers copy perfectly or move with their own joy?",
    paradeScene: "Glow-Step Studio celebrates with a tiny dance parade where every style gets cheers.",
    bedtimeScene: "As evening arrives, the groove star becomes a soft light above the room.",
    finalTitle: "The Floor Moves Again",
    finalScene: (heroName) => `${heroName} helps Freeze Beat loosen up, and Glow-Step Studio dances with joy.`,
  }),
  photographer: modernStoryTheme({
    title: (heroName) => `${heroName} and the Memory Lens`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that the best pictures notice real feelings, not just perfect poses.`,
    lesson: "Noticing, empathy, and celebrating real moments",
    headline: "Unlock the full photography story",
    destination: "Memory Meadow",
    signal: "The Memory Lens",
    troubleTitle: "Trouble in Memory Meadow",
    troubleScene: "Every photo has turned blurry because Pose Panic thinks smiles must be perfect.",
    troubleBeing: "Pose Panic",
    helper: "a little assistant carrying a wobbly tripod",
    tool: "kindness camera",
    clueOne: "inside the photo tent",
    clueTwo: "above the picnic blanket",
    clueThree: "around the sunflower path",
    sceneFiveTitle: "The Photo Tent",
    sceneFive: "A real-smile clue is tucked beside frames, ribbons, and soft lights.",
    sceneSixTitle: "The Picnic Blanket",
    sceneSix: "A memory bubble floats above sandwiches, making crumbs sparkle in the sun.",
    sceneSevenTitle: "The Sunflower Path",
    sceneSeven: "The final focus clue skips between petals, stepping stones, and golden light.",
    transformationTitle: "The First Real Smile",
    transformationScene: "When the clues return, Pose Panic relaxes and the pictures become warm and bright.",
    testQuestion: "The lens asks: should photographers force a pose or notice the moment?",
    paradeScene: "Memory Meadow celebrates with a gallery of silly, proud, and gentle smiles.",
    bedtimeScene: "As evening arrives, the Memory Lens becomes a bedtime star above the shelf.",
    finalTitle: "The Picture Remembers",
    finalScene: (heroName) => `${heroName} helps Pose Panic relax, and Memory Meadow fills with honest, happy pictures.`,
  }),
  "fashion-designer": modernStoryTheme({
    title: (heroName) => `${heroName} and the Confidence Cape`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} discovers that style shines brightest when it helps people feel like themselves.`,
    lesson: "Confidence, creativity, and celebrating differences",
    headline: "Unlock the full fashion story",
    destination: "Starlight Studio",
    signal: "The Confidence Cape",
    troubleTitle: "Trouble at Starlight Studio",
    troubleScene: "The outfits have lost their sparkle because Samey Stitch thinks everyone should look alike.",
    troubleBeing: "Samey Stitch",
    helper: "a model clutching three different fabric swatches",
    tool: "confidence tape measure",
    clueOne: "inside the fabric wall",
    clueTwo: "above the button jar",
    clueThree: "around the runway practice path",
    sceneFiveTitle: "The Fabric Wall",
    sceneFive: "A bold colour clue is tucked between velvet, denim, and starry cotton.",
    sceneSixTitle: "The Button Jar",
    sceneSix: "A sparkle bubble floats above buttons, making them click like tiny castanets.",
    sceneSevenTitle: "The Runway Practice Path",
    sceneSeven: "The final design clue twirls between mirrors, ribbons, and bright floor lights.",
    transformationTitle: "The First True Outfit",
    transformationScene: "When the design clues return, Samey Stitch learns that different styles can all belong.",
    testQuestion: "The cape asks: should style copy everyone else or help each person shine?",
    paradeScene: "Starlight Studio celebrates with a runway where every outfit tells a happy story.",
    bedtimeScene: "As evening arrives, the Confidence Cape becomes a soft star above the wardrobe.",
    finalTitle: "The Studio Shines",
    finalScene: (heroName) => `${heroName} helps Samey Stitch celebrate differences, and Starlight Studio glows with confidence.`,
  }),
  explorer: modernStoryTheme({
    title: (heroName) => `${heroName} and the Wonder Map`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that the best explorers are brave, prepared, and kind to the places they visit.`,
    lesson: "Curiosity, preparation, and respect for nature",
    headline: "Unlock the full explorer adventure",
    destination: "Whispering Valley",
    signal: "The Wonder Map",
    troubleTitle: "Trouble in Whispering Valley",
    troubleScene: "The paths keep moving because Lost Echo wants every explorer to hurry without looking closely.",
    troubleBeing: "Lost Echo",
    helper: "a tiny guide with a compass on a ribbon",
    tool: "wonder map",
    clueOne: "inside the map cave",
    clueTwo: "above the trail snack pack",
    clueThree: "around the stepping-stone path",
    sceneFiveTitle: "The Map Cave",
    sceneFive: "A careful route clue glows on a cave wall covered in old hand-drawn paths.",
    sceneSixTitle: "The Trail Snack Pack",
    sceneSix: "A clue bubble floats above flapjacks, making crumbs point north.",
    sceneSevenTitle: "The Stepping-Stone Path",
    sceneSeven: "The final route clue hops across stones, moss, and moonlit puddles.",
    transformationTitle: "The First Found Path",
    transformationScene: "When the clues return, Lost Echo becomes a helpful voice that warns explorers to slow down.",
    testQuestion: "The map asks: should explorers rush ahead or care for the path?",
    paradeScene: "Whispering Valley celebrates with lanterns, leaf ribbons, and quiet thank-yous.",
    bedtimeScene: "As evening arrives, the Wonder Map folds into a bedtime star.",
    finalTitle: "The Path Is Found",
    finalScene: (heroName) => `${heroName} helps Lost Echo find its way, and Whispering Valley welcomes careful explorers.`,
  }),
  archaeologist: modernStoryTheme({
    title: (heroName) => `${heroName} and the Time-Tunnel Treasure`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} uncovers old stories and learns that treasures should be protected, not grabbed.`,
    lesson: "Respect, patience, and learning from history",
    headline: "Unlock the full discovery story",
    destination: "Time-Tunnel Dig",
    signal: "The Ancient Star",
    troubleTitle: "Trouble at Time-Tunnel Dig",
    troubleScene: "The ancient tiles are glowing in the wrong order because Rush Rubble wants every treasure found too fast.",
    troubleBeing: "Rush Rubble",
    helper: "a careful dig helper with a tiny brush",
    tool: "gentle discovery brush",
    clueOne: "inside the pottery tent",
    clueTwo: "above the field lunch box",
    clueThree: "around the mosaic path",
    sceneFiveTitle: "The Pottery Tent",
    sceneFive: "A history clue is tucked inside a cracked pot that must be handled gently.",
    sceneSixTitle: "The Field Lunch Box",
    sceneSix: "A memory bubble floats above sandwiches, making crumbs form old symbols.",
    sceneSevenTitle: "The Mosaic Path",
    sceneSeven: "The final clue shines between tiles, ropes, and careful little flags.",
    transformationTitle: "The First Careful Find",
    transformationScene: "When the clues return, Rush Rubble slows down and the ancient story becomes clear.",
    testQuestion: "The ancient star asks: should discoverers grab treasure or protect its story?",
    paradeScene: "Time-Tunnel Dig celebrates with soft claps and a museum card for every helper.",
    bedtimeScene: "As evening arrives, the Ancient Star becomes a bedtime light above the shelf.",
    finalTitle: "The Past Is Protected",
    finalScene: (heroName) => `${heroName} helps Rush Rubble slow down, and the Time-Tunnel treasure tells its story safely.`,
  }),
  "mountain-climber": modernStoryTheme({
    title: (heroName) => `${heroName} and the Summit Star`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that reaching the top matters less than helping everyone climb safely.`,
    lesson: "Perseverance, safety, and teamwork",
    headline: "Unlock the full mountain adventure",
    destination: "Summit Star Mountain",
    signal: "The Summit Star",
    troubleTitle: "Trouble on Summit Star Mountain",
    troubleScene: "The trail flags are spinning because Hurry Height wants everyone to climb before they are ready.",
    troubleBeing: "Hurry Height",
    helper: "a trail buddy carrying spare mittens",
    tool: "steady rope of teamwork",
    clueOne: "inside the basecamp map tent",
    clueTwo: "above the warm snack pack",
    clueThree: "around the practice rocks",
    sceneFiveTitle: "The Basecamp Map Tent",
    sceneFive: "A safe route clue glows on the map beside weather notes and warm socks.",
    sceneSixTitle: "The Warm Snack Pack",
    sceneSix: "A courage bubble floats above oat bars, making crumbs sparkle like snow.",
    sceneSevenTitle: "The Practice Rocks",
    sceneSeven: "The final route clue climbs past handholds, flags, and soft snow lights.",
    transformationTitle: "The First Steady Climb",
    transformationScene: "When the clues return, Hurry Height slows down and checks every climber is safe.",
    testQuestion: "The summit star asks: should climbers rush to the top or help the team move safely?",
    paradeScene: "Summit Star Mountain celebrates with quiet echoes and warm basecamp lights.",
    bedtimeScene: "As evening arrives, the summit star shines softly above the window.",
    finalTitle: "The Team Reaches the Top",
    finalScene: (heroName) => `${heroName} helps Hurry Height slow down, and every climber reaches the view safely.`,
  }),
  "treasure-hunter": modernStoryTheme({
    title: (heroName) => `${heroName} and the Sharing Gem`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that the best treasure helps more than one heart shine.`,
    lesson: "Fairness, generosity, and teamwork",
    headline: "Unlock the full treasure-hunting story",
    destination: "Glowstone Cove",
    signal: "The Sharing Gem",
    troubleTitle: "Trouble at Glowstone Cove",
    troubleScene: "The treasure door will not open because Mine-Mine Mist wants every sparkle for itself.",
    troubleBeing: "Mine-Mine Mist",
    helper: "a map keeper with pockets full of clue cards",
    tool: "fair-share lantern",
    clueOne: "inside the clue cave",
    clueTwo: "above the beach snack basket",
    clueThree: "around the shell stepping stones",
    sceneFiveTitle: "The Clue Cave",
    sceneFive: "A fairness clue is carved beside old handprints from treasure teams long ago.",
    sceneSixTitle: "The Beach Snack Basket",
    sceneSix: "A gem bubble floats above biscuits, making sugar crystals sparkle.",
    sceneSevenTitle: "The Shell Stepping Stones",
    sceneSeven: "The final clue hops across shells, driftwood, and moonlit sand.",
    transformationTitle: "The First Shared Sparkle",
    transformationScene: "When the clues return, Mine-Mine Mist sees that shared treasure makes the cove brighter.",
    testQuestion: "The gem asks: should treasure be hidden alone or used to help everyone?",
    paradeScene: "Glowstone Cove celebrates with lanterns, shell music, and shared sparkle badges.",
    bedtimeScene: "As evening arrives, the Sharing Gem becomes a cosy bedtime star.",
    finalTitle: "The Treasure Opens",
    finalScene: (heroName) => `${heroName} helps Mine-Mine Mist share, and Glowstone Cove shines for everyone.`,
  }),
  "police-officer": modernStoryTheme({
    title: (heroName) => `${heroName} and the Kindness Patrol`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} helps a busy town feel safe by listening, guiding, and staying calm.`,
    lesson: "Safety, fairness, and helping people calmly",
    headline: "Unlock the full kindness patrol story",
    destination: "Safe Street Square",
    signal: "The Kindness Badge",
    troubleTitle: "Trouble at Safe Street Square",
    troubleScene: "The crossing lights are blinking in a muddle because Hurry Horn wants everyone to rush.",
    troubleBeing: "Hurry Horn",
    helper: "a crossing helper with a bright little flag",
    tool: "calm patrol badge",
    clueOne: "inside the safety booth",
    clueTwo: "above the water stand",
    clueThree: "around the practice crossing",
    sceneFiveTitle: "The Safety Booth",
    sceneFive: "A calm clue is tucked beside maps, lost-and-found notes, and helpful signs.",
    sceneSixTitle: "The Water Stand",
    sceneSix: "A safety bubble floats above water cups, making droplets flash red, amber, and green.",
    sceneSevenTitle: "The Practice Crossing",
    sceneSeven: "The final clue steps across stripes, cones, and friendly waving hands.",
    transformationTitle: "The First Calm Crossing",
    transformationScene: "When the clues return, Hurry Horn becomes a gentle beep that reminds everyone to look and listen.",
    testQuestion: "The badge asks: should helpers boss people around or guide them safely?",
    paradeScene: "Safe Street Square celebrates with careful waves, thank-you cards, and soft lights.",
    bedtimeScene: "As evening arrives, the Kindness Badge becomes a little bedtime star.",
    finalTitle: "The Square Feels Safe",
    finalScene: (heroName) => `${heroName} helps Hurry Horn slow down, and Safe Street Square moves calmly again.`,
  }),
  "video-game-designer": modernStoryTheme({
    title: (heroName) => `${heroName} and the Kind Game Quest`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} builds a game where every player can learn, try again, and feel welcome.`,
    lesson: "Creativity, inclusion, and responsible screen time",
    headline: "Unlock the full game-design story",
    destination: "Pixel Playground",
    signal: "The Kind Game Quest",
    troubleTitle: "Trouble in Pixel Playground",
    troubleScene: "The game levels are too tricky because Glitch Boss thinks only experts should get to play.",
    troubleBeing: "Glitch Boss",
    helper: "a player holding a controller with star stickers",
    tool: "fair-play controller",
    clueOne: "inside the level design room",
    clueTwo: "above the power-up snack bar",
    clueThree: "around the test-play arena",
    sceneFiveTitle: "The Level Design Room",
    sceneFive: "A welcome clue is hidden beside sketches for ramps, checkpoints, and helper hints.",
    sceneSixTitle: "The Power-Up Snack Bar",
    sceneSix: "A game bubble floats above snacks, making crumbs blink like bonus coins.",
    sceneSevenTitle: "The Test-Play Arena",
    sceneSeven: "The final clue jumps across pixels, buttons, and bright checkpoint flags.",
    transformationTitle: "The First Fair Level",
    transformationScene: "When the clues return, Glitch Boss learns that good games challenge players without shutting them out.",
    testQuestion: "The quest asks: should games make people feel small or help them grow?",
    paradeScene: "Pixel Playground celebrates with tiny victory sounds and a badge for every tester.",
    bedtimeScene: "As evening arrives, the Kind Game Quest becomes a soft pixel star.",
    finalTitle: "The Game Welcomes Everyone",
    finalScene: (heroName) => `${heroName} helps Glitch Boss redesign the game, and Pixel Playground becomes fun for every player.`,
  }),
  "boat-captain": modernStoryTheme({
    title: (heroName) => `${heroName} and the Starlight Sail`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} learns that good captains steer with calm, care, and a crew-first heart.`,
    lesson: "Leadership, safety, and teamwork",
    headline: "Unlock the full sailing adventure",
    destination: "Starlight Harbour",
    signal: "The Starlight Sail",
    troubleTitle: "Trouble at Starlight Harbour",
    troubleScene: "The harbour lights are bobbing in the wrong order because Wobble Wave wants every boat to hurry out.",
    troubleBeing: "Wobble Wave",
    helper: "a small deckhand holding a coil of rope",
    tool: "crew compass",
    clueOne: "inside the chart cabin",
    clueTwo: "above the galley snack shelf",
    clueThree: "around the dock practice buoys",
    sceneFiveTitle: "The Chart Cabin",
    sceneFive: "A safe course clue glows on a chart of moonlit water.",
    sceneSixTitle: "The Galley Snack Shelf",
    sceneSix: "A sea bubble floats above crackers, making crumbs rock like tiny boats.",
    sceneSevenTitle: "The Dock Practice Buoys",
    sceneSeven: "The final course clue sails between buoys, ropes, and lantern reflections.",
    transformationTitle: "The First Calm Sail",
    transformationScene: "When the clues return, Wobble Wave settles and every boat waits for the safe signal.",
    testQuestion: "The sail asks: should captains rush ahead or check the whole crew is ready?",
    paradeScene: "Starlight Harbour celebrates with lantern boats and soft horn toots.",
    bedtimeScene: "As evening arrives, the Starlight Sail becomes a bedtime star above the window.",
    finalTitle: "The Harbour Is Ready",
    finalScene: (heroName) => `${heroName} helps Wobble Wave calm down, and Starlight Harbour sails safely together.`,
  }),
  "motorcycle-racer": modernStoryTheme({
    title: (heroName) => `${heroName} and the Safety Spark Race`,
    subtitle: (heroName, heroType) =>
      `${heroName} the ${heroType} discovers that the fastest hero is the one who rides safely and fairly.`,
    lesson: "Safety, fairness, and self-control",
    headline: "Unlock the full racing story",
    destination: "Spark Track",
    signal: "The Safety Spark",
    troubleTitle: "Trouble at Spark Track",
    troubleScene: "The track lights are flashing too fast because Zoom-Zoom Worry thinks slowing down means losing.",
    troubleBeing: "Zoom-Zoom Worry",
    helper: "a pit helper holding a bright safety helmet",
    tool: "fair-race checklist",
    clueOne: "inside the pit map station",
    clueTwo: "above the water break bench",
    clueThree: "around the practice corner",
    sceneFiveTitle: "The Pit Map Station",
    sceneFive: "A safe route clue is tucked beside track maps and careful checklists.",
    sceneSixTitle: "The Water Break Bench",
    sceneSix: "A cool bubble floats above bottles, making droplets shine like tiny lights.",
    sceneSevenTitle: "The Practice Corner",
    sceneSeven: "The final route clue rides around cones, flags, and soft glowing barriers.",
    transformationTitle: "The First Safe Lap",
    transformationScene: "When the clues return, Zoom-Zoom Worry learns that control is part of courage.",
    testQuestion: "The spark asks: should racers show off or ride safely so everyone finishes proud?",
    paradeScene: "Spark Track celebrates with careful victory laps and fair-play cheers.",
    bedtimeScene: "As evening arrives, the Safety Spark becomes a little golden bedtime star.",
    finalTitle: "The Race Feels Fair",
    finalScene: (heroName) => `${heroName} helps Zoom-Zoom Worry slow down, and Spark Track becomes safe, fast, and fair.`,
  }),
}

function createSuperheroStory(heroName: string, heroType: string): CharacterStory {
  return {
    characterId: "superhero",
    title: `${heroName} and the Sky-High Promise`,
    subtitle: `${heroName} the ${heroType} discovers that the bravest heroes make people feel safe, seen, and less alone.`,
    readingAge: "Ages 3 to 8",
    lesson: "Courage, kindness, and teamwork",
    previewPageLimit: 3,
    purchaseSummary: {
      headline: "Unlock the full superhero book",
      body: `The full adventure continues through Promise Tower, a worried little cloud, and a moonlit rescue where ${heroName} learns that the strongest heroes protect hearts as carefully as cities.`,
      includes: [
        "A complete 12-page personalised story",
        "Choice-based story path remembered from the preview",
        "Positive ending focused on confidence and kindness",
      ],
    },
    pages: {
      start: {
        id: "start",
        kicker: "Page 1",
        title: "A Promise in the Sky",
        scene: `Just before bedtime, a silver promise star flickers above the rooftops and writes ${heroName}'s name softly in the clouds.`,
        artwork: artwork("superhero", 1),
        panels: [
          `${heroName} is tucked into the cosy hush before sleep when the star trembles, bright and worried, like it is trying very hard not to cry.`,
          `Across the sleepy city, one little window glows at the top of Promise Tower like a tiny call for help that only a kind hero would notice.`,
        ],
        speech: ["Someone needs help.", "I can be brave and gentle at the same time."],
        sound: "WHOOSH!",
        choices: [
          choice("soar-now", "Fly straight to the glowing window", "tower", "brave"),
          choice("pack-kindness", "Pack a kindness kit first", "kindness-kit", "kind"),
        ],
      },
      tower: {
        id: "tower",
        kicker: "Page 2",
        title: "The Fastest Flight",
        scene: `${heroName} rises into the night, cape bright, heart thumping, and remembers that fast can still be gentle.`,
        artwork: artwork("superhero", 2),
        panels: [
          `Wind rushes past the rooftops, but ${heroName} listens for the smallest sound of worry instead of only chasing the loudest danger.`,
          `At the glowing window, a tiny cloud is stuck inside a glass jar labelled BIG FEELINGS, pressing foggy hands against the side.`,
        ],
        speech: ["Hold on. I am here.", "Big feelings are easier when we share them."],
        sound: "ZAAAP!",
        choices: [
          choice("open-jar", "Open the jar carefully", "cloud", "clever"),
          choice("ask-cloud", "Ask the cloud what it needs", "cloud", "kind"),
        ],
      },
      "kindness-kit": {
        id: "kindness-kit",
        kicker: "Page 2",
        title: "The Kindness Kit",
        scene: `${heroName} packs a soft torch, brave stickers, a tiny snack, and a note that says: You matter, even on hard days.`,
        artwork: artwork("superhero", 2),
        panels: [
          `The kit glows brighter with every caring thought ${heroName} tucks inside, until it feels like carrying a pocket full of warm stars.`,
          `A trail of silver sparks curls from the window and points the way to Promise Tower.`,
        ],
        speech: ["Helping starts with listening.", "I am ready now."],
        sound: "PING!",
        choices: [
          choice("follow-sparks", "Follow the silver spark trail", "cloud", "clever"),
          choice("share-note", "Hold up the You matter note", "cloud", "kind"),
        ],
      },
      cloud: {
        id: "cloud",
        kicker: "Page 3",
        title: "The Worried Cloud",
        scene: `The little cloud whispers that it swallowed the city's promises because it was scared everyone would forget what mattered.`,
        artwork: artwork("superhero", 3),
        panels: [
          `${heroName} does not shout or shake the jar. The cloud is not bad; it is frightened and full of feelings it could not name.`,
          `Below the tower, children look up from bedroom windows, hoping their promises will come back before morning.`,
        ],
        speech: ["I will help you fix this.", "Nobody has to feel worried alone."],
        sound: "GASP!",
        choices: [
          choice("make-plan", "Make a clever promise plan", "promise-plan", "clever"),
          choice("call-team", "Invite the children to help", "team-up", "teamwork"),
        ],
      },
      "promise-plan": {
        id: "promise-plan",
        kicker: "Page 4",
        title: "The Clever Promise Plan",
        scene: `${heroName} draws a map of every promise and matches each one to the person who made it.`,
        artwork: artwork("superhero", 4),
        panels: [
          `The cloud puffs out one promise at a time, and each promise glows like a tiny lantern with someone's hope inside.`,
          `${heroName} checks every name twice so each lantern floats back to the right window.`,
        ],
        speech: ["One small step at a time.", "Look, it is working!"],
        sound: "CLICK!",
        choices: [
          choice("steady-cloud", "Keep the cloud calm", "bridge", "kind"),
          choice("guide-lanterns", "Guide the promise lanterns", "bridge", "clever"),
        ],
      },
      "team-up": {
        id: "team-up",
        kicker: "Page 4",
        title: "The Promise Team",
        scene: `${heroName} asks every child to remember one promise and send it up with a brave smile.`,
        artwork: artwork("superhero", 4),
        panels: [
          `One child promises to try again. Another promises to share. Another promises to say sorry even when their cheeks feel hot.`,
          `The worried cloud grows lighter as the city works together, and ${heroName} sees teamwork turning fear into courage.`,
        ],
        speech: ["We can all help.", "A promise is stronger when we keep it together."],
        sound: "KAPOW!",
        choices: [
          choice("cheer-cloud", "Cheer for the cloud's courage", "bridge", "kind"),
          choice("lead-team", "Lead one final team promise", "bridge", "teamwork"),
        ],
      },
      bridge: {
        id: "bridge",
        kicker: "Page 5",
        title: "The Moonbeam Bridge",
        scene: `A bridge made from moonbeams appears between Promise Tower and the sleepy city streets.`,
        artwork: artwork("superhero", 5),
        panels: [
          `${heroName} steps onto the glowing bridge and keeps looking straight ahead with a calm, brave face, even though the moonbeams wobble underfoot.`,
          `The little cloud floats beside ${heroName}, learning that being sorry can be a strong and shining thing.`,
        ],
        speech: ["We will put every promise back.", "I can be brave while I make things right."],
        sound: "SHIMMER!",
        choices: [
          choice("cross-carefully", "Cross carefully together", "school-roof", "teamwork"),
          choice("check-map", "Check the promise map", "school-roof", "clever"),
        ],
      },
      "school-roof": {
        id: "school-roof",
        kicker: "Page 6",
        title: "The School Roof Signal",
        scene: `The first lost promise belongs above the school roof, where a child promised to try again tomorrow.`,
        artwork: artwork("superhero", 6),
        panels: [
          `${heroName} holds the promise lantern up so it can see where home is.`,
          `The lantern shines brighter when the child below whispers, "I can try again."`,
        ],
        speech: ["Trying again is brave.", "This promise knows the way home."],
        sound: "TWINK!",
        choices: [
          choice("send-lantern", "Send the lantern home", "park-rescue", "kind"),
          choice("teach-cloud", "Teach the cloud the pattern", "park-rescue", "clever"),
        ],
      },
      "park-rescue": {
        id: "park-rescue",
        kicker: "Page 7",
        title: "The Park Bench Promise",
        scene: `At the park, a promise to share has become tangled around the swings like a silver ribbon.`,
        artwork: artwork("superhero", 7),
        panels: [
          `${heroName} untangles the ribbon slowly so it does not snap.`,
          `Two friends hold the ends together and remember that taking turns can feel good.`,
        ],
        speech: ["Gentle hands fix tricky knots.", "Sharing makes more room for fun."],
        sound: "FWIP!",
        choices: [
          choice("untangle", "Untangle it gently", "river-lights", "kind"),
          choice("call-friends", "Ask the friends to help", "river-lights", "teamwork"),
        ],
      },
      "river-lights": {
        id: "river-lights",
        kicker: "Page 8",
        title: "Lanterns on the River",
        scene: `The remaining promises drift across the river, reflecting in the water like tiny stars.`,
        artwork: artwork("superhero", 8),
        panels: [
          `${heroName} counts each lantern and notices one is hiding under the bridge.`,
          `The worried cloud admits it is scared the city will still be cross.`,
        ],
        speech: ["We fix the problem, then we learn.", "I will stand with you."],
        sound: "SPLASH!",
        choices: [
          choice("find-hidden", "Find the hidden promise", "sorry-star", "clever"),
          choice("comfort-cloud", "Comfort the cloud first", "sorry-star", "kind"),
        ],
      },
      "sorry-star": {
        id: "sorry-star",
        kicker: "Page 9",
        title: "The Sorry Star",
        scene: `The hidden promise turns into a little star that says, "I promise to say sorry when I make a mistake."`,
        artwork: artwork("superhero", 9),
        panels: [
          `${heroName} gives the star to the cloud, because this promise belongs to it.`,
          `The cloud glows pale gold and practises the words in a tiny voice.`,
        ],
        speech: ["Sorry is a brave word.", "I made a mistake, and I want to help."],
        sound: "GLOW!",
        choices: [
          choice("practice-sorry", "Practise saying sorry", "city-circle", "brave"),
          choice("walk-together", "Walk back together", "city-circle", "teamwork"),
        ],
      },
      "city-circle": {
        id: "city-circle",
        kicker: "Page 10",
        title: "The City Circle",
        scene: `Everyone gathers in the square while ${heroName} and the cloud bring the promises home.`,
        artwork: artwork("superhero", 10),
        panels: [
          `The cloud says sorry in a voice as small as a raindrop, and the city listens instead of shouting.`,
          `${heroName} reminds everyone that big feelings need words, hugs, space, and time.`,
        ],
        speech: ["We can learn from this.", "A kind city helps people do better."],
        sound: "MURMUR!",
        choices: [
          choice("lead-cheer", "Lead a kind cheer", "golden-tower", "teamwork"),
          choice("thank-cloud", "Thank the cloud for trying", "golden-tower", "kind"),
        ],
      },
      "golden-tower": {
        id: "golden-tower",
        kicker: "Page 11",
        title: "Promise Tower Shines",
        scene: `Promise Tower shines brighter than ever, with one new window glowing just for ${heroName}.`,
        artwork: artwork("superhero", 11),
        panels: [
          `${heroName} stands front and centre for one gentle hero cheer, then waves the cloud forward to share it.`,
          `The little cloud becomes a soft sky helper who reminds people to talk about their feelings before they become storms.`,
        ],
        speech: ["Every promise found its home.", "And every feeling found a friend."],
        sound: "HURRAY!",
        choices: [
          choice("home-proud", "Fly home proud and peaceful", "full-ending", "brave"),
          choice("wave-goodnight", "Wave goodnight to the city", "full-ending", "kind"),
        ],
      },
      "full-ending": {
        id: "full-ending",
        kicker: "Page 12",
        title: "A Legend Keeps a Promise",
        scene: `Promise Tower shines gold, and ${heroName} learns that a true hero protects hearts, not just cities.`,
        artwork: artwork("superhero", 12),
        panels: [
          `The cloud becomes the city's gentle reminder to talk about big feelings before they grow too heavy to carry alone.`,
          `${heroName} flies home under a sky full of promises, proud in a quiet way, peaceful, and ready for sleep.`,
        ],
        speech: ["I kept my promise.", "Kindness is a superpower."],
        sound: "TA-DA!",
        choices: [choice("read-again", "Read the adventure again", "start", "teamwork")],
      },
    },
  }
}

function createBitcoinHeroStory(heroName: string, heroType: string): CharacterStory {
  return {
    characterId: "bitcoin-hero",
    title: `${heroName} and the Bitcoin Beacon`,
    subtitle: `${heroName} the ${heroType} suits up in orange and gold to show Pocket Town how Bitcoin can help people save, plan, and send value fairly.`,
    readingAge: "Ages 5 to 10",
    lesson: "Bitcoin basics, saving, patience, self-custody, fairness, and learning before spending",
    previewPageLimit: 3,
    purchaseSummary: {
      headline: "Unlock the full Bitcoin-saving adventure",
      body: `The full story follows ${heroName} through the Bitcoin Beacon, the Twenty-One Million Mountain, the Lightning Lane, and a rescue where saving, patience, and clear records help the whole town.`,
      includes: [
        "A complete Bitcoin story in child-friendly language",
        "Choices about saving, self-custody, patience, and helping others",
        "A positive ending that teaches Bitcoin as a tool, not a get-rich promise",
      ],
    },
    pages: {
      start: {
        id: "start",
        kicker: "Page 1",
        title: "The Bitcoin Beacon",
        scene: `A bright orange Bitcoin signal shines over Pocket Town, where everyone's pocket money keeps losing its saving power before their dream jars can fill up.`,
        artwork: bitcoinHeroArtwork(1),
        panels: [
          `${heroName} pulls on an orange Bitcoin hero suit with a gold ₿ badge, a saver belt, and a lightning cape.`,
          `A little wallet-bot explains that money should help people plan for tomorrow, not rush them to spend today.`,
        ],
        speech: ["Bitcoin Hero is here to help!", "First we learn, then we choose."],
        sound: "BLOOP!",
        choices: [
          choice("follow-beacon", "Follow the Bitcoin Beacon", "ledger-gate", "clever"),
          choice("help-savers", "Help the worried savers", "fair-queue", "kind"),
        ],
      },
      "ledger-gate": {
        id: "ledger-gate",
        kicker: "Page 2",
        title: "The Block Clock",
        scene: `${heroName} reaches a glowing clock where new Bitcoin blocks tick into place, one careful record at a time.`,
        artwork: bitcoinHeroArtwork(2),
        panels: [
          `Each block remembers who sent what, so nobody has to trust a secret scribble in one person's notebook.`,
          `The wallet-bot says clear records help people trade fairly across the whole world.`,
        ],
        speech: ["A good record helps everyone check.", "Fair money needs clear rules."],
        sound: "TICK!",
        choices: [
          choice("check-blocks", "Check the blocks together", "money-maze", "clever"),
          choice("teach-bot", "Teach the wallet-bot calmly", "money-maze", "kind"),
        ],
      },
      "fair-queue": {
        id: "fair-queue",
        kicker: "Page 2",
        title: "The Saving Queue",
        scene: `${heroName} asks the town to pause before spending, because saving for something important can be braver than buying the shiniest thing today.`,
        artwork: bitcoinHeroArtworkScene("bitcoin-hero-saving-queue"),
        panels: [
          `Children hold dream jars labelled bike, books, football boots, and rainy day help.`,
          `The Bitcoin Beacon opens a path toward the Block Clock, where patient choices are counted carefully.`,
        ],
        speech: ["Saving is future kindness.", "We can spend some and save some."],
        sound: "PING!",
        choices: [
          choice("make-plan", "Make a saving plan", "money-maze", "clever"),
          choice("team-budget", "Build a team budget", "money-maze", "teamwork"),
        ],
      },
      "money-maze": {
        id: "money-maze",
        kicker: "Page 3",
        title: "Twenty-One Million Mountain",
        scene: `${heroName} climbs a mountain with twenty-one million golden stepping stones, learning that Bitcoin has a fixed limit instead of endless new coins.`,
        artwork: bitcoinHeroArtwork(3),
        panels: [
          `The wallet-bot explains that scarcity means people know the rules before they save.`,
          `At the top, a sign says: Fixed supply can help savers plan, but heroes still learn carefully before using money.`,
        ],
        speech: ["Twenty-one million is the rule.", "Rules you can check build trust."],
        sound: "CLIMB!",
        choices: [
          choice("save-stones", "Protect the saving stones", "save-cave", "clever"),
          choice("share-lesson", "Share the lesson kindly", "share-square", "kind"),
        ],
      },
      "save-cave": {
        id: "save-cave",
        kicker: "Page 4",
        title: "The Cold Storage Cave",
        scene: `${heroName} finds a cosy vault cave where long-term savings rest safely away from careless clicks and rushed spending.`,
        artwork: bitcoinHeroArtwork(4),
        panels: [
          `The wallet-bot shows a pretend seed phrase card and whispers that private keys should be protected by grown-ups.`,
          `${heroName} locks the saver belt and reminds everyone that real Bitcoin needs careful custody and trusted adults.`,
        ],
        speech: ["Saving needs patience and protection.", "Secret keys stay secret."],
        sound: "CLICK!",
        choices: [
          choice("guard-keys", "Guard the pretend keys", "price-bridge", "clever"),
          choice("ask-grownup", "Ask a trusted grown-up", "price-bridge", "kind"),
        ],
      },
      "share-square": {
        id: "share-square",
        kicker: "Page 4",
        title: "The Borderless Square",
        scene: `${heroName} reaches a busy square where families want to send value across town and across oceans without waiting days for help to arrive.`,
        artwork: bitcoinHeroArtworkScene("bitcoin-hero-borderless-square"),
        panels: [
          `A grandparent sends a tiny orange spark to a family stall far away, and the stall lights up with thanks.`,
          `${heroName} explains that Bitcoin can move value on a global network, but people still need care, safety, and good judgement.`,
        ],
        speech: ["Helping should travel far.", "Fast does not mean careless."],
        sound: "ZOOM!",
        choices: [
          choice("check-address", "Check the wallet address", "price-bridge", "clever"),
          choice("help-family", "Help the family send safely", "price-bridge", "teamwork"),
        ],
      },
      "price-bridge": {
        id: "price-bridge",
        kicker: "Page 5",
        title: "The Price Wave Bridge",
        scene: `A bridge of orange price waves rises and falls, showing that Bitcoin's price can move up and down even when the saving lesson stays important.`,
        artwork: bitcoinHeroArtwork(5),
        panels: [
          `${heroName} plants both boots, holds the Bitcoin shield steady, and tells the town not to panic over every wiggle.`,
          `The wallet-bot says heroes never promise riches; they learn risks, save carefully, and only use what they understand.`,
        ],
        speech: ["Up and down is not a plan.", "Learning comes before buying."],
        sound: "SWOOSH!",
        choices: [
          choice("teach-risk", "Teach the risk lesson", "honest-market", "kind"),
          choice("draw-chart", "Draw a calm chart", "honest-market", "clever"),
        ],
      },
      "honest-market": {
        id: "honest-market",
        kicker: "Page 6",
        title: "The Open Market",
        scene: `The market glows when everyone can see the rules, compare choices, and decide whether saving, spending, or waiting is best.`,
        artwork: bitcoinHeroArtwork(6),
        panels: [
          `Nobody has to follow a shouty crowd, because the Bitcoin Hero teaches calm research and clear thinking.`,
          `${heroName} puts up a sign: Bitcoin is a tool for freedom and saving, not a shortcut around learning.`,
        ],
        speech: ["Check. Think. Ask. Then choose.", "Good tools need wise users."],
        sound: "DING!",
        choices: [
          choice("protect-sign", "Protect the learning sign", "spendy-glitch", "brave"),
          choice("teach-town", "Teach the whole town", "spendy-glitch", "teamwork"),
        ],
      },
      "spendy-glitch": {
        id: "spendy-glitch",
        kicker: "Page 7",
        title: "The Spendy Glitch",
        scene: `A flashing Spendy Glitch pops up on every screen shouting, Buy now! Hurry! Never wait!`,
        artwork: bitcoinHeroArtwork(7),
        panels: [
          `${heroName} raises the Bitcoin shield and blocks the noisy messages before they empty the children's dream jars.`,
          `The wallet-bot whispers that saving means saying no to some things so a bigger yes can happen later.`,
        ],
        speech: ["My savings have a job.", "Not every shiny thing is worth it."],
        sound: "BZZT!",
        choices: [
          choice("say-wait", "Say wait out loud", "patience-clock", "brave"),
          choice("make-budget", "Make a simple budget", "patience-clock", "clever"),
        ],
      },
      "patience-clock": {
        id: "patience-clock",
        kicker: "Page 8",
        title: "The HODL Clock",
        scene: `A giant HODL clock ticks slowly, teaching that patient saving can be powerful when families have a plan and understand the risks.`,
        artwork: bitcoinHeroArtwork(8),
        panels: [
          `${heroName} waits through three careful ticks before deciding whether to save, spend, or ask for advice.`,
          `With each tick, the Spendy Glitch gets smaller and the dream jars glow brighter.`,
        ],
        speech: ["Pause. Think. Choose.", "Patience can protect dreams."],
        sound: "TOCK!",
        choices: [
          choice("wait-three", "Wait three careful ticks", "helping-bank", "clever"),
          choice("invite-town", "Invite everyone to wait too", "helping-bank", "teamwork"),
        ],
      },
      "helping-bank": {
        id: "helping-bank",
        kicker: "Page 9",
        title: "The Lightning Lane",
        scene: `A bright Lightning Lane appears for tiny payments, showing how small amounts can move quickly when the right tools are used carefully.`,
        artwork: bitcoinHeroArtwork(9),
        panels: [
          `The baker receives a tiny payment for a roll, and the book seller sends a thank-you spark back.`,
          `${heroName} explains that base blocks are steady and Lightning can help with small, quick payments.`,
        ],
        speech: ["Small payments can move fast.", "Use the right tool for the job."],
        sound: "ZAP!",
        choices: [
          choice("test-small", "Test a tiny payment", "last-block", "clever"),
          choice("help-neighbour", "Help a neighbour safely", "last-block", "kind"),
        ],
      },
      "last-block": {
        id: "last-block",
        kicker: "Page 10",
        title: "The Final Block",
        scene: `The Block Clock needs one final block: a promise that Bitcoin knowledge should help people, not confuse or pressure them.`,
        artwork: bitcoinHeroArtwork(10),
        panels: [
          `${heroName} holds the final block with both hands while the orange suit shines like sunrise.`,
          `Everyone repeats the promise: learn first, save carefully, protect keys, and help others understand.`,
        ],
        speech: ["Knowledge is part of safety.", "Bitcoin works best with wisdom."],
        sound: "LOCK!",
        choices: [
          choice("place-block", "Place the final block", "town-plan", "brave"),
          choice("ask-everyone", "Ask everyone to promise", "town-plan", "teamwork"),
        ],
      },
      "town-plan": {
        id: "town-plan",
        kicker: "Page 11",
        title: "Pocket Town's Bitcoin Plan",
        scene: `Pocket Town builds a simple plan: earn honestly, save patiently, spend thoughtfully, share kindly, and keep learning.`,
        artwork: bitcoinHeroArtwork(11),
        panels: [
          `Dream jars fill slowly but proudly, and families talk together before making money choices.`,
          `${heroName} smiles as the wallet-bot prints a tiny orange certificate that says Bitcoin Learner.`,
        ],
        speech: ["Save for tomorrow.", "Help people today."],
        sound: "PRINT!",
        choices: [
          choice("accept-badge", "Accept the Bitcoin Learner badge", "full-ending", "brave"),
          choice("share-badge", "Share the badge with the town", "full-ending", "kind"),
        ],
      },
      "full-ending": {
        id: "full-ending",
        kicker: "Page 12",
        title: "Bitcoin Hero Saves the Day",
        scene: `${heroName} lights the Bitcoin Beacon, and Pocket Town learns that Bitcoin can help people save, send, and plan when they use it carefully and kindly.`,
        artwork: bitcoinHeroArtwork(12),
        panels: [
          `The children cheer for their dream jars, the market feels fairer, and help can travel farther than before.`,
          `The wallet-bot's confidence light glows bright orange as ${heroName}'s cape flashes like lightning.`,
        ],
        speech: ["Bitcoin is a tool, not a boss.", "Bitcoin Hero, here to save the world!"],
        sound: "TA-DA!",
        choices: [choice("read-again", "Read the adventure again", "start", "brave")],
      },
    },
  }
}

function createFootballerStory(heroName: string, heroType: string): CharacterStory {
  return {
    characterId: "footballer",
    title: `${heroName} and the Friendship Final`,
    subtitle: `${heroName} the ${heroType} plays the biggest match of the season and learns that great players help every teammate feel brave.`,
    readingAge: "Ages 3 to 9",
    lesson: "Teamwork, confidence, resilience, and fair play",
    previewPageLimit: 3,
    purchaseSummary: {
      headline: "Unlock the full football final",
      body: `The full match continues through bright floodlights, a missed chance, a half-time wobble, and a last-minute choice where ${heroName} helps the whole team believe again.`,
      includes: [
        "A complete football story with match tension and teamwork",
        "Choices after every page that shape the style of play",
        "A positive ending about confidence, practice, and fair play",
      ],
    },
    pages: {
      start: {
        id: "start",
        kicker: "Page 1",
        title: "Kick-Off at Wonder Stadium",
        scene: `Wonder Stadium is packed for the Friendship Final, and ${heroName}'s team needs one more brave player who can keep a kind head under bright lights.`,
        artwork: {
          boy: "/stories/footballer/footballer-boy-page-1.png",
          girl: "/stories/footballer/footballer-girl-page-1.png",
        },
        panels: [
          `${heroName} steps onto the grass, feels a flutter in their tummy, and hears the crowd clap like rolling thunder under the floodlights.`,
          `Across the pitch, the Grumble Goalie guards the net with a very serious frown, but ${heroName} remembers that courage can start with one steady breath.`,
        ],
        speech: ["I feel nervous, but I am ready.", "Teams are strongest together."],
        sound: "PEEP!",
        choices: [
          choice("fast-run", "Make a fast run down the wing", "first-chance", "brave"),
          choice("team-pass", "Pass early to a teammate", "first-chance", "teamwork"),
        ],
      },
      "first-chance": {
        id: "first-chance",
        kicker: "Page 2",
        title: "The First Big Chance",
        scene: `${heroName} reaches the penalty box just as the ball bounces high into the air and the whole stadium seems to hold its breath.`,
        artwork: {
          boy: "/stories/footballer/footballer-boy-page-2.png",
          girl: "/stories/footballer/footballer-girl-page-2.png",
        },
        panels: [
          `The shot looks possible, but a teammate is standing in an even better spot with hopeful eyes and muddy socks.`,
          `The Grumble Goalie shouts, trying to make everyone rush, so ${heroName} lets the noise pass by like wind.`,
        ],
        speech: ["Think before you kick.", "A smart pass can be powerful too."],
        sound: "THUMP!",
        choices: [
          choice("take-shot", "Take the brave shot", "half-time", "brave"),
          choice("make-pass", "Make the clever pass", "half-time", "teamwork"),
        ],
      },
      "half-time": {
        id: "half-time",
        kicker: "Page 3",
        title: "The Half-Time Wobble",
        scene: `The score is still level, and one teammate feels sad after missing the ball in front of everyone.`,
        artwork: {
          boy: "/stories/footballer/footballer-boy-page-3.png",
          girl: "/stories/footballer/footballer-girl-page-3.png",
        },
        panels: [
          `${heroName} remembers that a match is not over after one mistake, and neither is a brave heart.`,
          `The coach points to the team badge and asks everyone what kind of team they want to be when things feel hard.`,
        ],
        speech: ["Mistakes are part of learning.", "We can try again together."],
        sound: "HUFF!",
        choices: [
          choice("encourage", "Encourage the teammate", "second-half", "kind"),
          choice("new-plan", "Create a new team plan", "second-half", "clever"),
        ],
      },
      "second-half": {
        id: "second-half",
        kicker: "Page 4",
        title: "Back on the Pitch",
        scene: `${heroName} jogs back out with muddy boots, bright eyes, and a plan to help every teammate feel ready.`,
        artwork: footballerArtwork(4),
        panels: [
          `The other team presses high, but ${heroName} stays calm and looks up before touching the ball.`,
          `A teammate points into space and trusts ${heroName} to notice, which makes the pitch feel wider and friendlier.`,
        ],
        speech: ["Look up. Breathe. Play together.", "I see the run!"],
        sound: "PEEP!",
        choices: [
          choice("through-ball", "Play the through ball", "slippery-save", "clever"),
          choice("shield-ball", "Shield the ball bravely", "slippery-save", "brave"),
        ],
      },
      "slippery-save": {
        id: "slippery-save",
        kicker: "Page 5",
        title: "The Slippery Save",
        scene: `Rain starts to sparkle under the floodlights, and the ball skids faster than anyone expects.`,
        artwork: footballerArtwork(5),
        panels: [
          `${heroName} adjusts their feet, slides carefully, and keeps the ball in play without crashing into anyone.`,
          `The crowd gasps as the Grumble Goalie finally looks worried, and ${heroName}'s team starts to believe again.`,
        ],
        speech: ["I can adjust.", "Slippery grass needs steady feet."],
        sound: "SKID!",
        choices: [
          choice("steady-pass", "Make a steady pass", "captain-chat", "teamwork"),
          choice("quick-turn", "Try a quick turn", "captain-chat", "brave"),
        ],
      },
      "captain-chat": {
        id: "captain-chat",
        kicker: "Page 6",
        title: "The Captain Chat",
        scene: `The captain calls the team into a tiny circle and asks ${heroName} what they have noticed.`,
        artwork: footballerArtwork(6),
        panels: [
          `${heroName} explains that the Goalie jumps early whenever someone looks at the top corner.`,
          `The team listens, nods, and starts smiling because a new idea is forming, and every player has a part to play.`,
        ],
        speech: ["We can pass around the pressure.", "Everyone gets a touch."],
        sound: "HUDDLE!",
        choices: [
          choice("share-plan", "Share the passing plan", "corner-kick", "teamwork"),
          choice("spot-pattern", "Explain the goalie pattern", "corner-kick", "clever"),
        ],
      },
      "corner-kick": {
        id: "corner-kick",
        kicker: "Page 7",
        title: "The Corner Kick",
        scene: `A corner kick starts beside the flag and curls toward the box like a comet, with ${heroName} ready for the next brave touch.`,
        artwork: footballerArtwork(7),
        panels: [
          `${heroName} could shoot, but two teammates are ready for the clever routine they practised when nobody was watching.`,
          `The Grumble Goalie waves big gloves and tries to distract everyone, but the team keeps its eyes on each other.`,
        ],
        speech: ["Trust the routine.", "We practised this together."],
        sound: "WHIP!",
        choices: [
          choice("near-post", "Run to the near post", "nearly-there", "brave"),
          choice("dummy-run", "Make a dummy run", "nearly-there", "clever"),
        ],
      },
      "nearly-there": {
        id: "nearly-there",
        kicker: "Page 8",
        title: "Nearly There",
        scene: `The ball bounces off the post and rolls across the goal line, but it does not go in.`,
        artwork: footballerArtwork(8),
        panels: [
          `A teammate drops their shoulders, sure they have spoiled the chance.`,
          `${heroName} claps immediately, because nearly scoring means the plan is working and nobody should feel alone after a miss.`,
        ],
        speech: ["That was so close!", "Keep going. The next one can work."],
        sound: "BONK!",
        choices: [
          choice("clap-team", "Clap for the team", "last-minute", "kind"),
          choice("reset-fast", "Reset quickly", "last-minute", "brave"),
        ],
      },
      "last-minute": {
        id: "last-minute",
        kicker: "Page 9",
        title: "The Last Minute",
        scene: `The scoreboard blinks: one minute left. The Friendship Final needs one calm, kind, clever choice.`,
        artwork: footballerArtwork(9),
        panels: [
          `${heroName} receives the ball in the centre with defenders rushing in from both sides and the clock blinking fast.`,
          `The crowd gets loud, but ${heroName} hears the teammate calling softly on the wing, a small voice inside a big moment.`,
        ],
        speech: ["I do not have to do this alone.", "One more pass."],
        sound: "TICK!",
        choices: [
          choice("wing-pass", "Pass to the wing", "everyone-touches", "teamwork"),
          choice("hold-ball", "Hold the ball until help arrives", "everyone-touches", "brave"),
        ],
      },
      "everyone-touches": {
        id: "everyone-touches",
        kicker: "Page 10",
        title: "Everyone Touches the Ball",
        scene: `The ball moves from player to player, faster and happier than the other team can follow, like the team is sharing one big heartbeat.`,
        artwork: footballerArtwork(10),
        panels: [
          `The youngest teammate taps it forward and beams when ${heroName} cheers their name.`,
          `The Grumble Goalie spins around, unsure where the final shot will come from, because kindness has made the whole team brave.`,
        ],
        speech: ["Great touch!", "This is our goal, all of us."],
        sound: "TAP-TAP!",
        choices: [
          choice("final-pass", "Make the final pass", "goal-moment", "teamwork"),
          choice("final-shot", "Take the final shot", "goal-moment", "brave"),
        ],
      },
      "goal-moment": {
        id: "goal-moment",
        kicker: "Page 11",
        title: "The Goal Moment",
        scene: `${heroName} makes the final choice, and the ball rolls exactly where the team hoped it would go.`,
        artwork: footballerArtwork(11),
        panels: [
          `The net ripples, the whistle blows, and Wonder Stadium bursts into happy noise.`,
          `${heroName} turns straight to the team before celebrating, because every player helped build the moment with trust.`,
        ],
        speech: ["We did it!", "Come on, team!"],
        sound: "GOOOAL!",
        choices: [
          choice("handshake", "Offer a handshake", "full-ending", "kind"),
          choice("team-photo", "Gather for a team photo", "full-ending", "teamwork"),
        ],
      },
      "full-ending": {
        id: "full-ending",
        kicker: "Page 12",
        title: "The Goal Everyone Built",
        scene: `${heroName} leads one final team move, and every player touches the ball before it rolls into the net like a shared promise.`,
        artwork: footballerArtwork(12),
        panels: [
          `Even the Grumble Goalie smiles when ${heroName} offers a handshake and says, "Good game."`,
          `The trophy shines for the whole team, not just one player, and that makes it feel even brighter on the way home.`,
        ],
        speech: ["We won by playing together.", "Fair play feels brilliant."],
        sound: "CHEER!",
        choices: [choice("read-again", "Read the adventure again", "start", "brave")],
      },
    },
  }
}

function createDinosaurExpertStory(heroName: string, heroType: string): CharacterStory {
  return {
    characterId: "dinosaur-expert",
    title: `${heroName} and the Dino Egg Rescue`,
    subtitle: `${heroName} the ${heroType} follows fossil clues and learns that big discoveries need gentle hands and patient eyes.`,
    readingAge: "Ages 3 to 8",
    lesson: "Curiosity, patience, and caring for nature",
    previewPageLimit: 3,
    purchaseSummary: {
      headline: "Unlock the full dinosaur rescue",
      body: `The full story follows ${heroName} through Fossil Valley, a missing egg, careful clues, and a gentle rescue where tiny dinosaurs stay safe.`,
      includes: [
        "A complete dinosaur rescue story with fossil clues",
        "Choices about patience, kindness, and careful exploring",
        "A warm ending about protecting nature and staying gentle",
      ],
    },
    pages: {
      start: {
        id: "start",
        kicker: "Page 1",
        title: "The Fossil Calls",
        scene: `A golden fossil glows beside ${heroName}'s bed and points a trail of tiny footprints toward Fossil Valley.`,
        artwork: dinosaurExpertArtwork(1),
        panels: [
          `${heroName} finds the fossil warm with magic, as tiny footprints appear one by one across the floor.`,
          `The footprints lead to fern trees, sunset rocks, and a worried chirp that echoes through Fossil Valley.`,
        ],
        speech: ["Those footprints are a clue.", "I'll be careful."],
        sound: "CHIRP!",
        choices: [
          choice("follow-footprints", "Follow the glowing footprints", "fountain", "clever"),
          choice("pack-fossil-kit", "Pack the fossil finder kit", "fountain", "brave"),
        ],
      },
      fountain: {
        id: "fountain",
        kicker: "Page 2",
        title: "The Egg That Rolled Away",
        scene: `A baby dinosaur nest sits under the fern trees, but one speckled egg is missing from the soft moss.`,
        artwork: dinosaurExpertArtwork(2),
        panels: [
          `The tiny triceratops sniffs the empty nest with muddy knees and worried eyes.`,
          `${heroName} spots Rumble Hill shaking in the distance and knows the valley needs calm feet, quiet eyes, and a careful plan.`,
        ],
        speech: ["No rushing near an egg.", "We follow the clues gently."],
        sound: "RUMBLE!",
        choices: [
          choice("calm-triceratops", "Calm the tiny triceratops", "cloud-story", "kind"),
          choice("study-the-nest", "Study the nest for clues", "cloud-story", "clever"),
        ],
      },
      "cloud-story": {
        id: "cloud-story",
        kicker: "Page 3",
        title: "Rumble Hill Did Not Mean To Shake",
        scene: `Rumble Hill explains that everyone stomped past too quickly, and all the noise made the stones jump with worry.`,
        artwork: dinosaurExpertArtwork(3),
        panels: [
          `The hill is not naughty; it is frightened by loud rushing feet and too many excited explorers.`,
          `${heroName} pats the tiny triceratops on its muddy back and shows everyone how to step softly like falling leaves.`,
        ],
        speech: ["The hill was worried.", "Soft steps, everyone."],
        sound: "THUD-SHH!",
        choices: [
          choice("soft-step-plan", "Teach everyone soft steps", "map-maker", "kind"),
          choice("open-finder-map", "Open the fossil finder map", "map-maker", "clever"),
        ],
      },
      "map-maker": {
        id: "map-maker",
        kicker: "Page 4",
        title: "The Fossil Finder Map",
        scene: `The fossil finder glows whenever ${heroName} looks closely instead of quickly, tracing careful circles in the warm dust.`,
        artwork: dinosaurExpertArtwork(4),
        panels: [
          `A footprint, a fern crumb, and a tiny shell mark a trail from the nest toward the safest hollow in the valley.`,
          `${heroName} marks each clue gently, turning a muddle of worry into a rescue plan everyone can follow.`,
        ],
        speech: ["Slow looking finds more.", "The egg left a gentle trail."],
        sound: "BEEP!",
        choices: [
          choice("visit-cave", "Search the fossil cave", "library-laugh", "clever"),
          choice("bring-helper", "Bring the tiny triceratops", "library-laugh", "teamwork"),
        ],
      },
      "library-laugh": {
        id: "library-laugh",
        kicker: "Page 5",
        title: "The Footprint In Stone",
        scene: `Inside the fossil record cave, ${heroName} finds a tiny footprint pressed into soft stone beside an ancient fern shape.`,
        artwork: dinosaurExpertArtwork(5),
        panels: [
          `${heroName} kneels beside the footprint and keeps the fossil finder still so the delicate clue does not crumble.`,
          `The tiny triceratops wants to rush ahead, but ${heroName} shows how careful eyes can protect important discoveries.`,
        ],
        speech: ["Look closely.", "This clue is fragile."],
        sound: "TAP!",
        choices: [
          choice("trace-footprint", "Trace the footprint gently", "bakery-bubble", "clever"),
          choice("comfort-helper", "Comfort the tiny helper", "bakery-bubble", "kind"),
        ],
      },
      "bakery-bubble": {
        id: "bakery-bubble",
        kicker: "Page 6",
        title: "The Leaf Snack Clue",
        scene: `Near the leaf snack pile, fern crumbs dance in a little bubble beside two tiny tooth marks.`,
        artwork: dinosaurExpertArtwork(6),
        panels: [
          `${heroName} notices the egg did not roll alone; a baby dinosaur must have tried to follow and got worried too.`,
          `The fossil finder hums softly, showing that the rescue is about helping the egg and the little dinosaur.`,
        ],
        speech: ["The baby was scared.", "We help the egg and the little one."],
        sound: "CRUNCH!",
        choices: [
          choice("follow-crumbs", "Follow the fern crumbs", "playground-chase", "clever"),
          choice("leave-snacks", "Leave a calming leaf snack", "playground-chase", "kind"),
        ],
      },
      "playground-chase": {
        id: "playground-chase",
        kicker: "Page 7",
        title: "The Mud Slide Clue",
        scene: `The last footprint is half-hidden beside a mud slide, where the egg must have rolled without cracking its spotted shell.`,
        artwork: dinosaurExpertArtwork(7),
        panels: [
          `${heroName} asks the bigger dinosaurs to wait back so heavy feet do not shake the muddy slope again.`,
          `Together, ${heroName} and the tiny triceratops build a soft fern path toward the warm hollow.`,
        ],
        speech: ["Give the egg space.", "Fern path first."],
        sound: "SQUELCH!",
        choices: [
          choice("build-fern-path", "Build the soft fern path", "cloud-smile", "teamwork"),
          choice("check-the-slope", "Check the muddy slope", "cloud-smile", "clever"),
        ],
      },
      "cloud-smile": {
        id: "cloud-smile",
        kicker: "Page 8",
        title: "Rumble Hill Settles",
        scene: `${heroName} follows the fern path to a warm hollow where the egg rests safely in a patch of moss.`,
        artwork: dinosaurExpertArtwork(8),
        panels: [
          `Rumble Hill takes one slow breath, then another, until the stones stop jumping and the valley grows peaceful.`,
          `The tiny triceratops chirps with relief when the speckled egg gives the smallest sleepy wiggle.`,
        ],
        speech: ["Slow breaths, big hill.", "The egg is safe."],
        sound: "RUMMM...",
        choices: [
          choice("thank-hill", "Thank Rumble Hill", "comet-test", "kind"),
          choice("check-egg", "Check the egg carefully", "comet-test", "clever"),
        ],
      },
      "comet-test": {
        id: "comet-test",
        kicker: "Page 9",
        title: "The Fossil's Question",
        scene: `The golden fossil glows and asks ${heroName} what explorers should do when a discovery feels exciting and important.`,
        artwork: dinosaurExpertArtwork(9),
        panels: [
          `${heroName} thinks of the fragile footprint, the worried baby dinosaur, and the egg that needed gentle hands.`,
          `The answer feels clear: real experts protect what they find before they show it proudly.`,
        ],
        speech: ["Protect it first.", "Discovery needs care."],
        sound: "HMMM!",
        choices: [
          choice("answer-care", "Answer with gentle care", "town-parade", "kind"),
          choice("answer-expert", "Answer like an expert explorer", "town-parade", "clever"),
        ],
      },
      "town-parade": {
        id: "town-parade",
        kicker: "Page 10",
        title: "The Stomp-Soft Parade",
        scene: `Fossil Valley celebrates with a stomp-soft parade, where every dinosaur lifts its feet carefully so the egg can rest.`,
        artwork: dinosaurExpertArtwork(10),
        panels: [
          `${heroName} leads from the front, showing that being an expert means noticing small things and keeping them safe.`,
          `Even the biggest dinosaurs practise soft steps, proud to help the smallest nest in the valley.`,
        ],
        speech: ["Soft steps, everyone.", "Tiny things matter."],
        sound: "STOMP-SOFT!",
        choices: [
          choice("share-credit", "Share the rescue credit", "bedtime-star", "teamwork"),
          choice("thank-everyone", "Thank every careful helper", "bedtime-star", "kind"),
        ],
      },
      "bedtime-star": {
        id: "bedtime-star",
        kicker: "Page 11",
        title: "The Fossil Night-Light",
        scene: `As evening settles over the fern trees, the golden fossil sends one warm glow back home with ${heroName}.`,
        artwork: dinosaurExpertArtwork(11),
        panels: [
          `Beside the bed, the fossil shines like a tiny nest light, full of careful thinking and brave kindness.`,
          `${heroName} remembers every footprint and every soft step, proud in the quiet way that comes after helping.`,
        ],
        speech: ["Goodnight, Fossil Valley.", "I used gentle hands."],
        sound: "TWINKLE!",
        choices: [
          choice("make-wish", "Make one careful wish", "full-ending", "kind"),
          choice("wave-goodnight", "Wave goodnight to the valley", "full-ending", "brave"),
        ],
      },
      "full-ending": {
        id: "full-ending",
        kicker: "Page 12",
        title: "The Dino Egg Comes Home",
        scene: `${heroName} carries the egg the last little way on a bed of ferns, while Rumble Hill keeps perfectly still.`,
        artwork: dinosaurExpertArtwork(12),
        panels: [
          `When the egg nest glows again, Fossil Valley cheers in whisper-soft roars so the smallest dinosaur can sleep.`,
          `${heroName} learns that big discoveries feel best when they are protected with patience, kindness, and care.`,
        ],
        speech: ["Home safe.", "Big discoveries need gentle hands."],
        sound: "SOFT ROAR!",
        choices: [choice("read-again", "Read the adventure again", "start", "kind")],
      },
    },
  }
}

function createStarterStory(characterId: string, heroName: string, heroType: string): CharacterStory {
  const theme = starterStoryThemes[characterId]?.(heroName, heroType)

  return {
    characterId,
    title: theme?.title || `${heroName} and the Kindness Comet`,
    subtitle:
      theme?.subtitle ||
      `${heroName} the ${heroType} follows a glowing comet and discovers that every adventure is better with courage and care.`,
    readingAge: "Ages 3 to 8",
    lesson: theme?.lesson || "Confidence, kindness, and problem solving",
    previewPageLimit: 3,
    purchaseSummary: {
      headline: theme?.headline || `Unlock the full ${heroType} adventure`,
      body:
        theme?.body ||
        `The full version continues with more choices, bigger story moments, and a positive ending built around ${heroName}'s decisions.`,
      includes: [
        "A complete 12-page personalised story for this character",
        "Choice-based scenes after every page",
        "A warm lesson parents can feel good about",
      ],
    },
    pages: applyStarterPageCopy({
      start: {
        id: "start",
        kicker: "Page 1",
        title: theme?.callTitle || "The Comet Calls",
        scene: theme?.callScene || `A rainbow comet zooms over Story City and twinkles directly above ${heroName}.`,
        artwork: artwork(characterId, 1),
        panels: [
          `${heroName} notices the first sparkle is trembling, as if the adventure has been waiting for exactly the right helper.`,
          `The trail glows toward ${theme?.destination || "Giggle Fountain"}, bright enough to make the room feel like bedtime magic.`,
        ],
        speech: ["I can help.", "Brave can be gentle too."],
        sound: "KRA-KOOM!",
        choices: [
          choice("go-boldly", "Follow the comet bravely", "fountain", "brave"),
          choice("bring-kit", "Bring the kindness kit", "fountain", "kind"),
        ],
      },
      fountain: {
        id: "fountain",
        kicker: "Page 2",
        title: theme?.troubleTitle || "Trouble at Giggle Fountain",
        scene: theme?.troubleScene || `The fountain has stopped giggling because a Grumble Cloud swallowed every laugh in town.`,
        artwork: artwork(characterId, 2),
        panels: [
          `Nobody is hurt, but the quiet feels heavy, like everyone is holding their breath.`,
          `${heroName} notices the ${theme?.troubleBeing || "Grumble Cloud"} looks lonely, not mean, and decides to listen before acting.`,
        ],
        speech: ["Let's listen first.", "Big problems can have gentle answers."],
        sound: "GASP!",
        choices: [
          choice("ask-cloud", "Ask the cloud what happened", "cloud-story", "kind"),
          choice("make-plan", "Make a clever rescue plan", "cloud-story", "clever"),
        ],
      },
      "cloud-story": {
        id: "cloud-story",
        kicker: "Page 3",
        title: `The ${theme?.troubleBeing || "Cloud"}'s Story`,
        scene: `The ${theme?.troubleBeing || "Grumble Cloud"} explains that the trouble started because it felt worried and left out.`,
        artwork: artwork(characterId, 3),
        panels: [
          `${heroName} listens without rushing, which makes the big problem feel smaller and safer to solve.`,
          `${theme?.helper || "A small helper"} edges closer, trusting ${heroName} because the answer feels kind.`,
        ],
        speech: ["Everyone wants to belong.", "We can mend this together."],
        sound: "SNIFF!",
        choices: [
          choice("invite-cloud", "Invite the cloud to help", "map-maker", "kind"),
          choice("draw-map", "Draw a laugh-finding map", "map-maker", "clever"),
        ],
      },
      "map-maker": {
        id: "map-maker",
        kicker: "Page 4",
        title: "The Laugh-Finding Map",
        scene: `${heroName} uses the ${theme?.tool || "kindness kit"} to make a bright map showing where each missing piece of joy might be hiding.`,
        artwork: artwork(characterId, 4),
        panels: [
          `One clue sparkles ${theme?.clueOne || "near the library"}, one hides ${theme?.clueTwo || "by the bakery"}, and one bounces ${theme?.clueThree || "near the playground"}.`,
          `${heroName} marks each clue with care, turning a muddle of worry into a plan everyone can follow.`,
        ],
        speech: ["A map makes a big job smaller.", "One clue at a time."],
        sound: "SCRIBBLE!",
        choices: [
          choice("library-first", "Search the library first", "library-laugh", "clever"),
          choice("ask-friends", "Ask friends to join", "library-laugh", "teamwork"),
        ],
      },
      "library-laugh": {
        id: "library-laugh",
        kicker: "Page 5",
        title: theme?.sceneFiveTitle || "The Library Laugh",
        scene: theme?.sceneFive || `Inside the library, a tiny giggle is trapped between two pages of a very serious book.`,
        artwork: artwork(characterId, 5),
        panels: [
          `${heroName} opens the hiding place slowly, careful not to frighten the tiny clue.`,
          `When the clue slips free, the whole room seems to breathe out at once.`,
        ],
        speech: ["Gentle does it.", "Even serious places can have joy."],
        sound: "HEE!",
        choices: [
          choice("read-joke", "Read a small joke", "bakery-bubble", "kind"),
          choice("catch-giggle", "Catch the giggle safely", "bakery-bubble", "clever"),
        ],
      },
      "bakery-bubble": {
        id: "bakery-bubble",
        kicker: "Page 6",
        title: theme?.sceneSixTitle || "The Bakery Bubble",
        scene: theme?.sceneSix || `At the bakery, a laugh bubble is floating above the cupcakes, making the sprinkles dance.`,
        artwork: artwork(characterId, 6),
        panels: [
          `${heroName} reaches up while the helper keeps everything steady and safe.`,
          `The ${theme?.troubleBeing || "Grumble Cloud"} tries a tiny smile when the clue twinkles close enough to catch.`,
        ],
        speech: ["Teamwork keeps us steady.", "That was almost funny, wasn't it?"],
        sound: "POP!",
        choices: [
          choice("share-cupcake", "Share a cupcake", "playground-chase", "kind"),
          choice("use-sprinkles", "Follow the sprinkle trail", "playground-chase", "clever"),
        ],
      },
      "playground-chase": {
        id: "playground-chase",
        kicker: "Page 7",
        title: theme?.sceneSevenTitle || "The Playground Chase",
        scene: theme?.sceneSeven || `The biggest laugh zooms around the playground, bouncing from slide to swing to climbing frame.`,
        artwork: artwork(characterId, 7),
        panels: [
          `${heroName} follows the final clue with steady feet and a face full of brave focus.`,
          `Friends cheer softly and make a safe path so the clue can be guided home, not grabbed.`,
        ],
        speech: ["This way, everyone!", "We can guide it, not grab it."],
        sound: "BOING!",
        choices: [
          choice("make-tunnel", "Make a teamwork tunnel", "cloud-smile", "teamwork"),
          choice("slow-breath", "Use a slow breath plan", "cloud-smile", "clever"),
        ],
      },
      "cloud-smile": {
        id: "cloud-smile",
        kicker: "Page 8",
        title: theme?.transformationTitle || "The First Cloud Smile",
        scene: theme?.transformationScene || `When the laughs return to the fountain, the Grumble Cloud feels a smile wriggle onto its face.`,
        artwork: artwork(characterId, 8),
        panels: [
          `${heroName} notices how hard the ${theme?.troubleBeing || "Grumble Cloud"} is trying and gives it the gift of time.`,
          `One small glow returns, then another, until the whole place starts to feel lighter.`,
        ],
        speech: ["You are doing it.", "Small smiles count too."],
        sound: "GLUG!",
        choices: [
          choice("cheer-softly", "Cheer softly", "comet-test", "kind"),
          choice("measure-giggles", "Check every giggle returned", "comet-test", "clever"),
        ],
      },
      "comet-test": {
        id: "comet-test",
        kicker: "Page 9",
        title: "The Comet Test",
        scene: theme?.testQuestion || `The rainbow comet asks ${heroName} one last question: should heroes be loud, fast, or kind?`,
        artwork: artwork(characterId, 9),
        panels: [
          `${heroName} thinks about every friend, every laugh, and every careful choice.`,
          `The comet waits patiently, glowing with all the colours of the adventure.`,
        ],
        speech: ["Heroes can be many things.", "But kindness belongs in every answer."],
        sound: "HMMM!",
        choices: [
          choice("answer-kind", "Answer with kindness", "town-parade", "kind"),
          choice("answer-all", "Answer: brave, clever, and kind", "town-parade", "brave"),
        ],
      },
      "town-parade": {
        id: "town-parade",
        kicker: "Page 10",
        title: "The Tiny Town Parade",
        scene: theme?.paradeScene || `Story City throws the smallest, sweetest parade, with bubbles instead of fireworks so nobody gets scared.`,
        artwork: artwork(characterId, 10),
        panels: [
          `${heroName} walks at the front, but makes sure the helper and the ${theme?.troubleBeing || "Grumble Cloud"} are celebrated too.`,
          `Every bubble carries a thank-you from someone who feels braver because ${heroName} cared.`,
        ],
        speech: ["Thank you, everyone.", "The cloud helped too."],
        sound: "POP-POP!",
        choices: [
          choice("share-credit", "Share the credit", "bedtime-star", "teamwork"),
          choice("thank-cloud", "Thank the cloud", "bedtime-star", "kind"),
        ],
      },
      "bedtime-star": {
        id: "bedtime-star",
        kicker: "Page 11",
        title: "The Bedtime Star",
        scene: theme?.bedtimeScene || `As evening arrives, the comet becomes a bedtime star above ${heroName}'s window.`,
        artwork: artwork(characterId, 11),
        panels: [
          `${heroName} looks out from the window, proud in the quiet way that comes after doing something kind.`,
          `The adventure settles into the soft sky, close enough to remember and gentle enough for sleep.`,
        ],
        speech: ["I was brave today.", "And I was kind."],
        sound: "TWINKLE!",
        choices: [
          choice("make-wish", "Make one kind wish", "full-ending", "kind"),
          choice("wave-goodnight", "Wave goodnight", "full-ending", "brave"),
        ],
      },
      "full-ending": {
        id: "full-ending",
        kicker: "Page 12",
        title: theme?.finalTitle || "The Laughs Come Home",
        scene: theme?.finalScene || `${heroName} helps the Grumble Cloud share its feelings, and the fountain bubbles with happy giggles again.`,
        artwork: artwork(characterId, 12),
        panels: [
          `Everyone cheers because ${heroName} solved the problem with courage, care, and a listening heart.`,
          `The final sparkle becomes a tiny bedtime wish, ready to shine whenever ${heroName} needs it.`,
        ],
        speech: ["We fixed it together.", "Every legend helps others shine."],
        sound: "TA-DA!",
        choices: [choice("read-again", "Read the adventure again", "start", "brave")],
      },
    }, theme?.pageCopy),
  }
}
