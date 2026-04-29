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

const artwork = (characterId: string, page: number) => ({
  boy: `/stories/${characterId}/${characterId}-boy-page-${page}.png`,
  girl: `/stories/${characterId}/${characterId}-girl-page-${page}.png`,
})

const imageBrief = (heroName: string, heroType: string, pageTitle: string, scene: string) =>
  `Front-facing child as ${heroName} the ${heroType}. Page scene: ${pageTitle}. ${scene} ${
    heroType.toLowerCase().includes("bitcoin")
      ? "Outfit requirement: bright orange Bitcoin superhero suit with a round Bitcoin chest emblem, gold utility belt, lightning cape, and friendly futuristic saver-hero details."
      : ""
  } Match the child's visible skin tone and facial features from the reference photo. Keep the child's face large, clear, expressive, and unobstructed in the upper centre third of the image. Leave the lower third and side margins free for layout breathing room. No text, speech bubbles, hands, props, masks, helmets, shadows, or foreground objects covering the face. Bright premium children's storybook style.`

const footballerArtwork = (page: number) => {
  if (page === 12) {
    return {
      boy: "/stories/footballer/footballer-boy-final.png",
      girl: "/stories/footballer/footballer-girl-final.png",
    }
  }

  return {
    boy: `/stories/footballer/footballer-boy-page-${Math.min(page, 3)}.png`,
    girl: `/stories/footballer/footballer-girl-page-${Math.min(page, 3)}.png`,
  }
}

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
}

