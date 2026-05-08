"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Sparkles, BookOpen, Star, Heart, Wand2, User, Search, Download, Mail, Truck, CreditCard, ShieldCheck, Clock, CheckCircle2, Camera, X, Trash2 } from 'lucide-react'
import { checkoutProducts } from "@/lib/checkout"
import { resolveFullStoryPages } from "@/lib/full-story"
import { getStoryArtworkFallback } from "@/lib/story-artwork-fallbacks"
import { getStoryForCharacter, getStoryPathSummary, type StoryPathChoice } from "@/lib/stories"
import { StoryArtPlaceholder } from "@/components/story-art-placeholder"

type UploadedPhoto = {
  file: File
  previewUrl: string
}

type Step = "welcome" | "gender" | "name" | "upload" | "character" | "story" | "checkout" | "full-story"
type CheckoutProduct = "digital" | "hardback" | "upgrade"
type PaymentStatus = "payment_pending" | "paid_demo" | "paid"
type FulfilmentStatus = "new" | "in_progress" | "ready" | "sent"

type OrderRecord = {
  id: string
  createdAt: string
  product: CheckoutProduct
  total: number
  email: string
  phone?: string
  heroName: string
  heroType: string
  storyTitle: string
  storyId: string
  gender: "boy" | "girl" | null
  photoCount?: number
  choices: StoryPathChoice[]
  postage?: {
    fullName: string
    addressLine1: string
    addressLine2: string
    city: string
    postcode: string
    country: string
  }
  status: PaymentStatus
  fulfilmentStatus?: FulfilmentStatus
  fulfilmentUpdatedAt?: string
  checkoutUrl?: string
}

const createOrderId = () => {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `LL-${Date.now().toString(36).toUpperCase()}-${randomPart}`
}

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" })

