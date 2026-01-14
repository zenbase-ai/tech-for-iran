import { sum } from "es-toolkit"
import { pmap } from "@/lib/utils"
import { internalMutation as rawInternalMutation } from "./_generated/server"
import { internalMutation } from "./_helpers/server"
import { signatureCount, signatureReferrals, upvoteCount } from "./aggregates"

// =================================================================
// Seed Data
// =================================================================

const SIGNATURES = [
  {
    xUsername: "daborator",
    name: "Dara Khosrowshahi",
    title: "CEO",
    company: "Uber",
    because: "the Iranian people deserve the same freedoms we take for granted",
    commitment:
      "hiring 50 Iranian engineers and investing $10M in Iranian-founded startups over the next 100 days",
    pinned: true,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "omikimon",
    name: "Omid Kordestani",
    title: "Executive Chairman",
    company: "Twitter",
    because: "my homeland's potential has been suppressed for too long",
    commitment:
      "mentoring 25 Iranian founders and opening our accelerator program to Iranian applicants",
    pinned: true,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "faborator",
    name: "Farzad Nazem",
    title: "Former CTO",
    company: "Yahoo",
    because: "technology can be a force for freedom",
    commitment: "committing $5M to fund infrastructure projects that connect Iranians to the world",
    pinned: true,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "AnoushehAnsari",
    name: "Anousheh Ansari",
    title: "CEO",
    company: "XPRIZE Foundation",
    because: "I've seen what Iranians can achieve when given the opportunity",
    commitment: "launching a $1M prize for Iranian innovators solving humanitarian challenges",
    pinned: true,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "paborator",
    name: "Pierre Omidyar",
    title: "Founder",
    company: "eBay",
    commitment:
      "our foundation will allocate $20M toward digital freedom tools and civic tech for Iran",
    pinned: true,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "sheraborator",
    name: "Shervin Pishevar",
    title: "Co-Founder",
    company: "Hyperloop One",
    because: "innovation knows no borders",
    commitment: "investing in 10 Iranian-founded startups this year",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "apartovi",
    name: "Ali Partovi",
    title: "CEO",
    company: "Neo",
    because: "education is the great equalizer",
    commitment:
      "offering 100 full scholarships to Iranian students for our computer science programs",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "hadip",
    name: "Hadi Partovi",
    title: "CEO",
    company: "Code.org",
    because: "every child deserves to learn to code, regardless of where they're born",
    commitment: "translating all Code.org curriculum to Farsi and training 500 Iranian teachers",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "mirzakhani_fdn",
    name: "Maryam Mirzakhani Foundation",
    title: "Director",
    company: "Stanford Mathematics",
    commitment: "establishing 20 graduate fellowships for Iranian women in STEM",
    pinned: false,
    expert: true,
    category: "academics",
  },
  {
    xUsername: "saeedamidi",
    name: "Saeed Amidi",
    title: "Founder",
    company: "Plug and Play",
    because: "Silicon Valley was built by immigrants. Iran has incredible talent",
    commitment:
      "opening our accelerator to 50 Iranian startups with full support and no equity taken",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "navidalipour",
    name: "Navid Alipour",
    title: "Managing Partner",
    company: "Analytics Ventures",
    because: "data science can solve Iran's biggest challenges",
    commitment: "pro-bono consulting for 10 Iranian healthcare and climate startups",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "shirindehghani",
    name: "Shirin Dehghani",
    title: "CEO",
    company: "Idex Biometrics",
    because: "identity and security are fundamental rights",
    commitment:
      "donating biometric security technology to protect Iranian activists and journalists",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "rezamalekzadeh",
    name: "Reza Malekzadeh",
    title: "Partner",
    company: "Partech Ventures",
    because: "European VCs must step up for Iranian founders",
    commitment: "dedicating €2M of our fund specifically for Iranian-founded companies",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "saranaseri",
    name: "Sara Naseri",
    title: "CEO",
    company: "Qurasense",
    because: "healthcare innovation should reach everyone",
    commitment: "licensing our diagnostic technology royalty-free for Iranian hospitals",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "babakparviz",
    name: "Babak Parviz",
    title: "VP",
    company: "Amazon",
    because: "I still remember the dreams we had as students in Tehran",
    commitment: "establishing an engineering fellowship program for 30 Iranian graduates",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "saborator",
    name: "Salar Kamangar",
    title: "Former CEO",
    company: "YouTube",
    because: "free expression is everything",
    commitment: "funding digital literacy programs reaching 100,000 young Iranians",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "araborator",
    name: "Arash Ferdowsi",
    title: "Co-Founder",
    company: "Dropbox",
    because: "access to information is a human right",
    commitment: "providing free Dropbox accounts to Iranian universities and research institutions",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "hosainrahman",
    name: "Hosain Rahman",
    title: "Former CEO",
    company: "Jawbone",
    because: "hardware startups need more support",
    commitment: "opening a hardware lab in Dubai accessible to Iranian entrepreneurs",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "pardaborator",
    name: "Pardis Sabeti",
    title: "Professor",
    company: "Harvard / Broad Institute",
    because: "science transcends politics",
    commitment:
      "training 50 Iranian researchers in computational biology through virtual fellowships",
    pinned: false,
    expert: true,
    category: "academics",
  },
  {
    xUsername: "daboratorian",
    name: "Darian Shirazi",
    title: "Founder",
    company: "Gradient Ventures",
    commitment: "investing $3M in AI startups with Iranian founders or co-founders",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "naborator",
    name: "Nima Ghamsari",
    title: "CEO",
    company: "Blend",
    because: "fintech can unlock economic opportunity",
    commitment: "building financial infrastructure tools for the Iranian diaspora",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "tinasharkey",
    name: "Tina Sharkey",
    title: "Co-Founder",
    company: "Brandless",
    because: "commerce should be accessible to all",
    commitment: "mentoring 20 Iranian e-commerce founders",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "amirefrati",
    name: "Amir Efrati",
    title: "Co-Founder",
    company: "The Information",
    because: "journalism and truth matter",
    commitment:
      "providing free subscriptions to Iranian journalists and launching a fellowship program",
    pinned: false,
    expert: true,
    category: "tech",
  },
  {
    xUsername: "kaborator",
    name: "Kambiz Foroohar",
    title: "Senior Editor",
    company: "Bloomberg",
    because: "economic freedom starts with information",
    commitment: "publishing a monthly series highlighting Iranian business innovation",
    pinned: false,
    expert: true,
    category: "tech",
  },
]

