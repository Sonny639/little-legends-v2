// AI Character Generation using Hugging Face (FREE)

export interface CharacterGenerationOptions {
  referencePhotos: string[]
  characterType: string
  style: "realistic" | "animated" | "cartoon"
  poses: string[]
}

export interface GeneratedCharacter {
  id: string
  style: "realistic" | "animated"
  images: {
    pose: string
    imageUrl: string
  }[]
}

// Hugging Face API integration (FREE)
export async function generateCharacterWithHuggingFace(
  options: CharacterGenerationOptions,
): Promise<GeneratedCharacter[]> {
  const API_URL = "https://api-inference.huggingface.co/models/"

  try {
    // Generate both realistic and animated versions
    const characters: GeneratedCharacter[] = []

    // Realistic version using face-swapping model
    const realisticCharacter = await generateRealisticCharacter(options)
    characters.push(realisticCharacter)

    // Animated version using cartoon generation model
    const animatedCharacter = await generateAnimatedCharacter(options)
    characters.push(animatedCharacter)

    return characters
  } catch (error) {
    console.error("Character generation failed:", error)
    // Fallback to placeholder characters
    return generateFallbackCharacters(options)
  }
}

async function generateRealisticCharacter(options: CharacterGenerationOptions): Promise<GeneratedCharacter> {
  // Use InstantID or similar face-swapping model
  const model = "InstantX/InstantID"

  const poses = ["standing confidently", "in action pose", "smiling friendly", "heroic stance", "celebrating victory"]

  const images = []

  for (const pose of poses) {
    const prompt = `A ${options.characterType} ${pose}, professional photography, high quality, realistic. Match the child's visible skin tone and facial features from the reference photo.`

    // This would call the actual Hugging Face API
    const imageUrl = await callHuggingFaceAPI(model, {
      prompt,
      referenceImage: options.referencePhotos[0],
      style: "realistic",
    })

    images.push({
      pose,
      imageUrl,
    })
  }

  return {
    id: `realistic-${Date.now()}`,
    style: "realistic",
    images,
  }
}

async function generateAnimatedCharacter(options: CharacterGenerationOptions): Promise<GeneratedCharacter> {
  // Use cartoon/animation generation model
  const model = "runwayml/stable-diffusion-v1-5"

  const poses = ["standing confidently", "in action pose", "smiling friendly", "heroic stance", "celebrating victory"]

  const images = []

  for (const pose of poses) {
    const prompt = `A cute cartoon ${options.characterType} ${pose}, Disney Pixar style, 3D animation, colorful, child-friendly. Match the child's visible skin tone and facial features from the reference photo.`

    const imageUrl = await callHuggingFaceAPI(model, {
      prompt,
      referenceImage: options.referencePhotos[0],
      style: "cartoon",
    })

    images.push({
      pose,
      imageUrl,
    })
  }

  return {
    id: `animated-${Date.now()}`,
    style: "animated",
    images,
  }
}

async function callHuggingFaceAPI(model: string, options: any): Promise<string> {
  // For demo purposes, return placeholder
  // In production, this would call the actual Hugging Face API
  return `/placeholder.svg?height=400&width=400&text=${options.style}-character`
}

function generateFallbackCharacters(options: CharacterGenerationOptions): GeneratedCharacter[] {
  // Fallback to pre-made character templates if AI fails
  return [
    {
      id: "fallback-realistic",
      style: "realistic",
      images: [
        { pose: "standing", imageUrl: "/characters/realistic-standing.png" },
        { pose: "action", imageUrl: "/characters/realistic-action.png" },
      ],
    },
    {
      id: "fallback-animated",
      style: "animated",
      images: [
        { pose: "standing", imageUrl: "/characters/animated-standing.png" },
        { pose: "action", imageUrl: "/characters/animated-action.png" },
      ],
    },
  ]
}

// Photo processing utilities
export function processUploadedPhotos(photos: File[]): Promise<string[]> {
  return Promise.all(
    photos.map((photo) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(photo)
      })
    }),
  )
}

export function validatePhotos(photos: string[]): boolean {
  // Basic validation - ensure we have at least one photo
  return photos.length > 0 && photos.every((photo) => photo.startsWith("data:image/"))
}