const starterStoryThemes: Record<string, (heroName: string, heroType: string) => StarterStoryTheme> = {
  wizard: (heroName, heroType) => ({
    title: `${heroName} and the Moonbeam Spell`,
    subtitle: `${heroName} the ${heroType} learns that the strongest magic is patient, kind, and carefully chosen.`,
    lesson: "Patience, kindness, and using power wisely",
    headline: "Unlock the full magical spellbook adventure",
    body: `The full story follows ${heroName} through Moonbeam Library, a muddled spell, and a glowing rescue where kind words become real magic.`,
    callTitle: "The Spellbook Calls",
    callScene: `A runaway spellbook flutters over Moonbeam Library and writes ${heroName}'s name in silver stars.`,
    destination: "Moonbeam Library",
    troubleTitle: "Trouble in the Moonbeam Library",
    troubleScene: "The library shelves are spinning because a Tangle Spell mixed every magic word into a silly soup.",
    troubleBeing: "Tangle Spell",
    helper: "a shy baby dragon with smoky sneezes",
    tool: "kindness wand",
    clueOne: "inside the whispering dictionary",
    clueTwo: "above the cupcake spell shelf",
    clueThree: "around the moonlit reading rug",
    sceneFiveTitle: "The Whispering Dictionary",
    sceneFive: "A tiny correct word is trapped between two pages of a dictionary that only opens for gentle voices.",
    sceneSixTitle: "The Cupcake Spell Shelf",
    sceneSix: "A rhyme bubble floats above the cupcake spells, making the sprinkles chant in muddled magic.",
    sceneSevenTitle: "The Reading Rug Chase",
    sceneSeven: "The final magic word bounces across the moonlit rug, leaving silver footprints behind.",
    transformationTitle: "The First Kind Spell",
    transformationScene: "When the spell words return, the Tangle Spell glows softly and tries its first kind spell.",
    testQuestion: "The spellbook asks: should magic be loud, fast, or kind?",
    paradeScene: "Moonbeam Library throws a quiet sparkle parade, with floating bookmarks instead of fireworks.",
    bedtimeScene: "As evening arrives, the spellbook becomes a bedtime star above the window.",
    finalTitle: "The Magic Words Come Home",
    finalScene: `${heroName} helps the Tangle Spell find kind words, and Moonbeam Library shines brighter than ever.`,
  }),
  fairy: (heroName, heroType) => ({
    title: `${heroName} and the Glow Garden`,
    subtitle: `${heroName} the ${heroType} brings colour back to a garden by listening before sprinkling sparkle.`,
    lesson: "Gentleness, confidence, and caring for nature",
    headline: "Unlock the full fairy garden adventure",
    body: `The full story follows ${heroName} through Fairy Meadow, missing colours, and a rescue where every creature gets its glow back.`,
    callTitle: "The Glow Flower Calls",
    callScene: `A glow flower blinks over Fairy Meadow and sends a trail of petals to ${heroName}.`,
    destination: "Fairy Meadow",
    troubleTitle: "Trouble in Fairy Meadow",
    troubleScene: "The glow flowers have forgotten their colours because Dull Dust covered every petal with a grey sigh.",
    troubleBeing: "Dull Dust",
    helper: "a tiny bee wearing a brave little backpack",
    tool: "sparkle seed pouch",
    clueOne: "inside the petal library",
    clueTwo: "above the honey cake stall",
    clueThree: "around the mushroom playground",
    sceneFiveTitle: "The Petal Library",
    sceneFive: "A pink giggle of colour is tucked inside a petal book that opens only for careful hands.",
    sceneSixTitle: "The Honey Cake Stall",
    sceneSix: "A yellow glow bubble floats above honey cakes, making sugar stars dance.",
    sceneSevenTitle: "The Mushroom Playground",
    sceneSeven: "The biggest glow races around mushroom steps and leafy slides.",
    transformationTitle: "The First Flower Glow",
    transformationScene: "When the colours return, Dull Dust turns into soft silver glitter and tries a tiny smile.",
    testQuestion: "The glow flower asks: should magic sparkle for one person or help everyone bloom?",
    paradeScene: "Fairy Meadow throws a tiny petal parade with bubbles instead of fireworks.",
    bedtimeScene: "As evening arrives, the glow flower becomes a bedtime star above the window.",
    finalTitle: "The Garden Glows Again",
    finalScene: `${heroName} helps Dull Dust share its worry, and Fairy Meadow blooms in every colour.`,
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
    subtitle: `${heroName} the ${heroType} learns that a true royal heart listens, shares, and helps others shine.`,
    lesson: "Leadership, kindness, and sharing the spotlight",
    headline: "Unlock the full royal starlight adventure",
    body: `The full story follows ${heroName} through Starlight Castle, a worried crown, and a celebration where everyone feels important.`,
    callTitle: "The Crown Calls",
    callScene: `A starlight crown twinkles above the castle garden and writes ${heroName}'s name in gold.`,
    destination: "Starlight Castle",
    troubleTitle: "Trouble at Starlight Castle",
    troubleScene: "The royal wishes are trapped in bubbles because the Crown of Feelings is scared of choosing only one person to shine.",
    troubleBeing: "Crown of Feelings",
    helper: "a page with a wobbly tray of invitations",
    tool: "wish compass",
    clueOne: "inside the royal story room",
    clueTwo: "above the celebration cake table",
    clueThree: "around the castle playground",
    sceneFiveTitle: "The Royal Story Room",
    sceneFive: "A tiny wish is tucked inside a very serious royal book.",
    sceneSixTitle: "The Celebration Cake Table",
    sceneSix: "A wish bubble floats above the cakes, making sugar pearls dance.",
    sceneSevenTitle: "The Castle Playground",
    sceneSeven: "The biggest wish bounces around the castle slides and ribbon swings.",
    transformationTitle: "The First Crown Smile",
    transformationScene: "When the wishes return, the crown learns that everyone can have a turn to shine.",
    testQuestion: "The crown asks: should leaders be loud, fancy, or kind?",
    paradeScene: "Starlight Castle throws a gentle royal parade where every helper gets a cheer.",
    bedtimeScene: "As evening arrives, the crown becomes a bedtime star above the window.",
    finalTitle: "The Castle Shines Together",
    finalScene: `${heroName} helps the crown share its worries, and every royal wish finds a happy home.`,
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
    subtitle: `${heroName} the ${heroType} follows fossil clues and learns that big discoveries need gentle hands.`,
    lesson: "Curiosity, patience, and caring for nature",
    headline: "Unlock the full dinosaur rescue",
    body: `The full story follows ${heroName} through Fossil Valley, a missing egg, and a rescue where careful thinking protects the dinosaurs.`,
    callTitle: "The Fossil Calls",
    callScene: `A golden fossil glows in Fossil Valley and points a trail of footprints toward ${heroName}.`,
    destination: "Fossil Valley",
    troubleTitle: "Trouble in Fossil Valley",
    troubleScene: "A dino egg has rolled away because the Rumble Hill shook when everyone rushed too fast.",
    troubleBeing: "Rumble Hill",
    helper: "a tiny triceratops with muddy knees",
    tool: "fossil finder",
    clueOne: "inside the fossil record cave",
    clueTwo: "above the leaf snack pile",
    clueThree: "around the dino playground",
    sceneFiveTitle: "The Fossil Record Cave",
    sceneFive: "A footprint clue is pressed into stone between two ancient leaf prints.",
    sceneSixTitle: "The Leaf Snack Pile",
    sceneSix: "A clue bubble floats above leafy snacks, making fern crumbs dance.",
    sceneSevenTitle: "The Dino Playground",
    sceneSeven: "The final footprint races around log bridges and soft mud slides.",
    transformationTitle: "The First Gentle Rumble",
    transformationScene: "When the clues return, Rumble Hill settles down and the egg nest glows warmly.",
    testQuestion: "The fossil asks: should explorers rush or protect what they find?",
    paradeScene: "Fossil Valley throws a stomp-soft parade so the tiny egg can rest.",
    bedtimeScene: "As evening arrives, the fossil becomes a bedtime star above the window.",
    finalTitle: "The Dino Egg Comes Home",
    finalScene: `${heroName} helps Rumble Hill calm down, and the dino egg returns safely to its nest.`,
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
}

function createSuperheroStory(heroName: string, heroType: string): CharacterStory {
  return {
    characterId: "superhero",
    title: `${heroName} and the Sky-High Promise`,
    subtitle: `${heroName} the ${heroType} learns that real power means helping people feel safe, seen, and brave.`,
    readingAge: "Ages 3 to 8",
    lesson: "Courage, kindness, and teamwork",
    previewPageLimit: 3,
    purchaseSummary: {
      headline: "Unlock the full superhero book",
      body: `The full adventure continues with the promise tower rescue, the mystery of the worried cloud, and a warm ending where ${heroName}'s choices decide how the city celebrates.`,
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
        scene: `Just before bedtime, a silver promise star flickers above the rooftops and writes ${heroName}'s name in the clouds.`,
        artwork: artwork("superhero", 1),
        panels: [
          `${heroName} sees the star tremble like it is trying very hard not to cry.`,
          `The city is quiet, but one little window glows at the top of Promise Tower.`,
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
        scene: `${heroName} shoots into the night, cape bright, heart thumping, eyes fixed on Promise Tower.`,
        artwork: artwork("superhero", 2),
        panels: [
          `Wind rushes past, but ${heroName} listens for the smallest sound of worry.`,
          `At the glowing window, a tiny cloud is stuck inside a jar labelled BIG FEELINGS.`,
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
        scene: `${heroName} packs a soft torch, brave stickers, a tiny snack, and a note that says: You matter.`,
        artwork: artwork("superhero", 2),
        panels: [
          `The kit glows brighter with every caring thought.`,
          `A trail of silver sparks points the way to Promise Tower.`,
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
        scene: `The little cloud whispers that it swallowed the city's promises because it was scared everyone would forget them.`,
        artwork: artwork("superhero", 3),
        panels: [
          `${heroName} does not shout. The cloud is not naughty; it is worried.`,
          `Below the tower, children look up, hoping their promises will come back.`,
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
          `The cloud puffs out one promise at a time, each glowing like a tiny lantern.`,
          `Every lantern floats back to the right window.`,
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
          `One child promises to try again. Another promises to share. Another promises to say sorry.`,
          `The worried cloud grows lighter as the city works together.`,
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
          `${heroName} steps onto the glowing bridge and keeps looking straight ahead with a calm, brave face.`,
          `The little cloud floats beside ${heroName}, learning that being sorry can also be strong.`,
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
          `The cloud says sorry, and the city listens instead of shouting.`,
          `${heroName} reminds everyone that big feelings need words, hugs, and time.`,
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
          `${heroName} stands front and centre as the city gives a gentle hero cheer.`,
          `The little cloud becomes a soft sky helper who reminds people to talk about their feelings.`,
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
          `The cloud becomes the city's gentle reminder to talk about big feelings.`,
          `${heroName} flies home under a sky full of promises, proud and peaceful.`,
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
    subtitle: `${heroName} the ${heroType} plays the biggest match of the season and learns that great players lift the whole team.`,
    readingAge: "Ages 3 to 9",
    lesson: "Teamwork, confidence, resilience, and fair play",
    previewPageLimit: 3,
    purchaseSummary: {
      headline: "Unlock the full football final",
      body: `The full match continues through a missed shot, a half-time wobble, and a last-minute choice where ${heroName} can win by helping the whole team believe again.`,
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
        scene: `Wonder Stadium is packed for the Friendship Final, and ${heroName}'s team needs one more brave player.`,
        artwork: {
          boy: "/stories/footballer/footballer-boy-page-1.png",
          girl: "/stories/footballer/footballer-girl-page-1.png",
        },
        panels: [
          `${heroName} steps onto the grass and hears the crowd clap like rolling thunder.`,
          `Across the pitch, the Grumble Goalie guards the net with a very serious frown.`,
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
        scene: `${heroName} reaches the penalty box just as the ball bounces high into the air.`,
        artwork: {
          boy: "/stories/footballer/footballer-boy-page-2.png",
          girl: "/stories/footballer/footballer-girl-page-2.png",
        },
        panels: [
          `The shot looks possible, but a teammate is standing in an even better spot.`,
          `The Grumble Goalie shouts, trying to make everyone rush.`,
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
        scene: `The score is still level, and one teammate feels sad after missing the ball.`,
        artwork: {
          boy: "/stories/footballer/footballer-boy-page-3.png",
          girl: "/stories/footballer/footballer-girl-page-3.png",
        },
        panels: [
          `${heroName} remembers that a match is not over after one mistake.`,
          `The coach points to the team badge and asks everyone what kind of team they want to be.`,
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
          `A teammate points into space and trusts ${heroName} to notice.`,
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
          `${heroName} slides in front-on, arms wide for balance, and keeps the ball in play.`,
          `The crowd gasps as the Grumble Goalie finally looks worried.`,
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
          `The team listens, nods, and starts smiling because a new idea is forming.`,
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
        scene: `A corner kick swings into the box, curling like a comet toward ${heroName}.`,
        artwork: footballerArtwork(7),
        panels: [
          `${heroName} could shoot, but two teammates are ready for a clever routine.`,
          `The Grumble Goalie waves big gloves and tries to distract everyone.`,
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
          `${heroName} claps immediately, because nearly scoring means the plan is working.`,
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
          `${heroName} receives the ball in the centre with defenders rushing in from both sides.`,
          `The crowd gets loud, but ${heroName} hears the teammate calling softly on the wing.`,
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
        scene: `The ball moves from player to player, faster and happier than the other team can follow.`,
        artwork: footballerArtwork(10),
        panels: [
          `The youngest teammate taps it forward and beams when ${heroName} cheers their name.`,
          `The Grumble Goalie spins around, unsure where the final shot will come from.`,
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
          `${heroName} turns straight to the team before celebrating, because every player helped.`,
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
        scene: `${heroName} leads one final team move, and every player touches the ball before it rolls into the net.`,
        artwork: footballerArtwork(12),
        panels: [
          `Even the Grumble Goalie smiles when ${heroName} offers a handshake.`,
          `The trophy shines for the whole team, not just one player.`,
        ],
        speech: ["We won by playing together.", "Fair play feels brilliant."],
        sound: "GOOOAL!",
        choices: [choice("read-again", "Read the adventure again", "start", "brave")],
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
    pages: {
      start: {
        id: "start",
        kicker: "Page 1",
        title: theme?.callTitle || "The Comet Calls",
        scene: theme?.callScene || `A rainbow comet zooms over Story City and twinkles directly above ${heroName}.`,
        artwork: artwork(characterId, 1),
        panels: [
          `${heroName} spots a trail of sparkles leading toward ${theme?.destination || "Giggle Fountain"}.`,
          `The comet hums softly, as if it is asking for a kind and brave helper.`,
        ],
        speech: ["That comet needs me.", "I can do this."],
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
          `Nobody is hurt, but everyone looks unsure about what to do next.`,
          `${heroName} notices the ${theme?.troubleBeing || "Grumble Cloud"} looks lonely, not mean.`,
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
          `${heroName} stands front-on, listens carefully, and keeps a gentle face even though the problem is big.`,
          `${theme?.helper || "A small helper"} watches closely while ${heroName} works out what to do next.`,
        ],
        speech: ["Everyone wants to belong.", "We can fix this together."],
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
          `The comet circles above ${heroName}, lighting the safest path forward.`,
        ],
        speech: ["A map makes a big job smaller.", "Let's find one laugh at a time."],
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
          `${heroName} opens the book slowly so the giggle does not get frightened.`,
          `The librarian smiles when the giggle pops out wearing paper glasses.`,
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
          `${heroName} reaches up while the baker steadies the step stool.`,
          `The Grumble Cloud tries a tiny smile when flour lands on its nose.`,
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
          `${heroName} runs straight toward the camera with the laugh shining just ahead.`,
          `Children cheer and make a tunnel with their arms so the laugh can be guided home.`,
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
          `${heroName} notices the cloud is trying hard and gives it time.`,
          `The fountain makes one small giggle, then another, then a bubbly chuckle.`,
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
          `${heroName} walks at the front while the Grumble Cloud floats proudly beside the comet.`,
          `Every bubble carries a thank-you from someone ${heroName} helped.`,
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
          `${heroName} looks front-on from the window, proud, calm, and ready for sleep.`,
          `The Grumble Cloud is now a Giggle Cloud, tucked into the soft purple sky.`,
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
          `The town cheers because ${heroName} solved the problem with courage and care.`,
          `The comet bursts into tiny stars, each carrying a kind wish.`,
        ],
        speech: ["We fixed it together.", "Every legend helps others shine."],
        sound: "TA-DA!",
        choices: [choice("read-again", "Read the adventure again", "start", "brave")],
      },
    },
  }
}