const getHeroInitials = (name?: string) =>
  (name || "Hero")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>("welcome")
  const [selectedGender, setSelectedGender] = useState<"boy" | "girl" | null>(null)
  const [childName, setChildName] = useState("")
  const [selectedLegendName, setSelectedLegendName] = useState("")
  const [suggestedNames, setSuggestedNames] = useState<string[]>([])
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [photoUploadMessage, setPhotoUploadMessage] = useState("")
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [storyPage, setStoryPage] = useState(1)
  const [storyPageId, setStoryPageId] = useState("start")
  const [storyPath, setStoryPath] = useState<StoryPathChoice[]>([])
  const [displayedNames, setDisplayedNames] = useState<any[]>([])
  const [nameSearchTerm, setNameSearchTerm] = useState("")
  const [useRealName, setUseRealName] = useState(false)
  const [customLegendName, setCustomLegendName] = useState("")
  const [allLegendNames, setAllLegendNames] = useState<any[]>([])
  const [nameBatchIndex, setNameBatchIndex] = useState(0)
  const [characterBatchIndex, setCharacterBatchIndex] = useState(0)
  const [checkoutProduct, setCheckoutProduct] = useState<CheckoutProduct>("digital")
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [isPreparingCheckout, setIsPreparingCheckout] = useState(false)
  const [failedArtwork, setFailedArtwork] = useState<Record<string, boolean>>({})
  const [latestOrder, setLatestOrder] = useState<OrderRecord | null>(null)
  const [checkoutReturnMessage, setCheckoutReturnMessage] = useState("")
  const [checkoutError, setCheckoutError] = useState("")
  const [checkoutForm, setCheckoutForm] = useState({
    email: "",
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
    phone: "",
  })

  // Initialize legend names and randomize when gender changes
  useEffect(() => {
    const initialLegendNames = [
      // Powerful & Strong
      { name: "Captain Thunder", category: "powerful", gender: "any" },
      { name: "Lightning Strike", category: "powerful", gender: "any" },
      { name: "Storm Rider", category: "powerful", gender: "any" },
      { name: "Fire Heart", category: "powerful", gender: "any" },
      { name: "Iron Will", category: "powerful", gender: "any" },
      { name: "Steel Wing", category: "powerful", gender: "any" },
      { name: "Titan Force", category: "powerful", gender: "any" },
      { name: "Blaze Runner", category: "powerful", gender: "any" },

      // Magical & Fantasy (Popular with Girls)
      { name: "Princess Starlight", category: "magical", gender: "girl" },
      { name: "Lady Rainbow", category: "magical", gender: "girl" },
      { name: "Queen Crystal", category: "magical", gender: "girl" },
      { name: "Star Moonbeam", category: "magical", gender: "girl" },
      { name: "Fairy Sparkle", category: "magical", gender: "girl" },
      { name: "Diamond Rose", category: "magical", gender: "girl" },
      { name: "Golden Butterfly", category: "magical", gender: "girl" },
      { name: "Silver Dream", category: "magical", gender: "girl" },
      { name: "Mystic Pearl", category: "magical", gender: "girl" },
      { name: "Enchanted Lily", category: "magical", gender: "girl" },

      // Adventure & Action (Popular with Boys)
      { name: "Captain Courage", category: "adventure", gender: "boy" },
      { name: "Sir Braveheart", category: "adventure", gender: "boy" },
      { name: "Lord Phoenix", category: "adventure", gender: "boy" },
      { name: "Master Lightning", category: "adventure", gender: "boy" },
      { name: "Champion Bolt", category: "adventure", gender: "boy" },
      { name: "Hero Striker", category: "adventure", gender: "boy" },
      { name: "Knight Blazer", category: "adventure", gender: "boy" },
      { name: "Warrior Storm", category: "adventure", gender: "boy" },
      { name: "Ranger Swift", category: "adventure", gender: "boy" },
      { name: "Guardian Steel", category: "adventure", gender: "boy" },

      // Cool & Modern
      { name: "Neon Flash", category: "modern", gender: "any" },
      { name: "Cyber Storm", category: "modern", gender: "any" },
      { name: "Rocket Blast", category: "modern", gender: "any" },
      { name: "Turbo Speed", category: "modern", gender: "any" },
      { name: "Laser Strike", category: "modern", gender: "any" },
      { name: "Digital Hero", category: "modern", gender: "any" },
      { name: "Tech Master", category: "modern", gender: "any" },
      { name: "Code Breaker", category: "modern", gender: "any" },

      // Nature & Elements
      { name: "Ocean Spirit", category: "nature", gender: "any" },
      { name: "Wind Dancer", category: "nature", gender: "any" },
      { name: "Earth Guardian", category: "nature", gender: "any" },
      { name: "Sky Walker", category: "nature", gender: "any" },
      { name: "River Song", category: "nature", gender: "any" },
      { name: "Mountain Peak", category: "nature", gender: "any" },
      { name: "Forest Whisper", category: "nature", gender: "any" },
      { name: "Solar Flare", category: "nature", gender: "any" },

      // Cute & Friendly
      { name: "Sunshine Smile", category: "friendly", gender: "any" },
      { name: "Happy Heart", category: "friendly", gender: "any" },
      { name: "Giggles McGee", category: "friendly", gender: "any" },
      { name: "Sparkle Joy", category: "friendly", gender: "any" },
      { name: "Bubble Pop", category: "friendly", gender: "any" },
      { name: "Rainbow Bright", category: "friendly", gender: "any" },
      { name: "Cuddle Bear", category: "friendly", gender: "any" },
      { name: "Sweet Dreams", category: "friendly", gender: "any" },

      // Classic Heroes (Inspired by popular characters)
      { name: "Wonder Star", category: "classic", gender: "any" },
      { name: "Super Nova", category: "classic", gender: "any" },
      { name: "Amazing Grace", category: "classic", gender: "any" },
      { name: "Incredible Force", category: "classic", gender: "any" },
      { name: "Fantastic Four", category: "classic", gender: "any" },
      { name: "Mighty Mouse", category: "classic", gender: "any" },
      { name: "Power Ranger", category: "classic", gender: "any" },
      { name: "Space Cadet", category: "classic", gender: "any" },
    ]

    setAllLegendNames(initialLegendNames)

    if (selectedGender) {
      const genderFilteredNames = initialLegendNames.filter(
        (name) => name.gender === selectedGender || name.gender === "any",
      )
      const shuffled = [...genderFilteredNames].sort(() => Math.random() - 0.5)
      setDisplayedNames(shuffled.slice(0, 12))
    }
  }, [selectedGender])

  // New comprehensive character list based on what children actually love
  const allCharacters = [
    // Superheroes & Action
    { id: "superhero", name: "Superhero", emoji: "🦸", color: "bg-red-500", category: "action" },
    { id: "ninja", name: "Ninja Warrior", emoji: "🥷", color: "bg-gray-800", category: "action" },
    { id: "pirate", name: "Pirate Captain", emoji: "🏴‍☠️", color: "bg-amber-700", category: "adventure" },
    { id: "knight", name: "Brave Knight", emoji: "⚔️", color: "bg-blue-700", category: "adventure" },
    { id: "spy", name: "Secret Agent", emoji: "🕵️", color: "bg-black", category: "action" },

    // Fantasy & Magic
    { id: "wizard", name: "Wizard", emoji: "🧙", color: "bg-purple-600", category: "fantasy" },
    { id: "fairy", name: "Fairy", emoji: "🧚", color: "bg-pink-400", category: "fantasy" },
    { id: "mermaid", name: "Mermaid", emoji: "🧜", color: "bg-teal-500", category: "fantasy" },
    { id: "unicorn-rider", name: "Unicorn Rider", emoji: "🦄", color: "bg-rainbow", category: "fantasy" },
    { id: "dragon-trainer", name: "Dragon Trainer", emoji: "🐉", color: "bg-green-600", category: "fantasy" },
    { id: "princess", name: "Princess", emoji: "👸", color: "bg-pink-500", category: "fantasy" },
    { id: "prince", name: "Prince", emoji: "🤴", color: "bg-blue-500", category: "fantasy" },

    // Animals & Nature
    { id: "dinosaur-expert", name: "Dinosaur Expert", emoji: "🦕", color: "bg-green-700", category: "animals" },
    { id: "zoo-keeper", name: "Zoo Keeper", emoji: "🦁", color: "bg-orange-600", category: "animals" },
    { id: "marine-biologist", name: "Marine Biologist", emoji: "🐠", color: "bg-blue-400", category: "animals" },
    { id: "horse-rider", name: "Horse Rider", emoji: "🐎", color: "bg-brown-600", category: "animals" },
    { id: "pet-trainer", name: "Pet Trainer", emoji: "🐕", color: "bg-yellow-600", category: "animals" },

    // Sports & Active
    { id: "footballer", name: "Football Star", emoji: "⚽", color: "bg-green-500", category: "sports" },
    { id: "basketball-player", name: "Basketball Player", emoji: "🏀", color: "bg-orange-500", category: "sports" },
    { id: "gymnast", name: "Gymnast", emoji: "🤸", color: "bg-purple-400", category: "sports" },
    { id: "swimmer", name: "Swimming Champion", emoji: "🏊", color: "bg-blue-300", category: "sports" },
    { id: "ice-skater", name: "Ice Skater", emoji: "⛸️", color: "bg-cyan-400", category: "sports" },
    { id: "ballerina", name: "Ballerina", emoji: "🩰", color: "bg-pink-500", category: "sports" },

    // Creative & Arts
    { id: "pop-star", name: "Pop Star", emoji: "🎤", color: "bg-purple-500", category: "creative" },
    { id: "artist", name: "Artist", emoji: "🎨", color: "bg-rainbow", category: "creative" },
    { id: "musician", name: "Musician", emoji: "🎸", color: "bg-red-600", category: "creative" },
    { id: "dancer", name: "Dancer", emoji: "💃", color: "bg-pink-600", category: "creative" },
    { id: "photographer", name: "Photographer", emoji: "📸", color: "bg-gray-600", category: "creative" },
    { id: "fashion-designer", name: "Fashion Designer", emoji: "👗", color: "bg-purple-300", category: "creative" },

    // Adventure & Exploration
    { id: "astronaut", name: "Astronaut", emoji: "🚀", color: "bg-blue-500", category: "adventure" },
    { id: "explorer", name: "Explorer", emoji: "🗺️", color: "bg-green-600", category: "adventure" },
    { id: "archaeologist", name: "Archaeologist", emoji: "🏺", color: "bg-yellow-700", category: "adventure" },
    { id: "mountain-climber", name: "Mountain Climber", emoji: "🏔️", color: "bg-gray-500", category: "adventure" },
    { id: "treasure-hunter", name: "Treasure Hunter", emoji: "💎", color: "bg-yellow-500", category: "adventure" },

    // Helping Heroes
    { id: "doctor", name: "Doctor", emoji: "👩‍⚕️", color: "bg-white", category: "helper" },
    { id: "firefighter", name: "Firefighter", emoji: "🚒", color: "bg-red-700", category: "helper" },
    { id: "police-officer", name: "Police Officer", emoji: "👮", color: "bg-blue-800", category: "helper" },
    { id: "teacher", name: "Teacher", emoji: "👩‍🏫", color: "bg-green-400", category: "helper" },
    { id: "vet", name: "Veterinarian", emoji: "👩‍⚕️", color: "bg-green-500", category: "helper" },
    { id: "chef", name: "Chef", emoji: "👨‍🍳", color: "bg-orange-400", category: "helper" },

    // Technology & Future
    { id: "robot-builder", name: "Robot Builder", emoji: "🤖", color: "bg-gray-400", category: "tech" },
    { id: "video-game-designer", name: "Game Designer", emoji: "🎮", color: "bg-indigo-500", category: "tech" },
    { id: "inventor", name: "Inventor", emoji: "💡", color: "bg-yellow-400", category: "tech" },
    { id: "scientist", name: "Scientist", emoji: "🔬", color: "bg-blue-600", category: "tech" },

    { id: "bitcoin-hero", name: "Bitcoin Hero", emoji: "₿", color: "bg-amber-500", category: "tech" },

    // Racing & Vehicles
    { id: "race-driver", name: "Race Car Driver", emoji: "🏎️", color: "bg-red-500", category: "racing" },
    { id: "pilot", name: "Pilot", emoji: "✈️", color: "bg-blue-400", category: "racing" },
    { id: "boat-captain", name: "Boat Captain", emoji: "⛵", color: "bg-blue-700", category: "racing" },
    { id: "motorcycle-racer", name: "Motorcycle Racer", emoji: "🏍️", color: "bg-black", category: "racing" },
  ]

  const [characterSearchTerm, setCharacterSearchTerm] = useState("")
  const priorityHeroIds = new Set(["superhero", "wizard", "fairy", "princess", "footballer", "dinosaur-expert"])
  const featuredHeroIds = [
    "superhero",
    "wizard",
    "fairy",
    "princess",
    "footballer",
    "dinosaur-expert",
    "astronaut",
    "dragon-trainer",
    "ninja",
    "pirate",
    "knight",
    "mermaid",
    "unicorn-rider",
    "pop-star",
    "race-driver",
    "doctor",
    "basketball-player",
    "bitcoin-hero",
  ]
  const featuredCharacters = featuredHeroIds
    .map((id) => allCharacters.find((character) => character.id === id))
    .filter((character): character is (typeof allCharacters)[number] => Boolean(character))
  const characterBatchSize = 6
  const maxCharacterBatch = Math.max(1, Math.ceil(featuredCharacters.length / characterBatchSize))
  const checkoutIcons = {
    digital: Download,
    hardback: BookOpen,
    upgrade: Truck,
  }
  const checkoutOptions = checkoutProducts
  const currentCheckout = checkoutOptions[checkoutProduct]
  const requiresPostage = checkoutProduct !== "digital"
  const initialCheckoutProducts: CheckoutProduct[] = ["digital", "hardback"]
  const visibleCheckoutProducts: CheckoutProduct[] = checkoutProduct === "upgrade" ? ["upgrade"] : initialCheckoutProducts

  const startCheckout = (product: CheckoutProduct) => {
    setCheckoutProduct(product)
    setOrderSubmitted(false)
    setIsPreparingCheckout(false)
    setCheckoutReturnMessage("")
    setCheckoutError("")
    setCurrentStep("checkout")
  }

  const goBack = () => {
    setCheckoutReturnMessage("")
    setCheckoutError("")

    if (currentStep === "name") {
      setCurrentStep("gender")
    } else if (currentStep === "upload") {
      setCurrentStep("name")
    } else if (currentStep === "character") {
      setCurrentStep("upload")
    } else if (currentStep === "story") {
      setCurrentStep("character")
    } else if (currentStep === "checkout") {
      setOrderSubmitted(false)
      setIsPreparingCheckout(false)
      setStoryPageId("purchase")
      setCurrentStep("story")
    } else if (currentStep === "full-story") {
      setCurrentStep("checkout")
    }
  }

  const updateCheckoutField = (field: keyof typeof checkoutForm, value: string) => {
    setCheckoutForm((current) => ({ ...current, [field]: value }))
  }

  // Add search functionality
  const getFilteredCharacters = () => {
    if (!characterSearchTerm) return featuredCharacters.slice(characterBatchIndex * characterBatchSize, characterBatchIndex * characterBatchSize + characterBatchSize)

    return allCharacters.filter(
      (char) =>
        char.name.toLowerCase().includes(characterSearchTerm.toLowerCase()) ||
        char.category.toLowerCase().includes(characterSearchTerm.toLowerCase()),
    )
  }

  // Update the character selection step to skip character-type
  const handleCharacterSelection = (characterId: string) => {
    setSelectedCharacter(characterId)
    setStoryPage(1)
    setStoryPageId("start")
    setStoryPath([])
    setCurrentStep("story") // Skip character-type step
  }

  // AI Legend Name Generator
  const generateLegendNames = (name: string, gender: "boy" | "girl") => {
    const title = gender === "boy" ? "Captain" : "Star Captain"

    return [
      `${name} Star Shield`,
      `${name} Thunderbolt`,
      `Super ${name}`,
      `${name} the Galaxy Guardian`,
      `${title} ${name}`,
      `${name} Lightning Heart`,
      `${name} Rocket Rider`,
      `${name} Magic Bolt`,
      `${name} Wonder Wing`,
      `${name} Storm Chaser`,
      `${name} Dragon Dash`,
      `${name} Cosmic Cape`,
      `${name} Supernova`,
      `${name} Rainbow Rescue`,
      `${name} Firefly Force`,
      `${name} Moonbeam Hero`,
      `${name} Sky Saver`,
      `${name} Spark Squad`,
      `${name} the Great`,
      `${name} the Brave`,
      `${name} Hope Keeper`,
      `${name} Dream Builder`,
      `${name} Courage Star`,
      `${name} Kindness Knight`,
      `${name} Wonder Heart`,
      `${name} Victory Spark`,
      `${name} Bright Future`,
    ]
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const selectedFiles = Array.from(files)
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"))
    const remainingSlots = Math.max(0, 3 - uploadedPhotos.length)
    const acceptedFiles = imageFiles.slice(0, remainingSlots)
    const newPhotos = acceptedFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    if (newPhotos.length > 0) {
      setUploadedPhotos((prev) => [...prev, ...newPhotos].slice(0, 3))
    }

    if (remainingSlots === 0) {
      setPhotoUploadMessage("You already have 3 photos selected. Remove one if you want to choose a different reference.")
    } else if (imageFiles.length !== selectedFiles.length) {
      setPhotoUploadMessage("Only image files can be used for the character reference.")
    } else if (imageFiles.length > acceptedFiles.length) {
      setPhotoUploadMessage("We kept the first 3 photos. The first photo should be the clearest face reference.")
    } else if (acceptedFiles.length > 0) {
      setPhotoUploadMessage("Photo added. Make sure the first image is the clearest face photo for skin tone and likeness.")
    }

    event.target.value = ""
  }

  const removeUploadedImage = (imageIndex: number) => {
    setUploadedPhotos((currentPhotos) => {
      const photoToRemove = currentPhotos[imageIndex]
      if (photoToRemove?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoToRemove.previewUrl)
      }

      return currentPhotos.filter((_, index) => index !== imageIndex)
    })
    setPhotoUploadMessage(imageIndex === 0 ? "Main face match removed. Add the clearest front-facing photo first." : "Photo removed.")
  }

  const clearUploadedImages = () => {
    uploadedPhotos.forEach((photo) => {
      if (photo.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photo.previewUrl)
      }
    })
    setUploadedPhotos([])
    setPhotoUploadMessage("Photos cleared. Add the clearest face photo first.")
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get("checkout") === "cancelled") {
      const orderId = params.get("orderId")
      const cancelPath = orderId ? `/checkout/cancel?orderId=${encodeURIComponent(orderId)}` : "/checkout/cancel"
      window.location.replace(cancelPath)
    }
  }, [])

  useEffect(() => {
    const resetPreparingState = () => setIsPreparingCheckout(false)

    window.addEventListener("pageshow", resetPreparingState)
    document.addEventListener("visibilitychange", resetPreparingState)

    return () => {
      window.removeEventListener("pageshow", resetPreparingState)
      document.removeEventListener("visibilitychange", resetPreparingState)
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentStep])

  const renderWelcome = () => (
    <section className="relative isolate flex min-h-[calc(100svh-4.25rem)] items-start justify-center overflow-hidden rounded-[1.5rem] border border-white/80 bg-[#fff7ff] px-3 py-3 text-center shadow-[0_24px_80px_rgba(172,122,218,0.18)] min-[390px]:py-4 sm:min-h-full sm:items-center sm:rounded-[2rem] sm:px-8 lg:py-5">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#fffaff_0%,#f3ecff_42%,#e7f8ff_74%,#fff7d7_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-[radial-gradient(ellipse_at_center,rgba(255,221,117,0.58)_0%,rgba(255,221,117,0.28)_36%,transparent_68%)]" />
      <div className="absolute inset-0 -z-10 opacity-80 [background-image:radial-gradient(circle_at_10%_18%,rgba(255,198,229,0.95)_0_4px,transparent_5px),radial-gradient(circle_at_24%_72%,rgba(255,226,121,0.9)_0_3px,transparent_4px),radial-gradient(circle_at_82%_20%,rgba(153,213,255,0.95)_0_4px,transparent_5px),radial-gradient(circle_at_88%_68%,rgba(198,178,255,0.95)_0_3px,transparent_4px)]" />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold text-fuchsia-700 shadow-sm ring-1 ring-fuchsia-100 min-[390px]:px-4 min-[390px]:py-2 sm:mb-3 sm:text-sm">
          <Sparkles className="h-4 w-4 text-amber-400" />
          A story where your child is the hero
        </div>

        <div className="relative mb-2 w-full max-w-lg sm:mb-4">
          <div className="absolute inset-x-8 bottom-0 h-16 rounded-full bg-fuchsia-200/50 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-[0_22px_65px_rgba(169,113,219,0.26)]">
            <img
              src="/little-legends-reading-hero-family.png"
              alt="A family reading a magical storybook where the child becomes the hero"
              className="h-[clamp(8rem,27svh,10.5rem)] w-full object-cover object-center min-[390px]:h-[clamp(9rem,28svh,12rem)] sm:h-52 lg:h-60 xl:h-64"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_58%,rgba(255,255,255,0.82)_100%)]" />
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-fuchsia-700 shadow-md">
              <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />
              Your child becomes the hero
            </div>
          </div>
          <span className="absolute -left-2 top-5 hidden text-3xl sm:block sm:text-4xl">⭐</span>
          <span className="absolute -right-1 top-10 hidden text-2xl sm:block sm:text-3xl">🌙</span>
          <span className="absolute bottom-5 right-7 hidden text-3xl sm:block sm:text-4xl">✨</span>
        </div>

        <h1 className="flex max-w-4xl items-center justify-center gap-2 text-balance text-[2.35rem] font-black leading-[0.95] text-[#6d35c4] min-[390px]:text-[2.8rem] sm:gap-3 sm:text-6xl lg:text-7xl xl:text-8xl">
          <Heart className="h-7 w-7 shrink-0 fill-rose-400 text-rose-400 drop-shadow-sm min-[390px]:h-8 min-[390px]:w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16" />
          Little Legends
        </h1>

        <p className="mt-1.5 max-w-2xl text-pretty text-sm font-semibold leading-5 text-[#6e5b85] min-[390px]:text-base min-[390px]:leading-6 sm:mt-3 sm:text-xl sm:leading-7 lg:text-2xl">
          Make a magical adventure starring your child, their photos, and the hero they dream of becoming.
        </p>

        <Button
          onClick={() => setCurrentStep("gender")}
          className="mt-3 h-11 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-7 text-sm font-black text-white shadow-[0_18px_42px_rgba(158,91,214,0.34)] transition-all hover:-translate-y-1 hover:from-fuchsia-600 hover:via-violet-600 hover:to-sky-600 min-[390px]:h-12 min-[390px]:px-8 min-[390px]:text-base sm:mt-5 sm:h-14 sm:px-12 sm:text-lg"
        >
          <Wand2 className="h-5 w-5 sm:h-6 sm:w-6" />
          Start the Magic
        </Button>

        <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[11px] font-bold text-[#7a6692] min-[390px]:mt-3 sm:mt-4 sm:gap-3 sm:text-sm">
          <span className="rounded-full bg-white/75 px-3 py-1.5 shadow-sm sm:px-4 sm:py-2">Choose a hero name</span>
          <span className="rounded-full bg-white/75 px-3 py-1.5 shadow-sm sm:px-4 sm:py-2">Add photos</span>
          <span className="rounded-full bg-white/75 px-3 py-1.5 shadow-sm sm:px-4 sm:py-2">Create a story</span>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-[11px] font-black text-sky-700 sm:text-sm">
          <a href="/contact" className="underline-offset-4 hover:underline">Contact</a>
          <a href="/privacy" className="underline-offset-4 hover:underline">Privacy</a>
          <a href="/terms" className="underline-offset-4 hover:underline">Terms</a>
        </div>
      </div>
    </section>
  )

  const renderGenderSelection = () => (
    <div className="mx-auto max-w-4xl space-y-4 text-center sm:space-y-7">
      <div className="space-y-2 sm:space-y-3">
        <Badge className="bg-amber-300 px-3 py-1 text-sky-950">Step 1 of 5</Badge>
        <h2 className="text-3xl font-black leading-tight text-sky-950 sm:text-5xl">Who is becoming the hero?</h2>
        <p className="mx-auto max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-lg sm:leading-7">
          A quick start so the preview feels personal from the first page.
        </p>
        <p className="mx-auto inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-wide text-teal-700 shadow-sm">
          Takes about a minute
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Card
          className={`storybook-focus cursor-pointer border-4 p-4 shadow-[8px_8px_0_rgba(8,47,73,0.12)] sm:p-6 ${selectedGender === "boy" ? "border-sky-950 bg-sky-50 ring-4 ring-amber-200" : "border-white bg-white/90"}`}
          onClick={() => setSelectedGender("boy")}
        >
          <div className="space-y-2 text-center sm:space-y-4">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sky-100 text-sky-700 ring-4 ring-white sm:h-18 sm:w-18">
              <User className="h-7 w-7 sm:h-9 sm:w-9" />
            </div>
            <p className="text-xl font-black text-sky-950 sm:text-2xl">A boy</p>
            <p className="text-sm font-semibold leading-6 text-slate-600">Build a brave, magical story around him.</p>
          </div>
        </Card>
        <Card
          className={`storybook-focus cursor-pointer border-4 p-4 shadow-[8px_8px_0_rgba(8,47,73,0.12)] sm:p-6 ${selectedGender === "girl" ? "border-sky-950 bg-rose-50 ring-4 ring-amber-200" : "border-white bg-white/90"}`}
          onClick={() => setSelectedGender("girl")}
        >
          <div className="space-y-2 text-center sm:space-y-4">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-600 ring-4 ring-white sm:h-18 sm:w-18">
              <Heart className="h-7 w-7 fill-rose-300 sm:h-9 sm:w-9" />
            </div>
            <p className="text-xl font-black text-sky-950 sm:text-2xl">A girl</p>
            <p className="text-sm font-semibold leading-6 text-slate-600">Build a brave, magical story around her.</p>
          </div>
        </Card>
      </div>
      {selectedGender && (
        <Button
          onClick={() => setCurrentStep("name")}
          className="h-12 w-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 px-8 text-base font-black text-white shadow-[0_14px_32px_rgba(14,165,233,0.22)] hover:from-emerald-600 hover:to-sky-600 sm:h-13 sm:w-auto sm:text-lg"
        >
          Continue to hero name
        </Button>
      )}
    </div>
  )

  const renderNameSelectionOld = () => {
    // Search functionality
    const getFilteredNames = () => {
      if (!nameSearchTerm) return displayedNames

      return allLegendNames.filter(
        (name) =>
          (name.gender === selectedGender || name.gender === "any") &&
          (name.name.toLowerCase().includes(nameSearchTerm.toLowerCase()) ||
            name.category.toLowerCase().includes(nameSearchTerm.toLowerCase())),
      )
    }

    const randomizeNames = () => {
      const genderFilteredNames = allLegendNames.filter(
        (name) => name.gender === selectedGender || name.gender === "any",
      )
      const shuffled = [...genderFilteredNames].sort(() => Math.random() - 0.5)
      setDisplayedNames(shuffled.slice(0, 12))
    }

    return (
      <div className={`text-center space-y-8 max-w-4xl mx-auto ${selectedLegendName ? "pb-28" : ""}`}>
        <h2 className="text-4xl font-bold text-gray-800">Choose Your Legend Name!</h2>
        <p className="text-lg text-gray-600">Pick from our magical suggestions or create your own!</p>

        {/* Real Name Input */}
        <Card className="p-6 space-y-4">
          <div className="space-y-4">
            <Label htmlFor="childName" className="text-lg font-medium text-gray-700">
              Child's Real Name (Optional)
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="childName"
                type="text"
                placeholder="Enter their real name..."
                className="pl-12 text-lg py-3"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
            </div>

            {childName.trim() && (
              <Card
                className={`p-4 cursor-pointer transition-all ${useRealName ? "ring-4 ring-green-500 bg-green-50" : "hover:shadow-md hover:bg-gray-50"}`}
                onClick={() => {
                  setUseRealName(true)
                  setSelectedLegendName(childName.trim())
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Use "{childName.trim()}" as hero name</span>
                  <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">Real Name</span>
                </div>
              </Card>
            )}
          </div>
        </Card>

        {/* Legend Name Suggestions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-yellow-500" />
              Legend Name Suggestions
            </h3>
            <Button
              onClick={randomizeNames}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Wand2 className="w-4 h-4" />
              <span>New Names</span>
            </Button>
          </div>

          {/* Search */}
          <Card className="p-4 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search legend names..."
                className="pl-10"
                value={nameSearchTerm}
                onChange={(e) => setNameSearchTerm(e.target.value)}
              />
            </div>
          </Card>

          {/* Name Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {getFilteredNames().map((legendName, index) => (
              <Card
                key={index}
                className={`p-4 cursor-pointer transform hover:scale-105 transition-all ${
                  selectedLegendName === legendName.name && !useRealName
                    ? "ring-4 ring-purple-500 bg-purple-50"
                    : "hover:shadow-lg"
                }`}
                onClick={() => {
                  setSelectedLegendName(legendName.name)
                  setUseRealName(false)
                }}
              >
                <div className="text-center space-y-2">
                  <p className="text-lg font-bold text-gray-700">{legendName.name}</p>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      legendName.category === "magical"
                        ? "bg-pink-100 text-pink-700"
                        : legendName.category === "powerful"
                          ? "bg-red-100 text-red-700"
                          : legendName.category === "adventure"
                            ? "bg-blue-100 text-blue-700"
                            : legendName.category === "modern"
                              ? "bg-purple-100 text-purple-700"
                              : legendName.category === "nature"
                                ? "bg-green-100 text-green-700"
                                : legendName.category === "friendly"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {legendName.category}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {getFilteredNames().length === 0 && nameSearchTerm && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No legend names found matching "{nameSearchTerm}"</p>
            <Button onClick={() => setNameSearchTerm("")} variant="outline" className="mt-4">
              Clear Search
            </Button>
          </Card>
        )}

        {/* Custom Name Input */}
        <Card className="p-6 space-y-4 bg-gradient-to-r from-yellow-50 to-orange-50">
          <h4 className="text-xl font-bold text-gray-800">Create Your Own Legend Name</h4>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Type your custom legend name..."
              className="text-lg py-3"
              value={customLegendName}
              onChange={(e) => {
                setCustomLegendName(e.target.value)
                setSelectedLegendName(e.target.value)
                setUseRealName(false)
              }}
            />
            {customLegendName && (
              <p className="text-sm text-gray-600">Perfect! Your hero will be called "{customLegendName}"</p>
            )}
          </div>
        </Card>

        {selectedLegendName && (
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
              <p className="text-xl">
                <span className="font-medium">Your hero will be called:</span>{" "}
                <span className="font-bold text-purple-600 text-2xl">{selectedLegendName}</span>
              </p>
            </Card>

            <Button
              onClick={() => setCurrentStep("upload")}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xl px-8 py-4 rounded-full"
            >
              Perfect! Let's Add Photos 📸
            </Button>
          </div>
        )}
      </div>
    )
  }

  const renderNameSelection = () => {
    const heroNameBase = childName.trim()
    const allGeneratedNames = heroNameBase && selectedGender ? generateLegendNames(heroNameBase, selectedGender) : []
    const nameBatchSize = 6
    const generatedNames = allGeneratedNames.slice(nameBatchIndex * nameBatchSize, nameBatchIndex * nameBatchSize + nameBatchSize)
    const maxNameBatch = Math.max(1, Math.ceil(allGeneratedNames.length / nameBatchSize))

    return (
      <div className={`mx-auto max-w-4xl space-y-6 text-center sm:space-y-8 ${selectedLegendName ? "pb-28 sm:pb-24" : ""}`}>
        <div className="mx-auto grid max-w-4xl items-center gap-4 md:grid-cols-[1fr_230px] sm:gap-6">
          <div className="space-y-2 sm:space-y-3 md:text-left">
            <Badge className="bg-amber-300 px-3 py-1 text-sky-950">Step 2 of 5</Badge>
            <h2 className="pb-1 text-3xl font-black leading-tight bg-gradient-to-r from-rose-500 via-amber-500 to-sky-500 bg-clip-text text-transparent sm:pb-2 sm:text-5xl">
              Name Your Little Legend
            </h2>
            <p className="text-sm font-semibold leading-6 text-sky-800 sm:text-lg">
              Enter their name, then choose one simple hero name to carry into the story.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-[230px] overflow-hidden rounded-3xl border-4 border-white bg-white shadow-[0_16px_40px_rgba(61,160,190,0.18)]">
            <img
              src="/superhero-name-kids.png"
              alt="A boy and girl superhero ready for a magical adventure"
              className="h-28 w-full object-cover sm:h-36"
            />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-black text-teal-700 shadow-sm">
              Choose their power name
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-0 bg-gradient-to-br from-white via-amber-50 to-sky-50 p-4 shadow-[0_18px_55px_rgba(61,160,190,0.14)] sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <Label htmlFor="childName" className="text-base font-black text-teal-700 sm:text-lg">
              Child's first name
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rose-500" />
              <Input
                id="childName"
                type="text"
                placeholder="e.g. Aidan"
                className="h-12 rounded-2xl border-sky-100 bg-white pl-12 text-center text-lg font-bold text-sky-900 shadow-sm placeholder:text-sky-300 sm:h-14 sm:text-left sm:text-xl"
                value={childName}
                onChange={(e) => {
                  setChildName(e.target.value)
                  setSelectedLegendName("")
                  setCustomLegendName("")
                  setUseRealName(false)
                  setNameBatchIndex(0)
                }}
              />
            </div>
            {!heroNameBase && (
              <p className="text-sm font-semibold text-teal-600">
                Your personalised name ideas will appear below.
              </p>
            )}
          </div>
        </Card>

        {heroNameBase && (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <h3 className="flex items-center text-xl font-black text-teal-800 sm:text-2xl">
                <Sparkles className="mr-2 h-6 w-6 text-amber-400" />
                Pick one for {heroNameBase}
              </h3>
              <Button
                onClick={() => {
                  setNameBatchIndex((current) => (current + 1) % maxNameBatch)
                  setSelectedLegendName("")
                  setCustomLegendName("")
                }}
                variant="outline"
                className="rounded-full border-sky-200 bg-white px-5 font-black text-sky-700 shadow-sm hover:bg-sky-50"
              >
                <Wand2 className="h-4 w-4" />
                More names
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {generatedNames.map((legendName) => (
                <Card
                  key={legendName}
                  className={`cursor-pointer border-2 p-4 transition-all hover:-translate-y-1 hover:shadow-xl ${
                    selectedLegendName === legendName && !customLegendName
                      ? "border-rose-400 bg-amber-50 ring-4 ring-amber-100"
                      : "border-white bg-white/90"
                  }`}
                  onClick={() => {
                    setSelectedLegendName(legendName)
                    setCustomLegendName("")
                    setUseRealName(false)
                  }}
                >
                  <div className="text-center">
                    <p className="text-lg font-black text-sky-900">{legendName}</p>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="border-0 bg-gradient-to-r from-amber-50 via-pink-50 to-sky-50 p-6 shadow-sm">
              <h4 className="text-xl font-black text-teal-800">Or create your own superhero name</h4>
              <div className="mt-4 space-y-3">
                <Input
                  type="text"
                  placeholder={`e.g. ${heroNameBase} Star Shield`}
                  className="h-12 rounded-2xl border-sky-100 bg-white text-center text-lg font-bold text-sky-900 placeholder:text-sky-300"
                  value={customLegendName}
                  onChange={(e) => {
                    setCustomLegendName(e.target.value)
                    setSelectedLegendName(e.target.value.trim())
                    setUseRealName(false)
                  }}
                />
                {customLegendName && (
                  <p className="text-sm font-semibold text-teal-700">
                    Perfect. Your hero will be called "{customLegendName}".
                  </p>
                )}
              </div>
            </Card>

            {selectedLegendName && (
              <div className="space-y-4">
                <Card className="border-0 bg-white/90 p-6 shadow-[0_12px_35px_rgba(61,160,190,0.14)]">
                  <p className="text-lg text-teal-800 sm:text-xl">
                    <span className="font-bold">Your hero will be called:</span>{" "}
                    <span className="font-black text-rose-600 text-xl sm:text-2xl">{selectedLegendName}</span>
                  </p>
                </Card>
              </div>
            )}
          </div>
        )}

        {selectedLegendName && (
          <div className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-sky-950 bg-white/95 px-4 py-3 shadow-[0_-14px_35px_rgba(8,47,73,0.18)] backdrop-blur">
            <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="text-center sm:text-left">
                <p className="text-xs font-black uppercase tracking-widest text-teal-700">Hero name selected</p>
                <p className="text-lg font-black text-sky-950">{selectedLegendName}</p>
              </div>
              <Button
                onClick={() => setCurrentStep("upload")}
                className="h-12 w-full rounded-full bg-gradient-to-r from-green-500 to-sky-500 px-8 text-base font-black text-white hover:from-green-600 hover:to-sky-600 sm:w-auto"
              >
                Continue to photos
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderUpload = () => (
    <div className={`space-y-6 text-center sm:space-y-8 ${uploadedPhotos.length > 0 ? "pb-28 sm:pb-24" : ""}`}>
      <div className="space-y-2 sm:space-y-3">
        <Badge className="bg-amber-300 px-3 py-1 text-sky-950">Step 3 of 5</Badge>
        <h2 className="text-3xl font-black leading-tight text-sky-950 sm:text-5xl">Add photos for {selectedLegendName}</h2>
        <p className="mx-auto max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-lg sm:leading-7">
          Add a clear face photo for the final artwork, or continue without one and keep the story moving.
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <button
          type="button"
          className="inline-flex min-h-13 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-8 text-base font-black text-white shadow-[0_14px_32px_rgba(244,114,182,0.22)] transition hover:-translate-y-0.5 hover:from-rose-600 hover:to-amber-600 sm:min-h-14 sm:text-lg"
          onClick={() => document.getElementById("image-upload")?.click()}
        >
          <Camera className="mr-2 h-5 w-5" />
          Upload Photos
        </button>
        <p className="text-sm font-semibold text-slate-600">
          {uploadedPhotos.length > 0 ? `${uploadedPhotos.length} of 3 photos selected for reference` : "Add the clearest face photo first."}
        </p>
        {uploadedPhotos.length === 0 && (
          <Button
            type="button"
            onClick={() => setCurrentStep("character")}
            variant="outline"
            className="h-11 rounded-full border-sky-200 bg-white px-6 font-black text-sky-700 hover:bg-sky-50"
          >
            Continue without photos
          </Button>
        )}
      </div>

      <Card className="mx-auto max-w-3xl border-0 bg-white/90 p-4 text-left shadow-[0_12px_35px_rgba(61,160,190,0.14)] sm:p-5">
        <div className="mb-3 rounded-2xl border-2 border-emerald-100 bg-emerald-50 px-4 py-3 sm:mb-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-black text-emerald-900">Used for their illustrated character</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-emerald-800">
                Photos help us create a warm storybook likeness and are stored privately with your order for artwork reference.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            "Front-facing face",
            "Bright natural light",
            "Clear hair and face",
          ].map((tip) => (
            <div key={tip} className="flex items-center gap-3 rounded-2xl bg-sky-50 px-4 py-2.5 sm:py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              <span className="text-sm font-black text-sky-900">{tip}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="mx-auto grid max-w-md grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((index) => (
          <div key={index} className="relative">
            {uploadedPhotos[index - 1] ? (
              <>
                <img
                  src={uploadedPhotos[index - 1]?.previewUrl || "/placeholder.svg"}
                  alt={`Upload ${index}`}
                  className="h-28 w-full rounded-2xl border-4 border-emerald-500 object-cover shadow-sm sm:h-32"
                />
                <button
                  type="button"
                  onClick={() => removeUploadedImage(index - 1)}
                  className="absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-white text-rose-600 shadow-md ring-2 ring-rose-100 transition hover:bg-rose-50"
                  aria-label={`Remove photo ${index}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => document.getElementById("image-upload")?.click()}
                className="flex h-28 w-full items-center justify-center rounded-2xl border-4 border-dashed border-sky-200 bg-white/80 transition hover:border-sky-400 hover:bg-sky-50 sm:h-32"
                aria-label={`Upload photo ${index}`}
              >
                <Upload className="w-8 h-8 text-gray-400" />
              </button>
            )}
            <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-sm font-black text-white shadow-sm">
              {index}
            </div>
            {index === 1 && (
              <div className="absolute inset-x-2 bottom-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-sky-900 shadow-sm">
                Main face match
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {photoUploadMessage && (
          <p className="mx-auto max-w-md rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {photoUploadMessage}
          </p>
        )}
        {uploadedPhotos.length > 0 && (
          <Button
            type="button"
            onClick={clearUploadedImages}
            variant="outline"
            className="rounded-full border-rose-100 bg-white px-5 font-black text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear photos
          </Button>
        )}
      </div>

      {uploadedPhotos.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-sky-950 bg-white/95 px-4 py-3 shadow-[0_-14px_35px_rgba(8,47,73,0.18)] backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-xs font-black uppercase tracking-widest text-teal-700">Photos selected</p>
              <p className="text-lg font-black text-sky-950">
                {uploadedPhotos.length} of 3 photo{uploadedPhotos.length === 1 ? "" : "s"} selected
              </p>
            </div>
            <Button
              onClick={() => setCurrentStep("character")}
              className="h-12 w-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 px-8 text-base font-black text-white hover:from-emerald-600 hover:to-sky-600 sm:w-auto"
            >
              Choose Hero Type
            </Button>
          </div>
        </div>
      )}

      {uploadedPhotos.length === 0 && (
        <Card className="mx-auto max-w-xl border-2 border-sky-100 bg-white/85 px-4 py-3 text-left shadow-sm">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
            <p className="text-sm font-semibold leading-6 text-slate-700">
              No photo ready? That is fine. You can preview the story now and add reference photos before final artwork production.
            </p>
          </div>
        </Card>
      )}
    </div>
  )

  const renderCharacterSelection = () => (
    <div className="space-y-5 text-center sm:space-y-7">
      <div className="space-y-2 sm:space-y-3">
        <Badge className="bg-amber-300 px-3 py-1 text-sky-950">Step 4 of 5</Badge>
        <h2 className="text-3xl font-black leading-tight text-sky-950 sm:text-5xl">What kind of hero will {selectedLegendName} be?</h2>
        <p className="mx-auto max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-lg sm:leading-7">
          Start with a favourite below, or search if they already know the adventure they want.
        </p>
      </div>

      <Card className="mx-auto max-w-md border-0 bg-white/90 p-3 shadow-[0_12px_35px_rgba(61,160,190,0.12)] sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search hero worlds..."
            className="h-12 rounded-2xl border-sky-100 bg-white pl-10 font-semibold text-sky-900 placeholder:text-sky-300"
            value={characterSearchTerm}
            onChange={(e) => setCharacterSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {!characterSearchTerm && (
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            onClick={() => {
              setCharacterBatchIndex((current) => (current - 1 + maxCharacterBatch) % maxCharacterBatch)
              setSelectedCharacter(null)
            }}
            variant="outline"
            className="h-11 w-full rounded-full border-sky-200 bg-white px-6 font-black text-sky-700 shadow-sm hover:bg-sky-50 sm:w-auto"
          >
            Previous
          </Button>
          <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-black text-sky-900 shadow-sm">
            Favourites {characterBatchIndex + 1} of {maxCharacterBatch}
          </div>
          <Button
            onClick={() => {
              setCharacterBatchIndex((current) => (current + 1) % maxCharacterBatch)
              setSelectedCharacter(null)
            }}
            variant="outline"
            className="h-11 w-full rounded-full border-sky-200 bg-white px-6 font-black text-sky-700 shadow-sm hover:bg-sky-50 sm:w-auto"
          >
            More worlds
          </Button>
        </div>
      )}

      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3">
        {getFilteredCharacters().map((character) => (
          <Card
            key={character.id}
            className={`storybook-focus cursor-pointer border-4 p-3 shadow-[6px_6px_0_rgba(8,47,73,0.11)] sm:p-5 ${selectedCharacter === character.id ? "border-sky-950 bg-amber-50 ring-4 ring-amber-100" : "border-white bg-white/90"}`}
            onClick={() => handleCharacterSelection(character.id)}
          >
            <div className="space-y-2 text-center sm:space-y-3">
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border-4 border-sky-950 bg-[#fffdf5] text-lg font-black text-sky-950 shadow-[4px_4px_0_rgba(8,47,73,0.12)] ring-4 ring-white sm:h-20 sm:w-20 sm:text-3xl">
                <span className={`absolute inset-x-2 bottom-1 h-2 rounded-full ${character.color}`} aria-hidden="true" />
                <span className="relative drop-shadow-sm">{getHeroInitials(character.name)}</span>
              </div>
              <p className="min-h-10 text-sm font-black leading-tight text-sky-950 sm:text-xl">{character.name}</p>
              <Badge variant="secondary" className="text-xs capitalize">
                {priorityHeroIds.has(character.id) ? "Recommended" : character.category}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {getFilteredCharacters().length === 0 && characterSearchTerm && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No characters found matching "{characterSearchTerm}"</p>
          <Button onClick={() => setCharacterSearchTerm("")} variant="outline" className="mt-4">
            Clear Search
          </Button>
        </Card>
      )}
    </div>
  )

  const renderStoryOld = () => {
    const characterData = allCharacters.find((char) => char.id === selectedCharacter)

    // Story templates based on character type
    const storyTemplates = {
      1: {
        title: "The Magical Portal Adventure",
        pages: [
          {
            text: `${selectedLegendName} discovers a shimmering portal in their back garden that leads to a magical world where ${characterData?.name.toLowerCase()}s are the greatest heroes!`,
            choices: [
              { text: "🌟 Enter the magical world immediately", next: 2 },
              { text: "🔍 Investigate the portal first", next: 3 },
            ],
          },
          {
            text: `In the magical world, ${selectedLegendName} meets a friendly creature who explains that the kingdom needs a brave ${characterData?.name.toLowerCase()} to save the Crystal of Happiness!`,
            choices: [
              { text: "⚔️ Accept the quest immediately", next: 4 },
              { text: "🤝 Ask for more help from friends", next: 5 },
            ],
          },
          // Add more story pages...
        ],
      },
      // Add more story templates...
    }

    const bitcoinStory = {
      title: "The Bitcoin Beacon",
      pages: [
        {
          text: `${selectedLegendName} discovers a glowing orange Bitcoin beacon above Pocket Town. The town needs a brave Bitcoin Hero to help families save, plan, and understand the magic blocks before their dream jars run empty.`,
          choices: [
            { text: "Follow the Bitcoin Beacon", next: 2 },
            { text: "Open the saver wallet map", next: 3 },
          ],
        },
        {
          text: `${selectedLegendName} races across the blockchain bridge in an orange Bitcoin suit, learning that clear records, patient saving, and careful choices can help people all around the world.`,
          choices: [
            { text: "Use the Lightning shield", next: 4 },
            { text: "Teach the saver crew", next: 5 },
          ],
        },
      ],
    }

    const currentStory = selectedCharacter === "bitcoin-hero" ? bitcoinStory : storyTemplates[1]
    const currentPage = currentStory.pages[storyPage - 1]

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {selectedLegendName} the {characterData?.name}'s Adventure!
          </h2>
          <p className="text-lg text-gray-600">Page {storyPage} of 8</p>
          <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(storyPage / 8) * 100}%` }}
            ></div>
          </div>
        </div>

        <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="w-full h-64 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">{characterData?.emoji}</div>
                    <p className="text-lg font-bold text-gray-700">
                      {selectedLegendName} the {characterData?.name}!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{currentStory.title}</h3>
                <p className="text-lg text-gray-700 leading-relaxed">{currentPage?.text}</p>
              </div>

              {currentPage?.choices && (
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-gray-800">What does {selectedLegendName} do?</h4>
                  <div className="space-y-3">
                    {currentPage.choices.map((choice, index) => (
                      <Button
                        key={index}
                        onClick={() => setStoryPage(choice.next)}
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-lg py-4 rounded-lg"
                      >
                        {choice.text}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {storyPage >= 8 && (
          <Card className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50 text-center">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              🎉 {selectedLegendName} the {characterData?.name}'s Adventure Complete! 🎉
            </h3>
            <p className="text-lg text-gray-700 mb-6">Your amazing personalised story is ready to download!</p>
            <div className="space-y-4">
              <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xl px-8 py-4 rounded-full">
                📱 Download Digital Comic (£4.99)
              </Button>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xl px-8 py-4 rounded-full">
                📚 Order Printed Book (£14.99)
              </Button>
            </div>
          </Card>
        )}
      </div>
    )
  }

  const renderStoryLegacy = () => {
    const characterData = allCharacters.find((char) => char.id === selectedCharacter)
    const heroType = characterData?.name || "Hero"
    const heroMark = getHeroInitials(characterData?.name || heroType)
    const heroName = selectedLegendName || "Little Legend"
    const storyThemes = {
      "bitcoin-hero": {
        title: `${heroName} and the Bitcoin Beacon`,
        signal: "a golden Bitcoin beacon flashes above Pocket Town",
        travel: "races across a glowing blockchain bridge",
        place: "Twenty-One Million Mountain",
        problem: "the Spendy Glitch is rushing everyone to spend before they learn how saving works",
        helper: "a worried little wallet-bot",
        tool: "the Bitcoin shield",
        cleverFix: "checks the blocks, protects the saver keys, and explains the twenty-one million rule",
        caringFix: "helps families send value safely and save for their dream jars",
        final: "the Bitcoin Beacon shines again, and everyone learns that Bitcoin is a tool for saving, helping, and careful learning",
      },
      footballer: {
        title: `${heroName} and the Friendship Final`,
        signal: "a silver football shoots across the sky above Wonder Stadium",
        travel: "sprints down the glowing touchline as the crowd chants with hope",
        place: "Wonder Stadium",
        problem: "the Grumble Goalie has stolen the team spirit and hidden every smile in the trophy net",
        helper: "a nervous teammate with muddy boots",
        tool: "the rainbow captain's armband",
        cleverFix: "sets up the perfect pass so every teammate gets a moment to shine",
        caringFix: "helps the Grumble Goalie join the team instead of feeling alone",
        final: "the final whistle blows, and the stadium learns that great players lift the whole team",
      },
      wizard: {
        title: `${heroName} and the Kind Spell`,
        signal: "a runaway spellbook flutters above Moonbeam Library",
        travel: "rides a trail of glittering letters through the starry shelves",
        place: "Moonbeam Library",
        problem: "the Tangle Spell has muddled every magic word into a silly soup",
        helper: "a shy baby dragon with smoky sneezes",
        tool: "the kindness wand",
        cleverFix: "puts the magic words back in order with a rhyme of courage",
        caringFix: "teaches the Tangle Spell a gentle spell for making friends",
        final: "the library glows, and everyone learns that the strongest magic is patient and kind",
      },
      fairy: {
        title: `${heroName} and the Glow Garden`,
        signal: "the glow flowers blink for help across Fairy Meadow",
        travel: "twirls through moonlit petals on sparkling wings",
        place: "Fairy Meadow",
        problem: "the Dull Dust has made every flower forget its colour",
        helper: "a tiny bee wearing a brave little backpack",
        tool: "the sparkle seed pouch",
        cleverFix: "plants sparkle seeds in a rainbow pattern that wakes the garden",
        caringFix: "comforts the Dull Dust until it becomes gentle silver glitter",
        final: "the garden blooms brighter than ever, and every creature shares its colour",
      },
      astronaut: {
        title: `${heroName} and the Star Rescue`,
        signal: "a lonely star blinks SOS from the edge of the moon",
        travel: "rockets through candy-coloured space with comet trails behind",
        place: "Moonbase Kindness",
        problem: "the Wobble Meteor has knocked the moonbeams out of line",
        helper: "a homesick moon robot",
        tool: "the gravity boots",
        cleverFix: "bounces from crater to crater to realign the moonbeam path",
        caringFix: "invites the Wobble Meteor to become the moon's night-light",
        final: "the stars shine in neat rows, and space feels friendly again",
      },
      default: {
        title: `${heroName} and the Kindness Comet`,
        signal: "a rainbow comet zooms over Story City",
        travel: "races across rooftops as moonbeams light the way",
        place: "Giggle Fountain",
        problem: `the Grumble Cloud has swallowed every giggle and needs a brave ${heroType}`,
        helper: "a worried child holding a crumpled map",
        tool: "the kindness torch",
        cleverFix: "reflects the comet light through the fountain like a rainbow mirror",
        caringFix: "offers a hand instead of a shout",
        final: "the Kindness Comet bursts into stars, and every star carries a caring wish",
      },
    }
    const categoryThemes = {
      action: {
        title: `${heroName} and the Brave City Mission`,
        signal: `a superhero alarm flashes above Action Avenue`,
        travel: "swings past rooftops and glowing billboards",
        place: "Action Avenue",
        problem: "the Panic Puffs have made everyone rush so fast they forget to help each other",
        helper: "a tiny sidekick with a tangled cape",
        tool: "the courage communicator",
        cleverFix: "spots the safest route and guides everyone step by step",
        caringFix: "slows the crowd with calm words and a helpful hand",
        final: "Action Avenue cheers because real bravery means keeping others safe",
      },
      fantasy: {
        title: `${heroName} and the Enchanted Kingdom`,
        signal: `a castle of starlight appears beyond the clouds`,
        travel: "rides a ribbon of magic through the enchanted sky",
        place: "Starlight Castle",
        problem: "the mixed-up magic has hidden every royal wish in floating bubbles",
        helper: "a shy little dragon with sparkly hiccups",
        tool: "the wish compass",
        cleverFix: "matches each wish bubble to the heart that made it",
        caringFix: "helps the mixed-up magic feel welcome instead of wild",
        final: "the kingdom glows again, and everyone learns that magic works best with kindness",
      },
      animals: {
        title: `${heroName} and the Wild Rescue`,
        signal: `a paw-shaped cloud races above the jungle path`,
        travel: "dashes through leafy tunnels and sparkling streams",
        place: "Wonder Wildlife Park",
        problem: "the animals have lost their confidence before the Great Friendship Parade",
        helper: "a small lion cub trying very hard to be brave",
        tool: "the animal friendship badge",
        cleverFix: "follows pawprints to discover what each animal needs",
        caringFix: "encourages every animal with gentle words and patient listening",
        final: "the parade begins, and the park learns that every creature has its own kind of courage",
      },
      sports: {
        title: `${heroName} and the Team Spirit Trophy`,
        signal: `a glowing trophy spins above the stadium lights`,
        travel: "runs through the players' tunnel as the crowd claps a rhythm",
        place: "Wonder Stadium",
        problem: "the team spirit has vanished, and everyone is trying to win alone",
        helper: "a teammate who has forgotten how good they are",
        tool: "the captain's courage band",
        cleverFix: "creates a brilliant team play where every player gets involved",
        caringFix: "reminds the team that cheering each other on is a superpower",
        final: "the trophy shines for everyone, because the best champions lift the team",
      },
      creative: {
        title: `${heroName} and the Colour Splash Quest`,
        signal: `a paintbrush comet streaks across the art-room sky`,
        travel: "slides down a rainbow of music notes, paint swirls, and spotlights",
        place: "Imagination Theatre",
        problem: "the Blank Blob has turned every song, picture, and dance move quiet",
        helper: "a nervous performer hiding behind the curtain",
        tool: "the imagination spark",
        cleverFix: "mixes colours, sounds, and ideas into a brand-new masterpiece",
        caringFix: "helps the Blank Blob find its own special style",
        final: "the theatre bursts with creativity, and everyone learns their ideas matter",
      },
      adventure: {
        title: `${heroName} and the Treasure of Teamwork`,
        signal: `an ancient map glows with a trail of golden footprints`,
        travel: "crosses rope bridges, secret doors, and glittering caves",
        place: "Puzzle Peak",
        problem: "the treasure door will not open because everyone is pulling in different directions",
        helper: "a map keeper who feels too small to lead",
        tool: "the explorer's lantern",
        cleverFix: "solves the puzzle by noticing the tiny clue everyone missed",
        caringFix: "asks each helper to share one idea before choosing the path",
        final: "the treasure opens to reveal a message: every adventure is better together",
      },
      helper: {
        title: `${heroName} and the Helping Hands Day`,
        signal: `a heart-shaped beacon glows above Care Town`,
        travel: "hurries through friendly streets with a bag full of helpful tools",
        place: "Care Town",
        problem: "too many little problems have arrived at once, and everyone feels overwhelmed",
        helper: "a tired helper who needs help too",
        tool: "the kindness checklist",
        cleverFix: "sorts the problems into small steps that everyone can manage",
        caringFix: "makes sure the helpers rest, smile, and feel appreciated",
        final: "Care Town learns that helping works best when we care for each other too",
      },
      tech: {
        title: `${heroName} and the Future Fix`,
        signal: `a blinking robot star calls from Future Lab`,
        travel: "zooms through neon tunnels and friendly circuits",
        place: "Future Lab",
        problem: "the Mega Machine is confused and keeps mixing up every invention",
        helper: "a little robot with a flickering confidence light",
        tool: "the idea scanner",
        cleverFix: "debugs the machine one kind instruction at a time",
        caringFix: "teaches the robot that mistakes are how inventors learn",
        final: "Future Lab hums happily, and every invention is built to help someone",
      },
      racing: {
        title: `${heroName} and the Rainbow Race`,
        signal: `a checkered flag made of lightning waves over Speedy City`,
        travel: "zooms along a rainbow track with wind whooshing past",
        place: "Speedy City Circuit",
        problem: "the racers are going so fast they have forgotten fairness and fun",
        helper: "a nervous racer stuck at the starting line",
        tool: "the fair-play turbo badge",
        cleverFix: "finds the smoothest route that keeps everyone safe",
        caringFix: "slows down to help a racer finish with confidence",
        final: "the finish line glows, and everyone learns that a kind race is the best race",
      },
    }
    const theme =
      storyThemes[selectedCharacter as keyof typeof storyThemes] ||
      categoryThemes[characterData?.category as keyof typeof categoryThemes] ||
      storyThemes.default
    const storyTitle = theme.title

    const storyPages: Record<
      number,
      {
        kicker: string
        title: string
        scene: string
        panels: string[]
        speech: string[]
        sound?: string
        choices: { text: string; next?: number }[]
      }
    > = {
      1: {
        kicker: "Issue 1",
        title: "The Signal in the Sky",
        scene: theme.signal,
        panels: [
          `${heroName} spots the call for help just as the lights flicker and the room fills with golden sparks.`,
          `A deep rumble shakes the comic sky. The ${heroType} adventure begins before anyone else knows what is coming.`,
        ],
        speech: ["Something magical needs help!", "I feel scared... but I can still be brave."],
        sound: "KRA-KOOM!",
        choices: [
          { text: "Race toward the danger", next: 2 },
          { text: "Grab the kindness kit, then go", next: 2 },
        ],
      },
      2: {
        kicker: "Page 2",
        title: "Straight Into Action",
        scene: `${heroName} ${theme.travel}.`,
        panels: [
          `The world below cracks with bright comic lightning, but ${heroName} keeps moving forward.`,
          `At ${theme.place}, a crowd points toward the trouble. Someone whispers, "Only a true hero can fix this."`,
        ],
        speech: ["Hold on, everyone!", "I won't give up. Not when people need help."],
        sound: "ZAAAP!",
        choices: [
          { text: "Make a bold entrance", next: 11 },
          { text: "Quietly check everyone is safe", next: 11 },
        ],
      },
      3: {
        kicker: "Page 3",
        title: "The Kindness Kit",
        scene: `${heroName} packs stickers, snacks, brave words, and ${theme.tool}.`,
        panels: [
          `The hero kit glows brighter whenever someone thinks a caring thought.`,
          `A trail of sparkles points toward ${theme.place}.`,
        ],
        speech: ["Heroes help with heart first.", "Now I am ready!"],
        sound: "PING!",
        choices: [
          { text: "Follow the sparkle trail", next: 4 },
          { text: "Share a brave word first", next: 4 },
        ],
      },
      4: {
        kicker: "Page 4",
        title: `Trouble at ${theme.place}`,
        scene: theme.problem,
        panels: [
          `Everyone is safe, but nobody knows what to do next.`,
          `${heroName} notices the problem is scared, not mean.`,
        ],
        speech: ["Maybe it needs help too.", "Let's listen before we blast."],
        sound: "GASP!",
        choices: [
          { text: "Ask what happened", next: 5 },
          { text: "Make everyone feel safe first", next: 5 },
        ],
      },
      5: {
        kicker: "Page 5",
        title: "The Secret Worry",
        scene: `${theme.helper} explains that the trouble started from worry, not meanness.`,
        panels: [
          `${heroName} listens carefully without laughing or shouting.`,
          `The city lights begin to glow warm and gold.`,
        ],
        speech: ["Everyone makes mistakes.", "We can fix it together."],
        sound: "AWW!",
        choices: [
          { text: "Build a teamwork plan", next: 6 },
          { text: "Give the helper a confidence boost", next: 6 },
        ],
      },
      6: {
        kicker: "Page 6",
        title: "Safe and Steady",
        scene: `${heroName} creates a calm circle where everyone can breathe and think.`,
        panels: [
          `One deep breath turns into ten brave smiles.`,
          `The problem shrinks when nobody panics.`,
        ],
        speech: ["We are safe.", "Small steps can solve big problems."],
        sound: "SHHHH!",
        choices: [
          { text: "Invite everyone to help", next: 7 },
          { text: "Give everyone a tiny mission", next: 7 },
        ],
      },
      7: {
        kicker: "Page 7",
        title: "The Big Team-Up",
        scene: `${heroName} gives every helper a tiny mission at ${theme.place}.`,
        panels: [
          `One child holds the map. One watches the sky. One shares encouraging words.`,
          `${heroName} discovers the strongest power is helping others feel strong too.`,
        ],
        speech: ["Nobody has to be a hero alone.", "Teamwork, activate!"],
        sound: "KAPOW!",
        choices: [
          { text: "Use a brilliant rescue idea", next: 8 },
          { text: "Use a caring heart idea", next: 8 },
        ],
      },
      8: {
        kicker: "Page 8",
        title: "The Brilliant Rescue",
        scene: `${heroName} ${theme.cleverFix}.`,
        panels: [
          `The whole town cheers as the clever plan clicks into place.`,
          `The problem untangles with a shower of sparks.`,
        ],
        speech: ["Smart thinking saves the day!", "And kindness shows the way."],
        sound: "CLICK!",
        choices: [
          { text: "Add one more clever idea", next: 9 },
          { text: "Check how everyone feels", next: 9 },
        ],
      },
      9: {
        kicker: "Page 9",
        title: "The Caring Heart",
        scene: `${heroName} ${theme.caringFix}.`,
        panels: [
          `The frightened troublemaker smiles for the first time.`,
          `A caring promise becomes a bridge of light.`,
        ],
        speech: ["You can join us.", "Let's make things better together."],
        sound: "GLOW!",
        choices: [
          { text: "Celebrate together", next: 10 },
          { text: "Share the lesson with everyone", next: 10 },
        ],
      },
      10: {
        kicker: "Final Page",
        title: "A Legend Is Made",
        scene: theme.final,
        panels: [
          `${heroName} is cheered through the streets as a true ${heroType}.`,
          `The final lesson glows across the sky: brave hearts lift others up.`,
        ],
        speech: ["I did it with kindness.", "Every legend helps others shine."],
        sound: "TA-DA!",
        choices: [{ text: "Read the adventure again", next: 1 }],
      },
    }

    const currentPage = storyPages[storyPage] || storyPages[1]
    const isPreviewComplete = storyPage === 11
    const progress = isPreviewComplete ? 2 : Math.min(storyPage, 2)
    const heroPhoto = uploadedPhotos[0]?.previewUrl

    if (isPreviewComplete) {
      return (
        <div className="mx-auto max-w-5xl space-y-6">
          <Card className="overflow-hidden border-4 border-sky-950 bg-white shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="relative min-h-[360px] bg-[linear-gradient(135deg,#fde68a_0%,#fecdd3_48%,#bae6fd_100%)] p-6">
                <div className="absolute right-5 top-5 rotate-6 rounded-lg border-4 border-sky-950 bg-yellow-300 px-4 py-2 text-4xl font-black text-sky-950 shadow-[5px_5px_0_rgba(8,47,73,0.18)]">
                  TO BE CONTINUED!
                </div>
                <div className="grid h-full place-items-center pt-20 text-center">
                  <div>
                    <div className="mx-auto flex items-center justify-center gap-4">
                      {heroPhoto && (
                        <img
                          src={heroPhoto}
                          alt={`${heroName} photo`}
                          className="h-28 w-28 rotate-[-5deg] rounded-3xl border-4 border-white object-cover shadow-xl"
                        />
                      )}
                      <div className={`grid h-28 w-28 rotate-[5deg] place-items-center rounded-full ${characterData?.color || "bg-sky-400"} text-6xl shadow-xl ring-4 ring-white`}>
                        {heroMark}
                      </div>
                    </div>
                    <h2 className="mt-7 text-4xl font-black uppercase text-sky-950">Unlock the full comic adventure</h2>
                    <p className="mx-auto mt-4 max-w-md rounded-2xl border-4 border-sky-950 bg-white/90 px-5 py-4 text-lg font-bold leading-7 text-sky-900 shadow-[5px_5px_0_rgba(8,47,73,0.14)]">
                      The next pages reveal the dramatic challenge, the brave rescue, and the happy ending where {heroName} saves the day with courage and care.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 border-t-4 border-sky-950 bg-[#fffdf5] p-6 lg:border-l-4 lg:border-t-0">
                <div>
                  <Badge className="mb-3 bg-amber-300 px-3 py-1 text-sky-950">2-page preview complete</Badge>
                  <h3 className="text-3xl font-black text-sky-950">{storyTitle}</h3>
                  <p className="mt-2 text-base font-semibold leading-7 text-slate-700">
                    The full version continues as a personalised comic book with more pages, more choices, bigger pictures, and a warm positive ending.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="border-4 border-sky-950 bg-sky-50 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl border-4 border-sky-950 bg-white text-sky-600 shadow-[3px_3px_0_rgba(8,47,73,0.14)]">
                        <Download className="h-6 w-6" />
                      </div>
                      <h4 className="text-2xl font-black text-sky-950">Digital PDF</h4>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-700">Download the finished personalised comic.</p>
                    <p className="mt-4 text-3xl font-black text-rose-600">£4.99</p>
                    <p className="mt-1 text-sm font-black text-amber-700">Bitcoin Hero edition ready</p>
                    <Button className="mt-4 w-full rounded-xl bg-sky-500 font-black text-white hover:bg-sky-600">
                      Buy Digital
                    </Button>
                  </Card>

                  <Card className="border-4 border-sky-950 bg-amber-50 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl border-4 border-sky-950 bg-white text-amber-600 shadow-[3px_3px_0_rgba(8,47,73,0.14)]">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <h4 className="text-2xl font-black text-sky-950">Hardback Book</h4>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-700">A printed keepsake version for bedtime reading.</p>
                    <p className="mt-4 text-3xl font-black text-rose-600">£14.99</p>
                    <p className="mt-1 text-sm font-black text-amber-700">Printable Bitcoin Hero story</p>
                    <Button className="mt-4 w-full rounded-xl bg-rose-500 font-black text-white hover:bg-rose-600">
                      Order Hardback
                    </Button>
                  </Card>
                </div>

                <Card className="border-4 border-sky-950 bg-gradient-to-r from-orange-100 via-amber-50 to-yellow-100 p-5 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
                  <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <div className="flex items-center gap-4 text-left">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-sky-950 bg-orange-500 text-3xl font-black text-white shadow-[4px_4px_0_rgba(8,47,73,0.16)]">
                        ₿
                      </div>
                      <div>
                      <Badge className="mb-2 bg-orange-500 px-3 py-1 text-white">Bitcoin Hero story</Badge>
                      <h4 className="text-2xl font-black text-sky-950">Saving adventure</h4>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        A fun way to teach saving, patience, clear records, and careful learning.
                      </p>
                      </div>
                    </div>
                    <Button className="rounded-xl bg-orange-500 px-6 font-black text-white hover:bg-orange-600">
                      Preview story
                    </Button>
                  </div>
                </Card>

                <Button
                  onClick={() => setStoryPage(1)}
                  variant="outline"
                  className="w-full rounded-xl border-sky-200 bg-white font-black text-sky-700"
                >
                  Replay sample pages
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-[2rem] border-4 border-sky-950 bg-white p-4 shadow-[8px_8px_0_rgba(8,47,73,0.18)]">
          <div className="flex flex-col items-center justify-between gap-3 border-b-4 border-sky-950 pb-4 text-center md:flex-row md:text-left">
            <div>
              <Badge className="mb-2 bg-amber-300 px-3 py-1 text-sky-950">{currentPage.kicker}</Badge>
              <h2 className="text-4xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">{storyTitle}</h2>
              <p className="mt-1 text-lg font-black text-rose-600">
                {heroName} the {heroType} comic adventure
              </p>
            </div>
            <div className="rounded-2xl border-4 border-sky-950 bg-sky-100 px-5 py-3 text-center shadow-[5px_5px_0_rgba(8,47,73,0.18)]">
              <p className="text-xs font-black uppercase tracking-widest text-sky-700">Page</p>
              <p className="text-3xl font-black text-sky-950">{progress}/2</p>
            </div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-sky-100 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-sky-400 transition-all"
              style={{ width: `${(progress / 2) * 100}%` }}
            />
          </div>
        </div>

        <Card className="border-4 border-sky-950 bg-[#fffdf5] p-3 shadow-[12px_12px_0_rgba(8,47,73,0.2)] sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[410px] overflow-hidden rounded-2xl border-4 border-sky-950 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.85)_0_10%,transparent_11%),linear-gradient(135deg,#fef3c7_0%,#ffe4e6_45%,#bae6fd_100%)] bg-[length:32px_32px,auto] p-5">
              <div className="absolute right-5 top-5 rotate-6 rounded-lg border-4 border-sky-950 bg-yellow-300 px-4 py-2 text-3xl font-black text-sky-950 shadow-[5px_5px_0_rgba(8,47,73,0.18)] sm:text-4xl">
                {currentPage.sound}
              </div>
              <div className="absolute left-5 top-5 max-w-[62%] rounded-2xl rounded-bl-sm border-4 border-sky-950 bg-white px-4 py-3 text-left text-base font-black leading-6 text-sky-950 shadow-[5px_5px_0_rgba(8,47,73,0.14)]">
                {currentPage.speech[0]}
              </div>
              <div className="grid h-full place-items-center pt-20 text-center">
                <div>
                  <div className="mx-auto flex items-center justify-center gap-4">
                    {heroPhoto && (
                      <img
                        src={heroPhoto}
                        alt={`${heroName} photo`}
                        className="h-28 w-28 rotate-[-5deg] rounded-3xl border-4 border-white object-cover shadow-xl"
                      />
                    )}
                    <div className={`grid h-32 w-32 rotate-[4deg] place-items-center rounded-full ${characterData?.color || "bg-sky-400"} text-4xl font-black text-white shadow-xl ring-4 ring-white`}>
                      {heroMark}
                    </div>
                  </div>
                  <h3 className="mt-6 -rotate-1 bg-white px-4 py-2 text-3xl font-black uppercase text-sky-950 shadow-[5px_5px_0_rgba(8,47,73,0.12)]">{currentPage.title}</h3>
                  <p className="mx-auto mt-5 max-w-md rounded-2xl border-4 border-sky-950 bg-white/90 px-5 py-4 text-lg font-bold leading-7 text-sky-900 shadow-[5px_5px_0_rgba(8,47,73,0.14)]">{currentPage.scene}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {currentPage.panels.map((panel, index) => (
                <div
                  key={panel}
                  className={`min-h-40 rounded-2xl border-4 border-sky-950 bg-white p-4 shadow-[6px_6px_0_rgba(8,47,73,0.14)] ${index === 0 ? "rotate-[1deg]" : "rotate-[-1deg]"}`}
                >
                  <div className="mb-3 inline-flex rounded-none border-2 border-sky-950 bg-amber-200 px-3 py-1 text-xs font-black uppercase tracking-wide text-sky-950">
                    Comic Panel {index + 1}
                  </div>
                  <p className="text-base font-semibold leading-7 text-slate-700">{panel}</p>
                  {currentPage.speech[index + 1] && (
                    <div className="mt-4 rounded-[1.5rem] rounded-bl-sm border-2 border-sky-900 bg-amber-50 px-4 py-3 text-base font-black text-sky-950">
                      "{currentPage.speech[index + 1]}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="border-4 border-sky-950 bg-gradient-to-r from-sky-50 via-white to-amber-50 p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
          <h4 className="mb-4 text-xl font-black text-sky-900">What does {heroName} do next?</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {currentPage.choices.map((choice) => (
              <Button
                key={choice.text}
                onClick={() => choice.next && setStoryPage(choice.next)}
                className="min-h-14 rounded-2xl bg-gradient-to-r from-teal-500 to-sky-500 px-5 text-base font-black text-white hover:from-teal-600 hover:to-sky-600"
              >
                {choice.text}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  const renderStory = () => {
    const characterData = allCharacters.find((char) => char.id === selectedCharacter)
    const heroType = characterData?.name || "Hero"
    const heroName = selectedLegendName || childName || "Little Legend"
    const heroMark = getHeroInitials(heroName)
    const story = getStoryForCharacter(selectedCharacter, { heroName, heroType })
    const currentPage = story.pages[storyPageId] || story.pages.start
    const pageIds = Object.keys(story.pages)
    const currentPageIndex = Math.max(0, pageIds.indexOf(currentPage.id))
    const visiblePageNumber = Math.min(currentPageIndex + 1, story.previewPageLimit)
    const isPreviewComplete = storyPageId === "purchase" || storyPath.length >= story.previewPageLimit
    const artworkGender = selectedGender === "girl" ? "girl" : "boy"
    const pageArtwork = currentPage.artwork?.[artworkGender]
    const fallbackPageArtwork = getStoryArtworkFallback(story.characterId, artworkGender)
    const visiblePageArtwork =
      pageArtwork && !failedArtwork[pageArtwork]
        ? pageArtwork
        : fallbackPageArtwork && fallbackPageArtwork !== pageArtwork && !failedArtwork[fallbackPageArtwork]
          ? fallbackPageArtwork
          : null
    const pathSummary = getStoryPathSummary(storyPath)
    const isFootballPreview = story.characterId === "footballer"
    const footballPanelStyles = [
      {
        label: "Match moment",
        background:
          "bg-[radial-gradient(circle_at_78%_22%,rgba(255,255,255,0.95)_0_5%,transparent_6%),radial-gradient(circle_at_28%_72%,rgba(251,191,36,0.34)_0_12%,transparent_13%),linear-gradient(135deg,#064e3b_0%,#0f766e_48%,#bef264_100%)]",
      },
      {
        label: "Team plan",
        background:
          "bg-[radial-gradient(circle_at_22%_24%,rgba(250,204,21,0.58)_0_7%,transparent_8%),radial-gradient(circle_at_72%_72%,rgba(125,211,252,0.42)_0_10%,transparent_11%),linear-gradient(135deg,#082f49_0%,#155e75_52%,#0f766e_100%)]",
      },
    ]

    const handleStoryChoice = (choice: (typeof currentPage.choices)[number]) => {
      if (choice.id === "read-again") {
        setStoryPageId("start")
        setStoryPath([])
        return
      }

      setStoryPath((previousPath) => [
        ...previousPath,
        {
          pageId: currentPage.id,
          choiceId: choice.id,
          pathTag: choice.pathTag,
          text: choice.text,
        },
      ])
      setStoryPageId(choice.nextPageId)
    }

    if (isPreviewComplete) {
      return (
        <div className="mx-auto max-w-6xl">
          <Card className="overflow-hidden border-4 border-sky-950 bg-white shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative min-h-[280px] bg-[linear-gradient(135deg,#fef3c7_0%,#ccfbf1_50%,#dbeafe_100%)] p-4 sm:min-h-[300px] sm:p-5">
                <div className="absolute right-3 top-3 rotate-6 rounded-lg border-4 border-sky-950 bg-yellow-300 px-3 py-1.5 text-lg font-black text-sky-950 shadow-[5px_5px_0_rgba(8,47,73,0.18)] sm:right-4 sm:top-4 sm:py-2 sm:text-2xl">
                  PREVIEW READY
                </div>
                <div className="grid h-full place-items-center pt-14 text-center">
                  <div>
                    <div className="mx-auto flex items-center justify-center gap-4">
                      <div className={`grid h-20 w-20 rotate-[5deg] place-items-center rounded-full ${characterData?.color || "bg-sky-400"} text-2xl font-black text-white shadow-xl ring-4 ring-white sm:h-24 sm:w-24 sm:text-3xl`}>
                        {heroMark}
                      </div>
                    </div>
                    <h2 className="mt-5 text-2xl font-black uppercase leading-tight text-sky-950 sm:text-3xl">{story.purchaseSummary.headline}</h2>
                    <p className="mx-auto mt-3 max-w-md rounded-2xl border-4 border-sky-950 bg-white/90 px-4 py-3 text-base font-bold leading-6 text-sky-900 shadow-[5px_5px_0_rgba(8,47,73,0.14)]">
                      {story.purchaseSummary.body}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t-4 border-sky-950 bg-[#fffdf5] p-5 lg:border-l-4 lg:border-t-0">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-amber-300 px-3 py-1 text-sky-950">{story.previewPageLimit}-page preview complete</Badge>
                  </div>
                  <h3 className="mt-2 text-2xl font-black leading-tight text-sky-950">{story.title}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{story.subtitle}</p>
                  <p className="mt-2 rounded-xl bg-sky-50 px-3 py-2 text-sm font-black text-sky-900">{pathSummary}</p>
                  <p className="mt-3 rounded-2xl border-2 border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-900">
                    Make this into {heroName}'s finished bedtime story, ready to read, save, or print.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {story.purchaseSummary.includes.map((item) => (
                    <div key={item} className="rounded-xl border-2 border-sky-100 bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Card className="border-4 border-sky-950 bg-sky-50 p-4 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl border-4 border-sky-950 bg-white text-sky-600 shadow-[3px_3px_0_rgba(8,47,73,0.14)]">
                        <Download className="h-5 w-5" />
                      </div>
                      <h4 className="text-xl font-black text-sky-950">Digital PDF</h4>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">Instant access to read on your phone and save as a PDF.</p>
                    <p className="mt-3 text-3xl font-black text-rose-600">£4.99</p>
                    <Button
                      onClick={() => startCheckout("digital")}
                      className="mt-3 h-10 w-full rounded-xl bg-sky-500 font-black text-white hover:bg-sky-600"
                    >
                      Get Digital Story
                    </Button>
                  </Card>

                  <Card className="relative border-4 border-sky-950 bg-amber-50 p-4 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
                    <div className="absolute right-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-black uppercase text-white shadow-sm">
                      Best keepsake
                    </div>
                    <div className="mb-2 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl border-4 border-sky-950 bg-white text-amber-600 shadow-[3px_3px_0_rgba(8,47,73,0.14)]">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <h4 className="pr-20 text-xl font-black text-sky-950">Hardback Book</h4>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">A posted keepsake for bedtime reading, with digital access included.</p>
                    <p className="mt-3 text-3xl font-black text-rose-600">£14.99</p>
                    <Button
                      onClick={() => startCheckout("hardback")}
                      className="mt-3 h-10 w-full rounded-xl bg-rose-500 font-black text-white hover:bg-rose-600"
                    >
                      Order Keepsake Book
                    </Button>
                  </Card>
                </div>

                <Button
                  onClick={() => {
                    setStoryPageId("start")
                    setStoryPath([])
                  }}
                  variant="outline"
                  className="h-10 w-full rounded-xl border-sky-200 bg-white font-black text-sky-700"
                >
                  Read sample again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-[2rem] border-4 border-sky-950 bg-white p-3 shadow-[8px_8px_0_rgba(8,47,73,0.18)] sm:p-4">
          <div className="flex flex-col items-center justify-between gap-2 border-b-4 border-sky-950 pb-3 text-center md:flex-row md:text-left">
            <div>
              <Badge className="mb-2 bg-amber-300 px-3 py-1 text-sky-950">{currentPage.kicker}</Badge>
              <h2 className="text-2xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">{story.title}</h2>
              <p className="mt-1 text-base font-black text-rose-600 sm:text-lg">{story.lesson}</p>
            </div>
            <div className="rounded-2xl border-4 border-sky-950 bg-sky-100 px-4 py-2 text-center shadow-[5px_5px_0_rgba(8,47,73,0.18)] sm:px-5 sm:py-3">
              <p className="text-xs font-black uppercase tracking-widest text-sky-700">Preview</p>
              <p className="text-2xl font-black text-sky-950 sm:text-3xl">{visiblePageNumber}/{story.previewPageLimit}</p>
            </div>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-sky-100 shadow-inner sm:mt-4 sm:h-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-sky-400 transition-all"
              style={{ width: `${(visiblePageNumber / story.previewPageLimit) * 100}%` }}
            />
          </div>
        </div>

        <Card className="border-4 border-sky-950 bg-[#fffdf5] p-3 shadow-[12px_12px_0_rgba(8,47,73,0.2)] sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[360px] overflow-hidden rounded-2xl border-4 border-sky-950 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.85)_0_10%,transparent_11%),linear-gradient(135deg,#fef3c7_0%,#ffe4e6_45%,#bae6fd_100%)] bg-[length:32px_32px,auto] p-4 sm:min-h-[430px] sm:p-5">
              {visiblePageArtwork && (
                <img
                  src={visiblePageArtwork}
                  alt={`${story.title}: ${currentPage.title}`}
                  onError={() => setFailedArtwork((current) => ({ ...current, [visiblePageArtwork]: true }))}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              {!visiblePageArtwork && (
                <StoryArtPlaceholder
                  heroType={heroType}
                  heroName={heroName}
                  initials={heroMark}
                  pageTitle={currentPage.title}
                />
              )}
              {visiblePageArtwork && (
                <div
                  className={
                    isFootballPreview
                      ? "absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.05)_45%,rgba(255,255,255,0.82)_100%)]"
                      : "absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.18)_62%,rgba(255,255,255,0.72)_100%)]"
                  }
                />
              )}
              <div
                className={`absolute rotate-6 rounded-lg border-4 border-sky-950 bg-yellow-300 px-3 py-1.5 text-xl font-black text-sky-950 shadow-[5px_5px_0_rgba(8,47,73,0.18)] sm:px-4 sm:py-2 sm:text-4xl ${
                  isFootballPreview ? "left-3 top-3 sm:left-5 sm:top-5" : "right-3 top-3 sm:right-5 sm:top-5"
                }`}
              >
                {currentPage.sound}
              </div>
              <div
                className={`absolute max-w-[58%] rounded-2xl rounded-bl-sm border-4 border-sky-950 bg-white px-3 py-2 text-left text-sm font-black leading-5 text-sky-950 shadow-[5px_5px_0_rgba(8,47,73,0.14)] sm:max-w-[62%] sm:px-4 sm:py-3 sm:text-base sm:leading-6 ${
                  isFootballPreview ? "right-3 top-3 sm:right-5 sm:top-5" : "left-3 top-3 sm:left-5 sm:top-5"
                }`}
              >
                {currentPage.speech[0]}
              </div>
              <div
                className={
                  isFootballPreview
                    ? "absolute inset-x-3 bottom-3 flex justify-start text-left sm:inset-x-5 sm:bottom-5"
                    : "grid h-full place-items-center pt-20 text-center"
                }
              >
                <div className={isFootballPreview ? "max-w-xl" : ""}>
                  <h3 className={`${isFootballPreview ? "inline-block" : "mt-6"} -rotate-1 bg-white px-4 py-2 text-2xl font-black uppercase text-sky-950 shadow-[5px_5px_0_rgba(8,47,73,0.12)] sm:text-3xl`}>{currentPage.title}</h3>
                  <p className={`${isFootballPreview ? "mt-2" : "mx-auto mt-4 sm:mt-5"} max-w-md rounded-2xl border-4 border-sky-950 bg-white/90 px-4 py-3 text-base font-bold leading-6 text-sky-900 shadow-[5px_5px_0_rgba(8,47,73,0.14)] sm:px-5 sm:py-4 sm:text-lg sm:leading-7`}>{currentPage.scene}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {currentPage.panels.map((panel, index) => (
                <div
                  key={panel}
                  className={`relative min-h-40 overflow-hidden rounded-2xl border-4 border-sky-950 bg-white shadow-[6px_6px_0_rgba(8,47,73,0.14)] sm:min-h-48 ${index === 0 ? "rotate-[1deg]" : "rotate-[-1deg]"}`}
                >
                  {isFootballPreview ? (
                    <>
                      <div className={`absolute inset-0 ${footballPanelStyles[index]?.background || footballPanelStyles[0].background}`} />
                      {index === 0 ? (
                        <>
                          <div className="absolute bottom-0 left-1/2 h-full w-1 -translate-x-1/2 bg-white/24" />
                          <div className="absolute inset-x-6 bottom-8 h-12 rounded-t-full border-4 border-white/55" />
                          <div className="absolute right-8 top-6 h-10 w-10 rounded-full border-4 border-sky-950/45 bg-white/90 shadow-[4px_4px_0_rgba(8,47,73,0.16)]" />
                        </>
                      ) : (
                        <>
                          <div className="absolute left-7 top-7 h-14 w-14 rounded-full border-4 border-white/45" />
                          <div className="absolute right-7 bottom-7 h-16 w-24 rounded-lg border-4 border-white/45" />
                          <div className="absolute left-[34%] top-[42%] h-1 w-[42%] -rotate-12 rounded-full bg-white/42" />
                        </>
                      )}
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.18)_52%,rgba(255,255,255,0.9)_100%)]" />
                      <div className="absolute left-4 top-4 rounded-full border-2 border-white/70 bg-white/88 px-3 py-1 text-xs font-black uppercase tracking-wide text-sky-950 shadow-[3px_3px_0_rgba(8,47,73,0.14)]">
                        {footballPanelStyles[index]?.label || "Story beat"}
                      </div>
                    </>
                  ) : visiblePageArtwork ? (
                    <img
                      src={visiblePageArtwork}
                      alt={`${currentPage.title} panel ${index + 1}`}
                      onError={() => setFailedArtwork((current) => ({ ...current, [visiblePageArtwork]: true }))}
                      className={`absolute inset-0 h-full w-full scale-125 object-cover ${index === 0 ? "object-left" : "object-right"}`}
                    />
                  ) : null}
                  {!isFootballPreview && visiblePageArtwork && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.15)_45%,rgba(255,255,255,0.86)_100%)]" />}
                  {!isFootballPreview && !visiblePageArtwork && (
                    <StoryArtPlaceholder
                      heroType={heroType}
                      heroName={heroName}
                      initials={heroMark}
                      pageTitle={currentPage.title}
                      compact
                    />
                  )}
                  <p className="absolute inset-x-3 bottom-3 rounded-2xl border-2 border-sky-950 bg-white/92 px-3 py-2 text-sm font-black leading-5 text-sky-950 shadow-[4px_4px_0_rgba(8,47,73,0.14)] sm:inset-x-4 sm:bottom-4 sm:px-4 sm:py-3 sm:text-base sm:leading-6">
                    {panel}
                  </p>
                  {currentPage.speech[index + 1] && (
                    <div className="absolute left-3 top-3 max-w-[82%] rounded-[1.5rem] rounded-bl-sm border-2 border-sky-900 bg-amber-50 px-3 py-2 text-sm font-black text-sky-950 shadow-[4px_4px_0_rgba(8,47,73,0.14)] sm:left-4 sm:top-4 sm:px-4 sm:py-3 sm:text-base">
                      "{currentPage.speech[index + 1]}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="border-4 border-sky-950 bg-gradient-to-r from-sky-50 via-white to-amber-50 p-5 shadow-[8px_8px_0_rgba(8,47,73,0.14)]">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h4 className="text-xl font-black text-sky-900">What does {heroName} do next?</h4>
              <p className="mt-1 text-sm font-bold text-slate-600">{pathSummary}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {currentPage.choices.map((choice) => (
              <Button
                key={choice.id}
                onClick={() => handleStoryChoice(choice)}
                className="min-h-14 rounded-2xl bg-gradient-to-r from-teal-500 to-sky-500 px-4 text-sm font-black text-white hover:from-teal-600 hover:to-sky-600 sm:px-5 sm:text-base"
              >
                {choice.text}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  const renderCheckout = () => {
    const characterData = allCharacters.find((char) => char.id === selectedCharacter)
    const heroType = characterData?.name || "Hero"
    const heroName = selectedLegendName || childName || "Little Legend"
    const story = getStoryForCharacter(selectedCharacter, { heroName, heroType })
    const pathSummary = getStoryPathSummary(storyPath)
    const CurrentIcon = checkoutIcons[checkoutProduct]
    const dispatchEstimate = checkoutProduct === "digital" ? "Available straight after payment" : "Printed and posted in 5-7 working days"

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (isPreparingCheckout) return
      setCheckoutError("")
      setIsPreparingCheckout(true)
      const createdAt = new Date().toISOString()
      const order: OrderRecord = {
        id: createOrderId(),
        createdAt,
        product: checkoutProduct,
        total: currentCheckout.price,
        email: checkoutForm.email,
        phone: checkoutForm.phone || undefined,
        heroName,
        heroType,
        storyTitle: story.title,
        storyId: story.characterId,
        gender: selectedGender,
        photoCount: uploadedPhotos.length,
        choices: storyPath,
        postage: requiresPostage
          ? {
              fullName: checkoutForm.fullName,
              addressLine1: checkoutForm.addressLine1,
              addressLine2: checkoutForm.addressLine2,
              city: checkoutForm.city,
              postcode: checkoutForm.postcode,
              country: checkoutForm.country,
            }
          : undefined,
        status: "payment_pending",
        fulfilmentStatus: "new",
        fulfilmentUpdatedAt: createdAt,
      }

      try {
        const orderResponse = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(order),
        })

        if (!orderResponse.ok) {
          throw new Error("Order could not be saved")
        }

        if (uploadedPhotos.length > 0) {
          const photoUploadForm = new FormData()
          photoUploadForm.set("orderId", order.id)
          uploadedPhotos.forEach((photo) => {
            photoUploadForm.append("photos", photo.file)
          })

          const photoResponse = await fetch("/api/order-photos", {
            method: "POST",
            body: photoUploadForm,
          })

          if (!photoResponse.ok) {
            const photoData = await photoResponse.json().catch(() => null)
            throw new Error(photoData?.error || "Photos could not be saved")
          }
        }
      } catch (error) {
        console.error("Failed to save order to server store:", error)
        setCheckoutError(
          error instanceof Error && error.message.includes("Photo storage is not configured")
            ? "Photo uploads are not configured in production yet. Add the storage key before taking live photo orders."
            : "We could not save the order yet. Please try again before going to payment.",
        )
        setIsPreparingCheckout(false)
        return
      }

      let checkoutUrl = ""
      try {
        const checkoutResponse = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order }),
        })
        const checkoutData = await checkoutResponse.json()
        checkoutUrl = checkoutData.checkout?.url || ""
        if (checkoutData.checkout?.mode === "stripe" && checkoutUrl) {
          window.location.href = checkoutUrl
          return
        }
      } catch (error) {
        console.error("Failed to create checkout session:", error)
        setCheckoutError("We could not open secure checkout. Please try again.")
        setIsPreparingCheckout(false)
        return
      }

      if (!checkoutUrl) {
        setCheckoutError("Secure checkout is not ready yet. Please try again.")
        setIsPreparingCheckout(false)
        return
      }

      setLatestOrder({
        ...order,
        checkoutUrl,
      })
      setOrderSubmitted(true)
      setIsPreparingCheckout(false)
    }

    const markLatestOrderPaid = async () => {
      if (!latestOrder) return

      try {
        const response = await fetch("/api/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: latestOrder.id, status: "paid_demo" }),
        })

        if (!response.ok) throw new Error("Failed to mark paid")

        setLatestOrder((currentOrder) => currentOrder && { ...currentOrder, status: "paid_demo" })
      } catch (error) {
        console.error("Failed to mark order paid:", error)
      }
    }

    if (orderSubmitted) {
      return (
        <div className="mx-auto max-w-5xl">
          <Card className="overflow-hidden border-4 border-sky-950 bg-white shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="bg-[linear-gradient(135deg,#dbeafe_0%,#ccfbf1_52%,#fef3c7_100%)] p-6">
                <div className="grid min-h-[320px] place-items-center rounded-2xl border-4 border-sky-950 bg-white/72 p-6 text-center shadow-[7px_7px_0_rgba(8,47,73,0.15)]">
                  <div>
                    <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-sky-950 bg-emerald-100 text-emerald-600 shadow-[5px_5px_0_rgba(8,47,73,0.14)]">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="mt-5 text-3xl font-black uppercase leading-tight text-sky-950">Your order is ready</h2>
                    <p className="mx-auto mt-3 max-w-sm text-base font-bold leading-7 text-slate-700">
                      We have saved the story details and prepared the secure checkout step.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t-4 border-sky-950 bg-[#fffdf5] p-6 lg:border-l-4 lg:border-t-0">
                <Badge className="bg-amber-300 px-3 py-1 text-sky-950">{currentCheckout.label}</Badge>
                <h3 className="text-2xl font-black text-sky-950">{story.title}</h3>
                <p className="rounded-xl bg-sky-50 px-3 py-2 text-sm font-black text-sky-900">{pathSummary}</p>
                {latestOrder && (
                  <div className="rounded-xl border-2 border-sky-100 bg-white p-4">
                    <div className="text-xs font-black uppercase tracking-widest text-sky-700">Order reference</div>
                    <div className="mt-1 break-all text-xl font-black text-sky-950">{latestOrder.id}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-700">
                      Payment status: {latestOrder.status === "paid" ? "paid" : latestOrder.status === "paid_demo" ? "paid demo" : "payment pending"}
                    </div>
                    {latestOrder.checkoutUrl && (
                      <div className="mt-2 text-sm font-semibold text-slate-700">
                        Demo checkout:{" "}
                        <a href={latestOrder.checkoutUrl} className="break-all font-black text-sky-700 underline">
                          {latestOrder.checkoutUrl}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border-2 border-sky-100 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-black text-sky-900">
                      <Mail className="h-4 w-4" />
                      Email follow-up
                    </div>
                    <p className="text-sm font-semibold leading-6 text-slate-700">
                      The confirmation email includes the download link and, for digital orders, a hard copy upgrade link.
                      {uploadedPhotos.length > 0
                        ? " Your reference photos are safely stored with the order for the personalised artwork stage."
                        : ""}
                    </p>
                  </div>
                  <div className="rounded-xl border-2 border-sky-100 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-black text-sky-900">
                      <Clock className="h-4 w-4" />
                      Timescale
                    </div>
                    <p className="text-sm font-semibold leading-6 text-slate-700">{dispatchEstimate}</p>
                  </div>
                </div>

                {checkoutProduct === "digital" && (
                  <Card className="border-4 border-sky-950 bg-amber-50 p-4 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-lg font-black text-sky-950">Want the hard copy too?</h4>
                        <p className="mt-1 text-sm font-semibold text-slate-700">Add a posted keepsake copy for {money.format(10)}.</p>
                      </div>
                      <Button
                        onClick={() => startCheckout("upgrade")}
                        className="h-11 rounded-xl bg-rose-500 px-5 font-black text-white hover:bg-rose-600"
                      >
                        <Truck className="h-4 w-4" />
                        Add Hard Copy
                      </Button>
                    </div>
                  </Card>
                )}

                {latestOrder?.status !== "paid_demo" && latestOrder?.status !== "paid" && (
                  <Card className="border-4 border-sky-950 bg-sky-50 p-4 shadow-[6px_6px_0_rgba(8,47,73,0.12)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-lg font-black text-sky-950">Preview payment step</h4>
                        <p className="mt-1 text-sm font-semibold text-slate-700">For local testing, mark this order as paid to unlock the finished story.</p>
                      </div>
                      <Button
                        onClick={markLatestOrderPaid}
                        className="h-11 rounded-xl bg-emerald-500 px-5 font-black text-white hover:bg-emerald-600"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark Paid
                      </Button>
                    </div>
                  </Card>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={() => setCurrentStep("full-story")}
                    disabled={latestOrder?.status !== "paid_demo" && latestOrder?.status !== "paid"}
                    className="h-11 rounded-xl bg-sky-500 px-5 font-black text-white hover:bg-sky-600"
                  >
                    <BookOpen className="h-4 w-4" />
                    Read Full Story
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentStep("full-story")
                      window.setTimeout(() => window.print(), 250)
                    }}
                    disabled={latestOrder?.status !== "paid_demo" && latestOrder?.status !== "paid"}
                    className="h-11 rounded-xl bg-emerald-500 px-5 font-black text-white hover:bg-emerald-600"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>

                {latestOrder && (
                  <details className="rounded-xl border-2 border-sky-100 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-black text-sky-900">Order details</summary>
                    <div className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-slate-700">
                      <p>Product: {checkoutOptions[latestOrder.product].label}</p>
                      <p>Total: {money.format(latestOrder.total)}</p>
                      <p>Email: {latestOrder.email}</p>
                      {latestOrder.phone && <p>Phone: {latestOrder.phone}</p>}
                      {latestOrder.postage && (
                        <p>
                          Postage: {latestOrder.postage.fullName}, {latestOrder.postage.addressLine1}, {latestOrder.postage.city}, {latestOrder.postage.postcode}
                        </p>
                      )}
                    </div>
                  </details>
                )}

                <Button
                  onClick={goBack}
                  variant="outline"
                  className="h-10 w-full rounded-xl border-sky-200 bg-white font-black text-sky-700"
                >
                  Back to story preview
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return (
      <form onSubmit={handleSubmit} className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-[2rem] border-4 border-sky-950 bg-white p-4 shadow-[8px_8px_0_rgba(8,47,73,0.18)] sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="mb-2 bg-amber-300 px-3 py-1 text-sky-950">Step 5 of 5</Badge>
              <h2 className="text-3xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">Complete your order</h2>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-700">
                {checkoutProduct === "upgrade"
                  ? `Add a posted hard copy for ${story.title}.`
                  : `Confirm where to send ${heroName}'s finished story, then continue to secure payment.`}
              </p>
            </div>
            <div className="rounded-2xl border-4 border-sky-950 bg-sky-100 px-4 py-3 text-center shadow-[5px_5px_0_rgba(8,47,73,0.18)] sm:px-5">
              <p className="text-xs font-black uppercase tracking-widest text-sky-700">Total</p>
              <p className="text-2xl font-black text-sky-950 sm:text-3xl">{money.format(currentCheckout.price)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
          <Card className="border-4 border-sky-950 bg-[#fffdf5] p-4 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-5">
            <div className={`grid gap-3 ${checkoutProduct === "upgrade" ? "" : "sm:grid-cols-2"}`}>
              {visibleCheckoutProducts.map((product) => {
                const option = checkoutOptions[product]
                const OptionIcon = checkoutIcons[product]
                const isSelected = checkoutProduct === product

                return (
                  <button
                    key={product}
                    type="button"
                    onClick={() => {
                      setCheckoutProduct(product)
                      setOrderSubmitted(false)
                      setCheckoutError("")
                    }}
                    className={`rounded-2xl border-4 p-3 text-left shadow-[5px_5px_0_rgba(8,47,73,0.12)] transition-all hover:-translate-y-0.5 sm:p-4 ${
                      isSelected ? "border-sky-950 bg-sky-100" : "border-sky-100 bg-white"
                    }`}
                  >
                    <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl border-4 border-sky-950 bg-white text-sky-700 sm:h-11 sm:w-11">
                      <OptionIcon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-black text-sky-950">{option.label}</h3>
                    <p className="mt-1 text-sm font-semibold leading-5 text-slate-700">{option.summary}</p>
                    <p className="mt-3 text-2xl font-black text-rose-600">{money.format(option.price)}</p>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-black text-sky-950">Email for receipt and story link</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                  value={checkoutForm.email}
                  onChange={(event) => updateCheckoutField("email", event.target.value)}
                  placeholder="you@example.com"
                  className="h-12 rounded-xl border-2 border-sky-100 bg-white font-semibold"
                />
                <p className="text-xs font-bold leading-5 text-slate-600">
                  We will send the receipt and story access here.
                </p>
              </div>

              {requiresPostage && (
                <div className="grid gap-4 rounded-2xl border-4 border-sky-950 bg-white p-4">
                  <div className="flex items-start gap-2">
                    <Truck className="h-5 w-5 text-rose-500" />
                    <div>
                      <h3 className="text-xl font-black text-sky-950">Delivery address</h3>
                      <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                        For the printed keepsake copy.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="fullName" className="text-sm font-black text-sky-950">Full name</Label>
                      <Input id="fullName" autoComplete="name" required={requiresPostage} value={checkoutForm.fullName} onChange={(event) => updateCheckoutField("fullName", event.target.value)} className="h-12 rounded-xl border-2 border-sky-100 bg-white font-semibold" />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="addressLine1" className="text-sm font-black text-sky-950">Address line 1</Label>
                      <Input id="addressLine1" autoComplete="address-line1" required={requiresPostage} value={checkoutForm.addressLine1} onChange={(event) => updateCheckoutField("addressLine1", event.target.value)} className="h-12 rounded-xl border-2 border-sky-100 bg-white font-semibold" />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="addressLine2" className="text-sm font-black text-sky-950">Address line 2</Label>
                      <Input id="addressLine2" autoComplete="address-line2" value={checkoutForm.addressLine2} onChange={(event) => updateCheckoutField("addressLine2", event.target.value)} className="h-12 rounded-xl border-2 border-sky-100 bg-white font-semibold" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city" className="text-sm font-black text-sky-950">Town or city</Label>
                      <Input id="city" autoComplete="address-level2" required={requiresPostage} value={checkoutForm.city} onChange={(event) => updateCheckoutField("city", event.target.value)} className="h-12 rounded-xl border-2 border-sky-100 bg-white font-semibold" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="postcode" className="text-sm font-black text-sky-950">Postcode</Label>
                      <Input id="postcode" autoComplete="postal-code" required={requiresPostage} value={checkoutForm.postcode} onChange={(event) => updateCheckoutField("postcode", event.target.value)} className="h-12 rounded-xl border-2 border-sky-100 bg-white font-semibold" />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="country" className="text-sm font-black text-sky-950">Country</Label>
                      <Input id="country" autoComplete="country-name" required={requiresPostage} value={checkoutForm.country} onChange={(event) => updateCheckoutField("country", event.target.value)} className="h-12 rounded-xl border-2 border-sky-100 bg-white font-semibold" />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="phone" className="text-sm font-black text-sky-950">Telephone number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required={requiresPostage}
                        value={checkoutForm.phone}
                        onChange={(event) => updateCheckoutField("phone", event.target.value)}
                        placeholder="For delivery updates"
                        className="h-12 rounded-xl border-2 border-sky-100 bg-white font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="border-4 border-sky-950 bg-white p-4 shadow-[8px_8px_0_rgba(8,47,73,0.14)] sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-4 border-sky-950 bg-sky-50 text-sky-700 sm:h-12 sm:w-12">
                  <CurrentIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-sky-950">{currentCheckout.label}</h3>
                  <p className="text-sm font-bold text-slate-600">{currentCheckout.summary}</p>
                </div>
              </div>
              <div className="space-y-3 rounded-2xl bg-sky-50 p-4 text-sm font-bold leading-6 text-slate-700">
                <p>{story.title}</p>
                <p>{pathSummary}</p>
                <p>{dispatchEstimate}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t-2 border-sky-100 pt-4">
                <span className="text-base font-black text-sky-950">Total today</span>
                <span className="text-3xl font-black text-rose-600">{money.format(currentCheckout.price)}</span>
              </div>
            </Card>

            <Card className="border-4 border-sky-950 bg-amber-50 p-4 shadow-[8px_8px_0_rgba(8,47,73,0.14)] sm:p-5">
              <div className="mb-3 flex items-center gap-2 text-sky-950">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="text-lg font-black">Secure payment</h3>
              </div>
              <p className="text-sm font-semibold leading-6 text-slate-700">
                Payment opens securely. We only keep the details needed for your receipt, story download, and postage.
                {uploadedPhotos.length > 0 ? " Reference photos are stored privately with your order before checkout continues." : ""}
              </p>
              <div className="mt-4 grid gap-2 text-xs font-black text-sky-900">
                <div className="rounded-xl bg-white/80 px-3 py-2">Secure Stripe checkout</div>
                <div className="rounded-xl bg-white/80 px-3 py-2">Email receipt and story link</div>
                <div className="rounded-xl bg-white/80 px-3 py-2">{dispatchEstimate}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-black text-sky-700">
                <a href="/privacy" className="underline-offset-4 hover:underline">Privacy</a>
                <a href="/terms" className="underline-offset-4 hover:underline">Terms</a>
                <a href="/contact" className="underline-offset-4 hover:underline">Support</a>
              </div>
              {checkoutError && (
                <div className="mt-4 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black leading-6 text-rose-800" role="alert">
                  {checkoutError}
                </div>
              )}
              <Button
                type="submit"
                disabled={isPreparingCheckout}
                className="mt-4 h-12 w-full rounded-xl bg-rose-500 text-base font-black text-white hover:bg-rose-600 disabled:opacity-70"
              >
                <CreditCard className="h-5 w-5" />
                {isPreparingCheckout ? "Preparing secure checkout..." : "Continue to secure payment"}
              </Button>
              <p className="mt-3 text-center text-xs font-bold leading-5 text-slate-600">
                You can review everything before confirming payment.
              </p>
            </Card>
          </div>
        </div>
      </form>
    )
  }

  const renderFullStory = () => {
    const characterData = allCharacters.find((char) => char.id === selectedCharacter)
    const heroType = characterData?.name || "Hero"
    const heroName = selectedLegendName || childName || "Little Legend"
    const heroMark = getHeroInitials(heroName)
    const story = getStoryForCharacter(selectedCharacter, { heroName, heroType })
    const artworkGender = selectedGender === "girl" ? "girl" : "boy"
    const fullStoryPages = resolveFullStoryPages(story, storyPath)
    const pathSummary = getStoryPathSummary(storyPath)
    const coverArtwork = fullStoryPages[0]?.artwork?.[artworkGender]
    const fallbackCoverArtwork = getStoryArtworkFallback(story.characterId, artworkGender)
    const visibleCoverArtwork =
      coverArtwork && !failedArtwork[coverArtwork]
        ? coverArtwork
        : fallbackCoverArtwork && fallbackCoverArtwork !== coverArtwork && !failedArtwork[fallbackCoverArtwork]
          ? fallbackCoverArtwork
          : null
    const qualityTags = ["Personalised", story.readingAge, `${fullStoryPages.length} story pages`]

    return (
      <div className="mx-auto max-w-6xl space-y-6 full-story-print">
        <div className="no-print rounded-[2rem] border-4 border-sky-950 bg-white p-5 shadow-[8px_8px_0_rgba(8,47,73,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="mb-2 bg-emerald-100 px-3 py-1 text-emerald-800">Unlocked full story</Badge>
              <h2 className="text-3xl font-black uppercase leading-tight text-sky-950 sm:text-5xl">{story.title}</h2>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-700">
                {fullStoryPages.length} read-along pages shaped by the choices made in the preview.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                onClick={() => window.print()}
                className="h-11 rounded-xl bg-emerald-500 px-5 font-black text-white hover:bg-emerald-600"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button
                onClick={() => setCurrentStep("checkout")}
                variant="outline"
                className="h-11 rounded-xl border-sky-200 bg-white px-5 font-black text-sky-700"
              >
                Order Details
              </Button>
            </div>
          </div>
        </div>

        <section className="book-page print-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] shadow-[12px_12px_0_rgba(8,47,73,0.18)]">
          <div className="book-cover-grid grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="book-cover-hero relative isolate grid min-h-[360px] place-items-end overflow-hidden bg-[linear-gradient(135deg,#fef3c7_0%,#ccfbf1_50%,#dbeafe_100%)] p-5 text-center sm:min-h-[430px] sm:p-8">
              {visibleCoverArtwork && (
                <img
                  src={visibleCoverArtwork}
                  alt={`${story.title} cover artwork`}
                  onError={() => setFailedArtwork((current) => ({ ...current, [visibleCoverArtwork]: true }))}
                  className="absolute inset-0 -z-10 h-full w-full object-cover"
                />
              )}
              {!visibleCoverArtwork && (
                <div className="absolute inset-0 -z-10">
                  <StoryArtPlaceholder
                    heroType={heroType}
                    heroName={heroName}
                    initials={heroMark}
                    pageTitle={story.title}
                  />
                </div>
              )}
              <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,47,73,0.06)_0%,rgba(8,47,73,0.08)_42%,rgba(8,47,73,0.82)_100%)]" />
              <div className="book-cover-title-card w-full rounded-[1.5rem] border-4 border-white/80 bg-white/92 p-5 shadow-[0_18px_45px_rgba(8,47,73,0.24)] backdrop-blur-sm">
                <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-amber-200 px-4 py-2 text-xs font-black uppercase text-sky-950">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Little Legends Story
                </div>
                <h1 className="text-3xl font-black uppercase leading-tight text-sky-950 sm:text-6xl">{story.title}</h1>
                <p className="mx-auto mt-4 max-w-md text-base font-bold leading-7 text-slate-700 sm:text-lg">{story.subtitle}</p>
              </div>
            </div>
            <div className="book-cover-copy space-y-5 border-t-4 border-sky-950 bg-white p-8 lg:border-l-4 lg:border-t-0">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-rose-500">Made especially for</p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-sky-950 sm:text-4xl">{heroName}</h2>
                <p className="mt-2 text-lg font-bold leading-7 text-slate-700">
                  A magical adventure starring {heroName} the {heroType}.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border-2 border-sky-100 bg-sky-50 p-4 text-sm font-bold leading-6 text-slate-700">
                  <Sparkles className="mb-2 h-5 w-5 text-sky-700" />
                  {story.lesson}
                </div>
                <div className="rounded-xl border-2 border-sky-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-slate-700">
                  <BookOpen className="mb-2 h-5 w-5 text-amber-700" />
                  {pathSummary}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {qualityTags.map((tag) => (
                  <span key={tag} className="rounded-full border-2 border-sky-100 bg-[#fffdf5] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-sky-800">
                    {tag}
                  </span>
                ))}
              </div>
              {latestOrder && (
                <div className="no-print rounded-xl border-2 border-sky-100 bg-[#fffdf5] p-4 text-sm font-semibold leading-6 text-slate-600">
                  <p className="font-black text-sky-950">Order reference</p>
                  <p>{latestOrder.id}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {fullStoryPages.map((page) => {
          const pageArtwork = page.artwork?.[artworkGender]
          const fallbackPageArtwork = getStoryArtworkFallback(story.characterId, artworkGender)
          const visiblePageArtwork =
            pageArtwork && !failedArtwork[pageArtwork]
              ? pageArtwork
              : fallbackPageArtwork && fallbackPageArtwork !== pageArtwork && !failedArtwork[fallbackPageArtwork]
                ? fallbackPageArtwork
                : null

          return (
            <section
              key={page.id}
              className="book-page print-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-4 shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-5"
            >
              <div className="book-page-header mb-4 flex flex-col gap-3 border-b-4 border-sky-950 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Badge className="mb-2 bg-amber-300 px-3 py-1 text-sky-950">Page {page.pageNumber}</Badge>
                  <h2 className="text-2xl font-black uppercase leading-tight text-sky-950 sm:text-3xl">{page.title}</h2>
                </div>
                <div className="rounded-xl border-4 border-sky-950 bg-yellow-300 px-4 py-2 text-xl font-black text-sky-950 shadow-[4px_4px_0_rgba(8,47,73,0.14)] sm:text-2xl">
                  {page.sound}
                </div>
              </div>

              <div className="book-page-body grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                <div className="book-art relative min-h-[360px] overflow-hidden rounded-2xl border-4 border-sky-950 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.85)_0_10%,transparent_11%),linear-gradient(135deg,#fef3c7_0%,#ffe4e6_45%,#bae6fd_100%)] bg-[length:32px_32px,auto] p-4 sm:min-h-[430px] sm:p-5">
                  {visiblePageArtwork && (
                    <img
                      src={visiblePageArtwork}
                      alt={`${story.title}: ${page.title}`}
                      onError={() => setFailedArtwork((current) => ({ ...current, [visiblePageArtwork]: true }))}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {!visiblePageArtwork && (
                    <StoryArtPlaceholder
                      heroType={heroType}
                      heroName={heroName}
                      initials={heroMark}
                      pageTitle={page.title}
                      showFaceZone
                    />
                  )}
                  {visiblePageArtwork && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.18)_62%,rgba(255,255,255,0.72)_100%)]" />}
                  <div className="relative grid h-full min-h-[390px] place-items-center text-center">
                  </div>
                </div>

                <div className="book-copy-column grid gap-4">
                  <div className="book-scene-text rounded-2xl border-4 border-sky-950 bg-white p-5 shadow-[5px_5px_0_rgba(8,47,73,0.12)]">
                    <p className="text-lg font-black leading-8 text-sky-950">{page.scene}</p>
                  </div>

                  <div className="book-panels grid gap-4">
                    {page.panels.map((panel, index) => (
                      <div key={`${page.id}-${panel}`} className="book-panel rounded-2xl border-4 border-sky-950 bg-white p-4 shadow-[5px_5px_0_rgba(8,47,73,0.12)]">
                        <p className="text-base font-bold leading-7 text-slate-700">{panel}</p>
                        {page.speech[index] && (
                          <div className="mt-3 rounded-[1.5rem] rounded-bl-sm border-2 border-sky-900 bg-amber-50 px-4 py-3 text-base font-black text-sky-950">
                            "{page.speech[index]}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t-2 border-sky-100 pt-3 text-xs font-black uppercase tracking-wide text-sky-800">
                <span>Little Legends Story</span>
                <span>Page {page.pageNumber}</span>
              </div>
            </section>
          )
        })}

        <section className="book-page print-page overflow-hidden rounded-[2rem] border-4 border-sky-950 bg-[#fffdf5] p-6 text-center shadow-[10px_10px_0_rgba(8,47,73,0.16)] sm:p-8">
          <div className="book-ending-inner grid min-h-[520px] place-items-center rounded-[1.5rem] border-4 border-sky-950 bg-[linear-gradient(135deg,#fff7ed_0%,#ecfeff_52%,#fef3c7_100%)] p-6">
            <div className="mx-auto max-w-2xl">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-white bg-rose-100 text-rose-500 shadow-xl">
                <Heart className="h-12 w-12 fill-rose-400" />
              </div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-rose-500">The end</p>
              <h2 className="mt-3 text-4xl font-black uppercase leading-tight text-sky-950 sm:text-6xl">
                {heroName} stayed brave, kind, and full of wonder.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg font-bold leading-8 text-slate-700">
                This story was made to be read aloud, kept close, and returned to whenever bedtime needs a little more magic.
              </p>
              <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-3">
                {["Brave", "Kind", "Clever"].map((word) => (
                  <div key={word} className="rounded-2xl border-2 border-sky-100 bg-white/86 px-4 py-3 text-sm font-black text-sky-900">
                    <Star className="mx-auto mb-2 h-5 w-5 fill-amber-300 text-amber-400" />
                    {word}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const stepLabels: Record<Step, string> = {
    welcome: "Welcome",
    gender: "Hero",
    name: "Name",
    upload: "Photos",
    character: "Power",
    story: "Preview",
    checkout: "Order",
    "full-story": "Story",
  }

  return (
    <div className={`${currentStep === "welcome" ? "min-h-[100svh]" : "min-h-screen"} overflow-x-hidden storybook-app-bg`}>
      <div className={`container mx-auto px-3 sm:px-4 ${currentStep === "welcome" ? "flex min-h-[100svh] flex-col py-2 sm:py-3" : "py-5 sm:py-8"}`}>
        <div className={`flex items-center justify-between ${currentStep === "welcome" ? "mx-auto mb-3 w-full max-w-6xl shrink-0" : "mb-6"}`}>
          <button
            type="button"
            onClick={() => setCurrentStep("welcome")}
            className="flex items-center space-x-2 rounded-full bg-white/60 py-1 pr-3 backdrop-blur transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
            aria-label="Return to the Little Legends start page"
          >
            <Heart className="h-8 w-8 fill-rose-400 text-rose-500" />
            <span className="text-xl font-black text-sky-950 sm:text-2xl">Little Legends</span>
          </button>
          {currentStep !== "welcome" && currentStep !== "gender" && (
            <Button
              onClick={goBack}
              variant="outline"
              className="rounded-full border-sky-200 bg-white/85 px-4 font-black text-sky-700 hover:bg-white"
            >
              ← Back
            </Button>
          )}
        </div>

        {currentStep !== "welcome" && (
          <div className="mx-auto mb-5 flex w-full max-w-6xl items-center justify-between rounded-full border border-white/80 bg-white/72 px-3 py-2 text-xs font-black uppercase tracking-wide text-sky-800 shadow-sm backdrop-blur sm:px-4">
            <span>{stepLabels[currentStep]}</span>
            <span className="text-slate-500">Little Legends</span>
          </div>
        )}

        {checkoutReturnMessage && (
          <div className="mx-auto mb-5 w-full max-w-6xl rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black leading-6 text-amber-900 shadow-sm">
            {checkoutReturnMessage}
          </div>
        )}

        <div className={`${currentStep === "welcome" ? "mx-auto w-full max-w-6xl flex-1" : "mx-auto max-w-6xl"}`}>
          {currentStep === "welcome" && renderWelcome()}
          {currentStep === "gender" && renderGenderSelection()}
          {currentStep === "name" && renderNameSelection()}
          {currentStep === "upload" && renderUpload()}
          {currentStep === "character" && renderCharacterSelection()}
          {currentStep === "story" && renderStory()}
          {currentStep === "checkout" && renderCheckout()}
          {currentStep === "full-story" && renderFullStory()}
        </div>
      </div>
    </div>
  )
}