// =================================================================
// Internal Mutations
// =================================================================

/**
 * Seeds the database with test signatures.
 * Creates fake users and signatures for development/testing.
 *
 * Run with: npx convex run seed:seed
 */
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if we already have signatures
    const existing = await ctx.db.query("signatures").first()
    if (existing) {
      console.log("Database already seeded. Skipping.")
      return { seeded: false, count: 0 }
    }

    const signatureIds = await pmap(
      SIGNATURES,
      async (signature) => await ctx.db.insert("signatures", { upvoteCount: 0, ...signature })
    )

    // Add some referral relationships (later signatures referred by earlier ones)
    for (let i = 6; i < signatureIds.length; i++) {
      if (Math.random() > 0.5) {
        const referrerIndex = Math.floor(Math.random() * 6) // Referred by one of first 6
        await ctx.db.patch(signatureIds[i], {
          referredBy: signatureIds[referrerIndex],
        })
      }
    }

    // Create random upvotes for each signature
    const upvotes = sum(
      await pmap(signatureIds, async (signatureId) => {
        const numUpvotes = Math.floor(Math.random() * 20) + 1 // 1-20 upvotes per signature
        for (let i = 0; i < numUpvotes; i++) {
          await ctx.db.insert("upvotes", {
            signatureId,
            anonId: `seed-anon-${signatureId}-${i}`,
          })
        }
        // Update the denormalized upvoteCount on the signature
        await ctx.db.patch(signatureId, { upvoteCount: numUpvotes })
        return numUpvotes
      })
    )

    const count = signatureIds.length
    console.log(`Seeded ${count} signatures and ${upvotes} upvotes.`)
    return { seeded: true, count, upvotes }
  },
})

/**
 * Clears all seed data (signatures and upvotes).
 * Useful for resetting the database during development.
 * Uses raw mutation (no triggers) to avoid aggregate sync issues.
 *
 * Run with: npx convex run seed:clear
 */
export const clear = rawInternalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete all upvotes first (foreign key constraint)
    const upvotes = await ctx.db.query("upvotes").collect()
    for (const upvote of upvotes) {
      await ctx.db.delete(upvote._id)
    }

    // Delete all signatures
    const signatures = await ctx.db.query("signatures").collect()
    for (const signature of signatures) {
      await ctx.db.delete(signature._id)
    }

    // Clear the aggregates (since we bypassed triggers)
    await signatureCount.clear(ctx)
    await signatureReferrals.clearAll(ctx) // Namespaced aggregate needs clearAll
    await upvoteCount.clear(ctx)

    console.log(`Cleared ${signatures.length} signatures and ${upvotes.length} upvotes.`)
    return { cleared: true, signatures: signatures.length, upvotes: upvotes.length }
  },
})
