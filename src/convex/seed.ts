import type { Id } from "./_generated/dataModel"
import { internalMutation } from "./_generated/server"

// =================================================================
// Seed Data
// =================================================================

const SIGNATURES = [
  {
    name: "Dara Khosrowshahi",
    title: "CEO",
    company: "Uber",
    because: "the Iranian people deserve the same freedoms we take for granted",
    commitment:
      "hiring 50 Iranian engineers and investing $10M in Iranian-founded startups over the next 100 days",
    pinned: true,
  },
  {
    name: "Omid Kordestani",
    title: "Executive Chairman",
    company: "Twitter",
    because: "my homeland's potential has been suppressed for too long",
    commitment:
      "mentoring 25 Iranian founders and opening our accelerator program to Iranian applicants",
    pinned: true,
  },
  {
    name: "Farzad Nazem",
    title: "Former CTO",
    company: "Yahoo",
    because: "technology can be a force for freedom",
    commitment: "committing $5M to fund infrastructure projects that connect Iranians to the world",
    pinned: true,
  },
  {
    name: "Anousheh Ansari",
    title: "CEO",
    company: "XPRIZE Foundation",
    because: "I've seen what Iranians can achieve when given the opportunity",
    commitment: "launching a $1M prize for Iranian innovators solving humanitarian challenges",
    pinned: true,
  },
  {
    name: "Pierre Omidyar",
    title: "Founder",
    company: "eBay",
    commitment:
      "our foundation will allocate $20M toward digital freedom tools and civic tech for Iran",
    pinned: true,
  },
  {
    name: "Shervin Pishevar",
    title: "Co-Founder",
    company: "Hyperloop One",
    because: "innovation knows no borders",
    commitment: "investing in 10 Iranian-founded startups this year",
    pinned: false,
  },
  {
    name: "Ali Partovi",
    title: "CEO",
    company: "Neo",
    because: "education is the great equalizer",
    commitment:
      "offering 100 full scholarships to Iranian students for our computer science programs",
    pinned: false,
  },
  {
    name: "Hadi Partovi",
    title: "CEO",
    company: "Code.org",
    because: "every child deserves to learn to code, regardless of where they're born",
    commitment: "translating all Code.org curriculum to Farsi and training 500 Iranian teachers",
    pinned: false,
  },
  {
    name: "Maryam Mirzakhani Foundation",
    title: "Director",
    company: "Stanford Mathematics",
    commitment: "establishing 20 graduate fellowships for Iranian women in STEM",
    pinned: false,
  },
  {
    name: "Saeed Amidi",
    title: "Founder",
    company: "Plug and Play",
    because: "Silicon Valley was built by immigrants. Iran has incredible talent",
    commitment:
      "opening our accelerator to 50 Iranian startups with full support and no equity taken",
    pinned: false,
  },
  {
    name: "Navid Alipour",
    title: "Managing Partner",
    company: "Analytics Ventures",
    because: "data science can solve Iran's biggest challenges",
    commitment: "pro-bono consulting for 10 Iranian healthcare and climate startups",
    pinned: false,
  },
  {
    name: "Shirin Dehghani",
    title: "CEO",
    company: "Idex Biometrics",
    because: "identity and security are fundamental rights",
    commitment:
      "donating biometric security technology to protect Iranian activists and journalists",
    pinned: false,
  },
  {
    name: "Reza Malekzadeh",
    title: "Partner",
    company: "Partech Ventures",
    because: "European VCs must step up for Iranian founders",
    commitment: "dedicating €2M of our fund specifically for Iranian-founded companies",
    pinned: false,
  },
  {
    name: "Sara Naseri",
    title: "CEO",
    company: "Qurasense",
    because: "healthcare innovation should reach everyone",
    commitment: "licensing our diagnostic technology royalty-free for Iranian hospitals",
    pinned: false,
  },
  {
    name: "Babak Parviz",
    title: "VP",
    company: "Amazon",
    because: "I still remember the dreams we had as students in Tehran",
    commitment: "establishing an engineering fellowship program for 30 Iranian graduates",
    pinned: false,
  },
  {
    name: "Salar Kamangar",
    title: "Former CEO",
    company: "YouTube",
    because: "free expression is everything",
    commitment: "funding digital literacy programs reaching 100,000 young Iranians",
    pinned: false,
  },
  {
    name: "Arash Ferdowsi",
    title: "Co-Founder",
    company: "Dropbox",
    because: "access to information is a human right",
    commitment: "providing free Dropbox accounts to Iranian universities and research institutions",
    pinned: false,
  },
  {
    name: "Hosain Rahman",
    title: "Former CEO",
    company: "Jawbone",
    because: "hardware startups need more support",
    commitment: "opening a hardware lab in Dubai accessible to Iranian entrepreneurs",
    pinned: false,
  },
  {
    name: "Pardis Sabeti",
    title: "Professor",
    company: "Harvard / Broad Institute",
    because: "science transcends politics",
    commitment:
      "training 50 Iranian researchers in computational biology through virtual fellowships",
    pinned: false,
  },
  {
    name: "Darian Shirazi",
    title: "Founder",
    company: "Gradient Ventures",
    commitment: "investing $3M in AI startups with Iranian founders or co-founders",
    pinned: false,
  },
  {
    name: "Nima Ghamsari",
    title: "CEO",
    company: "Blend",
    because: "fintech can unlock economic opportunity",
    commitment: "building financial infrastructure tools for the Iranian diaspora",
    pinned: false,
  },
  {
    name: "Tina Sharkey",
    title: "Co-Founder",
    company: "Brandless",
    because: "commerce should be accessible to all",
    commitment: "mentoring 20 Iranian e-commerce founders",
    pinned: false,
  },
  {
    name: "Amir Efrati",
    title: "Co-Founder",
    company: "The Information",
    because: "journalism and truth matter",
    commitment:
      "providing free subscriptions to Iranian journalists and launching a fellowship program",
    pinned: false,
  },
  {
    name: "Kambiz Foroohar",
    title: "Senior Editor",
    company: "Bloomberg",
    because: "economic freedom starts with information",
    commitment: "publishing a monthly series highlighting Iranian business innovation",
    pinned: false,
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

    const signatureIds: Id<"signatures">[] = []

    for (const signature of SIGNATURES) {
      // Create a fake user for each signature
      const userId = await ctx.db.insert("users", {})

      // Generate a fake phone hash (just for testing)
      const phoneHash = await generateFakePhoneHash(signature.name)

      // Create the signature
      const signatureId = await ctx.db.insert("signatures", {
        userId,
        name: signature.name,
        title: signature.title,
        company: signature.company,
        phoneHash,
        because: signature.because,
        commitment: signature.commitment,
        pinned: signature.pinned,
        upvoteCount: Math.floor(Math.random() * 100), // Random upvotes for variety
        referredBy: undefined,
      })

      signatureIds.push(signatureId)
    }

    // Add some referral relationships (later signatures referred by earlier ones)
    for (let i = 6; i < signatureIds.length; i++) {
      if (Math.random() > 0.5) {
        const referrerIndex = Math.floor(Math.random() * 6) // Referred by one of first 6
        await ctx.db.patch(signatureIds[i], {
          referredBy: signatureIds[referrerIndex],
        })
      }
    }

    console.log(`Seeded ${signatureIds.length} signatures.`)
    return { seeded: true, count: signatureIds.length }
  },
})

/**
 * Clears all seed data (signatures and their users).
 * Useful for resetting the database during development.
 *
 * Run with: npx convex run seed:clear
 */
export const clear = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete all upvotes first (foreign key constraint)
    const upvotes = await ctx.db.query("upvotes").collect()
    for (const upvote of upvotes) {
      await ctx.db.delete(upvote._id)
    }

    // Delete all signatures and their associated users
    const signatures = await ctx.db.query("signatures").collect()
    for (const signature of signatures) {
      await ctx.db.delete(signature.userId)
      await ctx.db.delete(signature._id)
    }

    console.log(`Cleared ${signatures.length} signatures and ${upvotes.length} upvotes.`)
    return { cleared: true, signatures: signatures.length, upvotes: upvotes.length }
  },
})

// =================================================================
// Helpers
// =================================================================

/**
 * Generates a fake SHA256-like hash from a string.
 * This is NOT cryptographically secure - just for test data.
 */
async function generateFakePhoneHash(seed: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(seed + Date.now().toString() + Math.random().toString())
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
