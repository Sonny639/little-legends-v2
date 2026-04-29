import { type CharacterStory, type StoryPage, type StoryPathChoice } from "@/lib/stories"

export type ResolvedStoryPage = StoryPage & {
  pageNumber: number
}

export const resolveFullStoryPages = (
  story: CharacterStory,
  selectedChoices: StoryPathChoice[],
): ResolvedStoryPage[] => {
  const resolvedPages: ResolvedStoryPage[] = []
  const visitedPageIds = new Set<string>()
  let currentPageId = "start"

  while (resolvedPages.length < 12) {
    const currentPage = story.pages[currentPageId]

    if (!currentPage || visitedPageIds.has(currentPage.id)) break

    resolvedPages.push({ ...currentPage, pageNumber: resolvedPages.length + 1 })
    visitedPageIds.add(currentPage.id)

    if (currentPage.id === "full-ending") break

    const selectedChoice = selectedChoices.find((choice) => choice.pageId === currentPage.id)
    const selectedNextPageId = selectedChoice
      ? currentPage.choices.find((choice) => choice.id === selectedChoice.choiceId)?.nextPageId
      : undefined
    const fallbackNextPageId = currentPage.choices.find(
      (choice) => choice.nextPageId !== "start" && choice.nextPageId !== "purchase",
    )?.nextPageId
    const nextPageId = selectedNextPageId || fallbackNextPageId

    if (!nextPageId || nextPageId === "start" || nextPageId === "purchase") break

    currentPageId = nextPageId
  }

  return resolvedPages
}
