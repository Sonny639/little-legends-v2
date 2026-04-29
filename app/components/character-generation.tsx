"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Camera, Palette } from "lucide-react"
import type { GeneratedCharacter } from "@/lib/ai-character-generator"

interface CharacterGenerationProps {
  uploadedPhotos: string[]
  characterType: string
  childName: string
  onCharacterGenerated: (characters: GeneratedCharacter[]) => void
}

export default function CharacterGeneration({
  uploadedPhotos,
  characterType,
  childName,
  onCharacterGenerated,
}: CharacterGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCharacters, setGeneratedCharacters] = useState<GeneratedCharacter[]>([])
  const [selectedStyle, setSelectedStyle] = useState<"realistic" | "animated" | null>(null)
  const [generationError, setGenerationError] = useState("")

  const handleGenerateCharacter = async () => {
    setIsGenerating(true)
    setGenerationError("")

    try {
      const response = await fetch("/api/generate-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: uploadedPhotos,
          characterType,
          style: "realistic",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Character generation failed")
      }

      setGeneratedCharacters(result.characters || (result.character ? [result.character] : []))
    } catch (error) {
      console.error("Character generation failed:", error)
      setGenerationError(error instanceof Error ? error.message : "Character generation failed")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStyleSelection = (style: "realistic" | "animated") => {
    setSelectedStyle(style)
    const selectedCharacter = generatedCharacters.find((char) => char.style === style)
    if (selectedCharacter) {
      onCharacterGenerated([selectedCharacter])
    }
  }

  if (isGenerating) {
    return (
      <Card className="p-8 text-center space-y-6">
        <div className="flex justify-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-gray-800">Creating {childName}'s Character!</h3>
          <p className="text-gray-600">Our AI is working its magic to create both realistic and animated versions...</p>
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      </Card>
    )
  }

  if (generatedCharacters.length === 0) {
    return (
      <Card className="p-8 text-center space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Sparkles className="w-16 h-16 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Ready to Create {childName}'s Character?</h3>
          <p className="text-gray-600">
            We'll use the uploaded photos to create both realistic and animated versions of {childName} as a{" "}
            {characterType}!
          </p>
        </div>

        <Button
          onClick={handleGenerateCharacter}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xl px-8 py-4 rounded-full"
        >
          <Camera className="w-5 h-5 mr-2" />
          Generate {childName}'s Character! ✨
        </Button>
        {generationError && <p className="text-sm font-semibold text-red-600">{generationError}</p>}
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-3xl font-bold text-gray-800 mb-2">Choose Your Style!</h3>
        <p className="text-gray-600">We've created both realistic and animated versions of {childName}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {generatedCharacters.map((character) => (
          <Card
            key={character.id}
            className={`p-6 cursor-pointer transform hover:scale-105 transition-all ${
              selectedStyle === character.style ? "ring-4 ring-purple-500 bg-purple-50" : "hover:shadow-lg"
            }`}
            onClick={() => handleStyleSelection(character.style)}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={`${character.style === "realistic" ? "bg-blue-500" : "bg-pink-500"} text-white`}>
                  {character.style === "realistic" ? "Realistic" : "Animated"}
                </Badge>
                <Palette className="w-5 h-5 text-gray-400" />
              </div>

              {/* Character preview grid */}
              <div className="grid grid-cols-2 gap-2">
                {character.images.slice(0, 4).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <img
                      src={image.imageUrl || "/placeholder.svg"}
                      alt={`${childName} ${image.pose}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>

              <div className="text-center">
                <h4 className="font-bold text-lg">
                  {character.style === "realistic" ? "Photo-Realistic" : "Cartoon Animation"}
                </h4>
                <p className="text-sm text-gray-600">
                  {character.style === "realistic"
                    ? "Looks just like a real photo of " + childName
                    : "Disney-Pixar style animated character"}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedStyle && (
        <div className="text-center">
          <Button
            onClick={() => onCharacterGenerated(generatedCharacters.filter((char) => char.style === selectedStyle))}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xl px-8 py-4 rounded-full"
          >
            Perfect! Use {selectedStyle === "realistic" ? "Realistic" : "Animated"} {childName} 🚀
          </Button>
        </div>
      )}
    </div>
  )
}
