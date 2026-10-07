import { redirect } from "next/navigation"

// This was a menu: "What do you need right now? Pick one", and two cards.
//
// It asked someone to classify themselves before the app did anything for
// them, which is the hardest question to answer when you are tired and it is
// getting dark. Nothing in the app linked here, so in practice it was a page
// you could only reach by typing the URL.
//
// Seeing real places is the useful first step for almost everyone who opens
// True Roof, and it needs no account and no self-classification. The questions
// that narrow the list, and the after-you-are-housed path, are both offered
// from there in context. The redirect stays so an old bookmark still lands
// somewhere useful.
export default function GetStartedPage() {
  redirect("/places")
}
