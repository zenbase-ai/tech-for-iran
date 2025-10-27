LinkedIn Squad Engagement Automation – Technical Spec

Overview and Goals

This project is an engagement automation tool for LinkedIn, targeted at groups (squads) of users such as YC (Y Combinator) alumni. The core idea is that when one member posts on LinkedIn, a selection of other members in the squad will automatically react (e.g. "Like", "Insightful", "Celebrate", etc.) to that post. This boosts engagement by having squad members upvote and potentially comment on each other's posts. We will build a Next.js web application with Clerk for authentication and Convex for the real-time database, and leverage Unipile (a third-party LinkedIn integration API) to perform LinkedIn actions on behalf of users. Background tasks (scheduling delayed reactions) will be handled using Vercel's Workflow DevKit (the use workflow library) for durable, reliable asynchronous jobs.

Key Objectives:
	•	User Authentication & Onboarding: Invite users via a squad link, allow them to sign up using Clerk authentication (email/password, OAuth providers, or magic links). Require each user to connect their LinkedIn account through Unipile's hosted auth flow before fully joining the squad.
	•	Post Engagement Workflow: Provide a form for a user to submit the URL of a new LinkedIn post they made and select desired reaction types (Like, Celebrate, Insightful, etc.). When submitted, the system will schedule approximately 40 reactions from other squad members’ LinkedIn accounts over the next few minutes (with slight random delays between them to mimic organic engagement).
	•	Squad Management: Support multiple squads in the backend design (with a squads table and membership relationships), but initially the UI will assume a single global squad called “YC Alumni” that everyone joins via the invite link. Anyone with the invite link can join (no further approval needed).
	•	Engagement Limits: Allow each user to configure a maximum number of automated engagements per day (e.g. default 40). The system must ensure no user’s LinkedIn account performs more than that number of reactions per day on others’ posts, to avoid triggering LinkedIn’s anti-abuse mechanisms.
	•	Future Extensibility: Design with future features in mind, notably an AI-powered auto-commenting feature (where the system would generate and post context-relevant comments via AI on behalf of squad members). This will not be implemented now, but the architecture should allow adding it later (likely as an additional workflow step per engagement).

Tech Stack and Components

Next.js 13+: Serves the web UI and API routes. We will use the App Router with React for pages and Next's built-in API routes for server-side logic (particularly to start workflows and handle webhooks).

Clerk: Provides modern authentication with support for email/password, OAuth providers (Google, GitHub, etc.), and magic links. Clerk handles all user management, sessions, and security. User authentication state is seamlessly integrated with both Next.js (via middleware) and Convex (via JWT verification).

Convex: Provides a real-time, document-oriented database with type-safe queries and mutations. Convex automatically handles real-time subscriptions, optimistic updates, and state management. All application data (user profiles, LinkedIn account info, squads, posts, engagements log) is stored in Convex. Convex Auth integrates with Clerk via JWT verification, ensuring secure access to data based on user identity.

Unipile API (LinkedIn integration): Allows us to programmatically log into users’ LinkedIn accounts and perform actions like reacting to posts. We will use Unipile’s Hosted Auth Wizard for LinkedIn to connect accounts easily
developer.unipile.com
. Once an account is connected, Unipile provides an account_id that we can use to make API calls (like adding a reaction) on behalf of that LinkedIn account. We must securely manage an API key for Unipile and never expose it on the client side
developer.unipile.com
.

Workflow DevKit (useworkflow.dev): Used for scheduling and executing background jobs in Next.js. By marking our functions with the "use workflow" directive, we get durability and automatic state persistence for long-running tasks
useworkflow.dev
. This will enable us to queue up reactions over time without blocking any request/response cycle. The Workflow library handles retrying failed steps and allows using await sleep() for delays without consuming resources
useworkflow.dev
.

User Flow 1: Squad Invitation, Signup, and LinkedIn Connect

1. Invitation & Signup: Initially, the admin (or system) generates an invite link for the “YC Alumni” squad (for now this could be a static link or token since we allow open joining via the link). When a new user clicks the invite link, they are brought to our Next.js app’s signup page. There, they enter their email. We use Supabase Auth (Magic Link/OTP) to sign them in passwordlessly. Supabase supports sending either a Magic Link or a One-Time Password (OTP) code to the email
supabase.com
. By default, calling the supabase.auth.signInWithOtp({ email }) method will send a magic link email (the method name is OTP but it sends a magic link unless configured otherwise)
supabase.com
. We can optionally configure Supabase to send a 6-digit code instead by editing the email template to include {{ .Token }} instead of the confirmation URL
supabase.com
 – this would allow the user to enter a “magic code” on the site, aligning with the “magic code” experience if desired. For now, a magic link is acceptable, but we note the option to use a code. When the user clicks the magic link (or enters the code), their Supabase session is established and they are authenticated in our app. Supabase will create a new user record (with a unique UUID) automatically upon first sign-in if one doesn’t exist
supabase.com
.

2. Profile Setup – Connect LinkedIn: After email sign-in, the user is taken to a setup page prompting them to connect their LinkedIn account. We integrate Unipile’s Hosted Auth Wizard for this. When the user clicks “Connect LinkedIn”, our Next.js backend generates a one-time Hosted Auth link via Unipile’s API
developer.unipile.com
developer.unipile.com
. Specifically, our server will call Unipile’s POST /api/v1/hosted/accounts/link endpoint with parameters:

type: "create" (new account connection)

providers: ["LINKEDIN"] (we only want LinkedIn in the wizard)

expiresOn: a timestamp a few minutes in the future (short-lived link)

success_redirect_url: URL in our app to redirect on success (e.g. a “LinkedIn connected” page)

failure_redirect_url: URL in our app for failure cases

notify_url: a webhook endpoint in our app to receive the result

name: an identifier for the user (we will pass the Supabase user’s UID or some internal ID here)

The Hosted Auth Wizard link that Unipile returns (in a JSON response with an url field
developer.unipile.com
) will be sent back to the client or the client will be redirected to it. The user will then see Unipile’s LinkedIn login UI (hosted by Unipile) where they can enter their LinkedIn credentials and solve any verification (LinkedIn may present CAPTCHA or 2FA if needed). This hosted flow significantly simplifies integration, as it’s a secure, pre-built interface for authentication
developer.unipile.com
, supporting any needed checkpoint (2FA, OTP, Captcha) handling through Unipile’s platform.

3. Post-Auth Callback: Once the user successfully logs into LinkedIn via Unipile, Unipile will redirect them to our specified success URL (bringing them back into our app UI), and critically, Unipile will send a server-to-server webhook call to our notify_url endpoint with details of the new connection
developer.unipile.com
. The payload of this webhook contains at least an account_id (the Unipile identifier for that LinkedIn account) and the name we provided (so we know which user it belongs to)
developer.unipile.com
. For example, Unipile sends:

{
  "status": "CREATION_SUCCESS",
  "account_id": "e54m8LR22bA7G5qsAc8w",
  "name": "myuser1234"
}


developer.unipile.com

Our Next.js API route (e.g. /api/unipile/callback) will handle this webhook. It will look up the user by the name/ID, then store the returned account_id in the database, associated with that user’s profile. We will likely have a users (or profiles) table in Supabase where we add fields for unipile_account_id (LinkedIn account) and maybe a flag that LinkedIn is connected. At this point, the user’s onboarding is complete – they are in the “YC Alumni” squad (we create a membership record for them in a squad_members table linking to the squad) and their LinkedIn account is linked for automation. Only users who have connected LinkedIn should be considered active squad members (we will enforce that in the UI and in scheduling logic).

Dedupe on join: (Clarification point 3: “Yes dedupe”) – We will ensure that if a user somehow clicks the invite link multiple times or tries to sign up twice with the same email, they won’t be duplicated in the squad. Supabase will prevent duplicate accounts for the same email by default, and we’ll ensure our squad_members table doesn’t create duplicate entries for the same user.

User Flow 2: Submitting a Post for Squad Engagement

Once onboarded, a user can request engagements on their LinkedIn post via the app:

1. New Post Submission: The user creates a post on LinkedIn as usual (outside of our system). To initiate squad engagement, they copy the LinkedIn post’s URL and go to our Next.js app’s main page (which, given a single global squad, might just be a simple dashboard for “YC Alumni”). There, they click “New Post Engagement” (for example) and paste the LinkedIn post URL into a form. They also select which reaction types they want from their squad. We will present a list of possible LinkedIn reaction types with checkboxes (e.g. 👍 Like, 🎉 Celebrate, 💗 Love, 💡 Insightful, 👏 Support, 😂 Funny). LinkedIn officially supports reactions including Like, Celebrate, Love, Insightful, Support, and Funny
learn.microsoft.com
 (note: “Curious” was a reaction in the past but has been deprecated in favor of Funny
learn.microsoft.com
). The user can choose one or multiple types; for instance, they might select “Like” and “Insightful” only, if they prefer those reactions on their post.

2. Queue Engagements: When the user submits this form, it triggers a Next.js API route (e.g. POST /api/engagements) that kicks off the background workflow to deliver reactions. The request includes the current user’s ID (from session), the post URL, and the selected reaction types. The API handler will do minimal processing synchronously – mainly, it may parse the LinkedIn URL to extract a post identifier, and then call the Workflow DevKit to start a new workflow. For example, using the workflow library:

// In /api/engagements/route.ts (assuming Next.js App Router file structure)
import { start } from 'workflow/api';
import { handlePostEngagement } from '@/workflows/handlePostEngagement';
import { currentUser } from '@clerk/nextjs/server';
import { getConvexClient } from '@/lib/convex/server';
import { api } from '@/convex/_generated/api';

export async function POST(request: Request) {
  const { postUrl, reactions } = await request.json();
  const user = await currentUser(); // from Clerk auth session
  const convex = await getConvexClient();

  // Get user profile from Convex
  const profile = await convex.query(api.queries.getUserProfile, {
    clerkUserId: user.id
  });

  // Launch the engagement workflow asynchronously (does not block response)
  await start(handlePostEngagement, [profile._id, postUrl, reactions]);
  return NextResponse.json({ status: 'scheduled' });
}


Using start() this way initiates the handlePostEngagement workflow function and immediately returns; it does not block the API response
useworkflow.dev
. The client gets a response that the engagement has been scheduled (we can show a confirmation UI). The heavy lifting now happens asynchronously in the workflow.

3. Workflow: Distributing Reactions – The handlePostEngagement workflow will implement the logic of selecting squad members and posting reactions. Pseudocode for this workflow function could look like:

export async function handlePostEngagement(userId: string, postUrl: string, reactions: string[]) {
  "use workflow";  // marks this function as a durable workflow
  const convex = await getConvexClient();

  // Step 1: Determine target post ID or URN from the URL
  const postURN = await getPostURN(postUrl);  // from @/lib/linkedin/post-urn

  // Step 2: Get user's squad and fetch available members
  const squadId = GLOBAL_SQUAD_ID; // From Convex query
  const availableMembers = await convex.query(api.queries.getAvailableSquadMembers, {
    squadId,
    excludeUserId: userId
  });

  // Step 3: Randomly pick up to N members (e.g. 40) from available pool
  // Note: availableMembers query already filters by daily limit and LinkedIn connection
  const N = configuredEngagementCount || 40;
  const chosenMembers = pickRandom(availableMembers, N);

  // Step 4: For each chosen member, schedule a reaction
  for (const member of chosenMembers) {
    // Pick a random reaction type from the allowed types list
    const reactionType = randomChoice(reactions);

    // Execute the reaction via Unipile (step function)
    await sendReaction(member.userId, member.unipileAccountId, postURN, reactionType);

    // Sleep a random short interval (jitter) before next engagement
    const delaySec = randomIntBetween(5, 15);
    await sleep(`${delaySec}s`);
  }
}


Let’s break down the steps and considerations here:

Extracting Post Identifier: LinkedIn posts are identified by an urn:li:activity:<ID> or similar URN. If the user provides the full URL, we need to extract an identifier that Unipile can use. Unipile’s API for adding a reaction expects either the post’s ID/URN in the request. In their docs, to comment or react on a post, one must use the post’s social_id (URN)
developer.unipile.com
. We have a couple of ways to get this:

Parse the URL: Many LinkedIn post URLs contain the activity ID. For example: https://www.linkedin.com/posts/username_activity-7332661864792854528-abcdef – in this URL, 7332661864792854528 is the post’s internal ID. We could attempt to parse it out (this might be brittle if URL formats vary).

Use Unipile's Node SDK to handle things:
```
List Users' and Companies' LinkedIn Posts
await client.users.getAllPosts({
  account_id: 't5XY4yQzR9WVrlNFyzPMhw',
  identifier: 'user/company provider id',
});
Retrieve a LinkedIn post
await client.users.getPost({
  account_id: 't5XY4yQzR9WVrlNFyzPMhw',
  post_id: '7222176104768270337',
});
Create a LinkedIn Post
await client.users.createPost({
  account_id: 't5XY4yQzR9WVrlNFyzPMhw',
  text: 'post content',
});
Send Comments on LinkedIn Post
await client.users.sendPostComment({
  account_id: 't5XY4yQzR9WVrlNFyzPMhw',
  post_id: '7222176104768270337',
  text: 'comment',
});
List LinkedIn Post Comments
await client.users.getAllPostComments({
  account_id: 't5XY4yQzR9WVrlNFyzPMhw',
  post_id: '7222176104768270337',
});
Add reaction to a LinkedIn post
await client.users.sendPostReaction({
  account_id: 't5XY4yQzR9WVrlNFyzPMhw',
  post_id: '7222176104768270337',
  reaction_type: 'funny',
});
```

Use Unipile’s API to retrieve the post object: Unipile provides an endpoint GET /posts/{post_id} which can take a numeric ID (or share URL) plus an account_id to retrieve post data
developer.unipile.com
. We could call GET /posts/7332661864792854528?account_id=<someAccount> to get the post, which would return the social_id (URN)
developer.unipile.com
developer.unipile.com
. This requires an account_id to make the request (so we could use perhaps the author’s own account or any linked account to fetch it). However, since the user just gave us the link, we might skip this network call and do simple parsing if possible.

For our MVP, we can try to parse the activity:ID from the URL. If parsing fails, as a fallback the workflow could use one squad member’s account to call the retrieve API to get the URN. (We need the URN because the Add Reaction endpoint likely expects post_id as URN or an ID in the path/body; Unipile’s “Add reaction” reference suggests using a general endpoint with post identifiers).

Selecting Squad Members: We retrieve the list of members in the squad (from our Supabase DB). Since we currently have one global squad, this is straightforward (e.g., squad_id = 1 for YC Alumni). We filter out the user who made the post – we don’t want them reacting to their own post (LinkedIn doesn’t allow liking your own post anyway). Also filter out any members who have not connected a LinkedIn account (only those with a unipile_account_id are eligible, per requirement “Only if the LinkedIn account is connected!”).

Enforcing Daily Limits: For each member, we need to ensure they have not exceeded their daily engagement quota (default 40 per day, or a user-configured value). We will implement a check, e.g., each member’s profile in DB stores how many reactions they’ve done today. We could maintain a counter that resets daily, or log every reaction in an engagements_log table with timestamps and then count per 24h window. Simpler: have a field today_count and last_reset_date in the user profile. Each new day, the first time we check, if the date changed, reset the count. Then for each candidate member, if today_count >= max_daily_engagements (their configured max or default 40), we exclude them from this round. This ensures no account will do more than (say) 40 total reactions across all posts in one day. If a user has hit their limit, they simply won’t be chosen until the next day.

Randomized Selection: Out of the remaining pool, we choose up to N members to perform reactions. N can be default 40 or a number configured by the post author. The prompt suggests “configure e.g. 40 engagements max per day” and also mentions queueing up 40 engagements for a post over 5 minutes. We will assume the standard is 40 reactions on a post (if the squad has at least 40 other members available). If the squad is smaller than 40, then all available members will be used (but still limited by their individual daily caps). If the squad is much larger, we strictly use a random sample of size N to make it realistic and not always the same people. Randomization ensures fairness and that the engagement doesn’t look too coordinated. We will implement a random sampling function (e.g., Fisher-Yates shuffle or use a quick random pick algorithm). Additionally, we will dedupe within this selection (obviously ensure each member only appears once – our data structure naturally does that, but this addresses any possibility of accidental duplicates). This satisfies clarification “Randomized across squad members” and “Yes dedupe”.

Scheduling the Reactions: For each chosen member, the workflow will invoke a step to add a reaction via Unipile. We will have a helper function, perhaps sendReaction(accountId, postURN, reactionType), marked with "use step", which performs the API call to Unipile. This separation is important: marking it as a step means the actual HTTP request is done outside the main workflow stack (the workflow yields control while the step runs)
useworkflow.dev
. This is good because each API call can be treated as an isolated unit of work that can be retried if it fails. If Unipile’s API or network fails temporarily, the step will throw an error and the Workflow DevKit will automatically retry that step until it succeeds (or hits a retry limit)
useworkflow.dev
. This gives resilience to our engagement process – we won’t silently lose reactions due to transient errors. We might set a reasonable retry policy or max retries to avoid infinite attempts.

The sendReaction step will construct an HTTPS request to Unipile’s endpoint. According to Unipile, the endpoint to react to a post is:

POST /api/v1/posts/reaction


with JSON body containing the target post/comment and the account making the reaction
unipile.com
. We will include:

account_id: the Unipile account ID of the squad member who is reacting.

post_id or target: the identifier of the post to react to (likely the URN obtained earlier, e.g. "urn:li:activity:7332661864792854528"). Unipile might accept this URN either in the URL or body. In their docs, commenting uses /posts/{post_id}/comments format
developer.unipile.com
developer.unipile.com
, but reactions use a generic endpoint, probably expecting the post_id in the JSON. We’ll confirm via Unipile reference that we likely need to send something like { "account_id": "abc123", "post_id": "urn:li:activity:733266...", "reaction": "LIKE" }. (If needed, we can retrieve the exact field names from Unipile’s docs; the concept is that we tell it which LinkedIn account and what reaction type to add.)

reaction type/value: the type of reaction (e.g. "LIKE", "PRAISE", "INTEREST", etc.). Unipile will translate this to the corresponding LinkedIn reaction. (LinkedIn’s API expects values like LIKE, CELEBRATE, SUPPORT, LOVE, INSIGHTFUL, FUNNY – Unipile likely uses similar or their own mapping. We will use the common names; for example, user selecting “Insightful” we send something like "INTEREST" which is LinkedIn’s internal code for Insightful
learn.microsoft.com
.)

Unipile’s platform, having the LinkedIn session cookies from the earlier auth, will perform the reaction. This effectively automates a “Like” or other reaction from that member’s LinkedIn account on the target post. Using the Unipile API means we do not have to deal with the LinkedIn official API (which has very restrictive permissions) – Unipile handles the low-level interaction. We just need to ensure our requests include our Unipile API key in the header (X-API-KEY) and call the correct endpoint. Example: Unipile documentation notes: “Use the POST /posts/reaction method to engage with content by reacting directly to posts or comments, enhancing presence and interaction on the platform.”
unipile.com
. By providing the post’s identifier and the account_id, we can add a reaction. (If the target was a comment rather than a top-level post, presumably the same endpoint handles it by recognizing the URN as a comment URN. Our case is top-level posts.)

After each sendReaction step, we pause using a delay: await sleep("{X}s"). We will choose X as a random number of seconds (for example between 5 and 15 seconds) for jitter. This means not all reactions fire at the exact same interval or same time, making it look more organic. Over 40 reactions, spreading over ~5 minutes was suggested. If we use an average of ~7–8 seconds delay, 40 reactions will indeed span roughly 5 minutes. We will tune the min/max delay to achieve ~5 minutes total for 40 reactions. The sleep function in the workflow is perfect for this, as it suspends the workflow without holding any server resources during the wait
useworkflow.dev
. The workflow will simply wake up after the delay and continue with the next step.

This loop continues until all selected members have reacted (or possibly breaks early if an error is unrecoverable, but generally Workflow will retry steps so likely all go through eventually). We also ensure that each member only reacts once to this post (we’re iterating unique members, so no duplicates – dedupe ensured).

Updating State and Daily Count: Each time a reaction is successfully posted, we should update that member’s daily count in the database. This can be done within the same sendReaction step function (after the API call returns success). Because the step has full Node.js access, it can perform a DB query or call Supabase to increment the count
useworkflow.dev
. If that DB update fails for some reason, we might catch and handle it (maybe mark it as a non-retry fatal error if the reaction itself succeeded to avoid duplicate likes on retry). We’ll carefully design error handling so that a failed DB update doesn’t cause re-liking the post. One approach: mark the step as succeeded even if DB update failed, but schedule another attempt to update the counter. However, given the limited scope, we might assume the DB update will usually succeed and just log if not. (This is an edge case consideration).

4. Completion: After the workflow finishes scheduling all reactions, the post will have a flurry of engagements from the squad. From the user’s perspective, they submitted the link and can watch the reactions roll in over a few minutes on LinkedIn. We might provide in-app feedback like a status (“Engagements in progress...”) or a summary (“Your post has received 40 reactions from the squad!”). The workflow could send a completion event or update a status in the DB which the frontend can poll or subscribe to (though a simpler approach: just trust it completed after X minutes). Since this is asynchronous, a nice enhancement is to use Supabase Realtime or another mechanism to notify the client when done. That’s optional.

Database Design (Supabase)

Using Supabase’s Postgres, we will define tables to support the above flows. Key tables and their fields might be:

profiles (or users): One row per user, generally linked to Supabase auth. We can either use Supabase’s built-in auth.users table and a parallel profiles table or just extend the auth.users via a view. Commonly, Supabase recommends a public profiles table keyed by the auth.users.id. This table would include:

id (UUID, primary key, matches the Supabase auth user’s ID)

email (for reference, though also in auth.users)

unipile_account_id (text, the LinkedIn account identifier from Unipile, if connected)

linkedin_connected (boolean flag or we infer connected if unipile_account_id is not null)

daily_max_engagements (integer, default 40, user-configurable)

today_engagement_count (integer, count of reactions performed today)

last_engagement_reset (date or timestamp, to know when to reset count)

Other profile info if needed (name, etc., though not strictly necessary for this functionality)

squads: One row per squad/group of users. Fields:

id (int or UUID)

name (e.g. “YC Alumni”)

invite_code or invite_link (some token if we want to secure the invite, not strictly needed if one global public squad, but for future multiple squads it’s how we differentiate invite links)

Possibly created_by (owner) and other metadata if in future we have admins.

For the MVP, we will pre-create a squad “YC Alumni” (id=1). The invite link could simply be a static route (like our frontend checks a query param like ?squad=1&code=XYZ) – for now “just anyone with the link joins” means we’re not verifying the code; the link could simply point to the signup page for that squad. Simplicity: the invite URL could be https://ourapp.com/invite/yc-alumni which the app knows corresponds to squad 1.

squad_members: Join table between users and squads (many-to-many if a user can join multiple squads eventually). Fields:

user_id (UUID, references profiles.id)

squad_id (references squads.id)

joined_at (timestamp)

Unique constraint on (user_id, squad_id) to prevent duplicates.

When a user signs up via an invite link, we will create an entry here. For MVP with one squad, every new user gets an entry with squad_id = 1.

posts (optional): We might not need to persist posts, but it could be useful to log which posts were submitted for engagement, by whom and when. If implemented:

id (maybe an internal UUID or the LinkedIn post URN)

author_user_id

squad_id (which squad it was shared to – global squad in our case)

post_url (the link provided, for reference)

submitted_at

Perhaps status or engagement_count etc.

This table can help ensure we don’t process the exact same post twice (dedupe posts). For example, if the same user or another user accidentally tries to submit a post that was already handled, we can detect that via this table and prevent duplicate scheduling. Given “Yes dedupe” was emphasized, we interpret it both at the member selection level and at the post level – we should avoid duplicate engagements on the same post beyond the intended number. So if a post entry exists, we might alert “This post has already been engaged by the squad.” (However, it’s unlikely someone else would submit another’s post, but theoretically in a squad someone might share someone else’s post link – we could decide policy on that. Likely, only the author should trigger engagement on their own post).

engagements_log (optional): To track each reaction made, we could log entries:

id, post_id, reactor_user_id, reaction_type, timestamp.
This can be used for analytics or debugging. It’s also another way to count daily engagements per user (count where timestamp > start of day, etc.). We might skip this initially to save time, but it’s good for transparency and ensuring no duplicates (a user shouldn’t have two entries on the same post).

Supabase Auth Integration: We will integrate Supabase Auth into Next.js using the official Supabase JS SDK. On the client side, after entering email, we call supabase.auth.signInWithOtp({ email }). Supabase will handle sending the email. After the user clicks the link (which will redirect back to our app’s callback URL configured in Supabase), the user will be considered logged in (Supabase sets a session, which we can retrieve in Next.js). We may use Supabase’s Next.js Auth Helpers or simply rely on client-side and server-side session fetching via the Supabase client. Since we have an App Router, we can utilize middleware or server components to get the user session (Supabase provides a helper createServerComponentClient to get the session server-side). The exact implementation can follow Supabase’s Next.js example guides. The main point is that once authenticated, we have the user’s ID to use in our database operations.

Security: We will store the Unipile API Key securely (e.g., in an environment variable on the server). All calls to Unipile (generating auth links, posting reactions) will be made from server-side code (API routes or workflow steps), never from the client, to ensure the API key isn’t exposed
developer.unipile.com
. The notify_url for auth results should be a secret endpoint (hard to guess URL or with a verification token) to prevent unauthorized calls; we could also validate that the account_id in the payload is a format we expect and maybe cross-check it via a quick call to Unipile’s account info endpoint. Supabase database should enforce row-level security as appropriate (though if our API always runs with service role for simplicity, we must be cautious; using supabase-js on the server with service key allows easy queries but bypasses RLS – maybe fine for an internal trusted backend). In any case, user-specific operations will be checked against the session user ID.

Workflow Implementation Details (Using useWorkflow)

As mentioned, we will create a Next.js API route (e.g., /api/engage) that starts the handlePostEngagement workflow. The Workflow DevKit requires minimal setup: in next.config.js we wrap the config with withWorkflow() to enable the special directives
useworkflow.dev
. We then define our workflow function in the workflows/ directory (as per Workflow DevKit conventions). Each function that performs an external action (like an HTTP request to Unipile or a DB update) will be a "use step" function inside that workflow file
useworkflow.dev
useworkflow.dev
. For example:

// workflows/handlePostEngagement.ts
import { FatalError } from 'workflow';
import { getConvexClient } from '@/lib/convex/server';
import { addReaction } from '@/lib/unipile/actions';
import { api } from '@/convex/_generated/api';

export async function sendReaction(
  userId: string,
  accountId: string,
  postUrn: string,
  reactionType: string
) {
  "use step";
  const convex = await getConvexClient();

  try {
    // Send reaction via Unipile
    await addReaction(accountId, postUrn, reactionType);

    // On success, log engagement in Convex
    await convex.mutation(api.mutations.createEngagement, {
      postId: postId, // passed from workflow context
      reactorId: userId,
      reactionType: reactionType
    });
  } catch (err: any) {
    // If the error indicates the post was already reacted to or some non-retriable error,
    // throw FatalError to avoid infinite retry
    if (err.response && err.response.status < 500) {
      throw new FatalError(`Unipile reaction API error: ${err.response.status}`);
    }
    throw err; // for transient errors, allow retry
  }
}


This sendReaction will be called inside the main workflow loop as shown earlier. The Workflow DevKit will queue each call to sendReaction as a separate task under the hood, while the main handlePostEngagement workflow waits (suspended). It’s worth noting that the Workflow DevKit can orchestrate long sequences reliably. We can incorporate logging or tracing if needed to monitor the workflow progress (the devkit provides observability tools
useworkflow.dev
useworkflow.dev
).

One important consideration: if the Next.js app is deployed serverlessly (e.g., on Vercel), we need to ensure the Workflow DevKit’s durability works across function invocations. The devkit claims to allow workflows to suspend and resume even across deployments or restarts
useworkflow.dev
useworkflow.dev
. In our case, 5 minutes is short, so likely it will run in one process, but it’s good that it’s fault-tolerant. We just have to deploy the app with the environment variables and ensure any build step includes the workflow plugin.

Handling Multiple Squads (Future)

Although initially we assume one squad, the backend is structured to support multiple. In the future, we could allow creating new squads (with their own invite links). The difference would be: an invite link might carry a squad ID or code, and upon signup, instead of always adding to “YC Alumni”, we add the user to the squad indicated. The handlePostEngagement workflow would need to know which squad to draw the reacting members from – likely the user’s squad(s). If a user belongs to multiple squads, perhaps they’d choose which squad to engage (but that might not be a common scenario; perhaps one user = one squad typically in this app’s use case). For now, we keep it simple (one squad), but designing the DB with a squads table and membership keeps it flexible. The UI can later be extended with squad management pages, the ability to create squads, invite others, etc.

Future Feature: AI-Generated Comments

Automated commenting using AI (e.g., GPT-4 or similar) is planned as a future enhancement (point 5: “Auto-commenting with AI will be a future feature”). Our design will accommodate this by modularity. Likely, this would entail an additional option for the post author: e.g., “Also generate comments”. If enabled, the workflow would not only queue reactions but also queue a few comments from select members. Implementation could be: after posting reactions, or interleaved, have a step where the system uses an AI service to draft a comment relevant to the post content, and then uses Unipile’s Comment a post endpoint to post it. Unipile provides an endpoint to comment on a post (POST /api/v1/posts/{post_id}/comments)
developer.unipile.com
. The AI generation could call OpenAI’s API with the post text (which we might get via Unipile’s post retrieval) to produce a short comment, and then that comment text is used in the Unipile call. This would be done in a similar durable workflow manner, perhaps only for a handful of members to avoid overloading with comments. Since this is for later, we are not implementing it now, but the system’s structure (especially the use of workflows and steps) makes it straightforward to insert such logic when ready. Each AI comment posting can be another step function. The design considerations will include avoiding obvious generic comments and maybe requiring human review (depending on how the user wants it). We note this just to ensure our current design (particularly data models and the sequential workflow logic) can be extended. For example, we might generalize the concept of an “engagement” beyond just a reaction in the future – maybe a type field for reaction vs comment. For now, we focus on reactions only.

References

Supabase passwordless (magic link / OTP) auth documentation
supabase.com
supabase.com

Supabase email templates for OTP vs Magic Link
supabase.com

Vercel Workflow DevKit (useworkflow) docs – enabling durable background tasks in Next.js
useworkflow.dev
useworkflow.dev
useworkflow.dev
useworkflow.dev

Unipile Hosted Auth Wizard docs – connecting LinkedIn accounts easily
developer.unipile.com
developer.unipile.com
developer.unipile.com

Unipile API caution about not exposing API keys (calls made from backend)
developer.unipile.com

Unipile “Add reaction to a post” API description
unipile.com
 and usage of LinkedIn post URNs for actions
developer.unipile.com

LinkedIn reactions types (Like, Celebrate, Insightful, etc.) as officially defined
learn.microsoft.com

This spec has gathered the necessary information to guide an AI agent or development team in building the application end-to-end, ensuring that all critical pieces – from authentication, database schema, external API integration, to background job workflows – are understood and planned with appropriate references to documentation and best practices.ase. Supabase will manage user accounts and sessions. We’ll use Supabase’s JS client in Next.js for auth. All application data (user profiles, LinkedIn account info, squads, posts, etc.) will be stored in the Supabase Postgres DB.
	•	Unipile API (LinkedIn integration): Allows us to programmatically log into users’ LinkedIn accounts and perform actions like reacting to posts. We will use Unipile’s Hosted Auth Wizard for LinkedIn to connect accounts easily ￼. Once an account is connected, Unipile provides an account_id that we can use to make API calls (like adding a reaction) on behalf of that LinkedIn account. We must securely manage an API key for Unipile and never expose it on the client side ￼.
	•	Workflow DevKit (useworkflow.dev): Used for scheduling and executing background jobs in Next.js. By marking our functions with the "use workflow" directive, we get durability and automatic state persistence for long-running tasks ￼. This will enable us to queue up reactions over time without blocking any request/response cycle. The Workflow library handles retrying failed steps and allows using await sleep() for delays without consuming resources ￼.

User Flow 1: Squad Invitation, Signup, and LinkedIn Connect

1. Invitation & Signup: Initially, the admin (or system) generates an invite link for the "YC Alumni" squad (for now this could be a static link or token since we allow open joining via the link). When a new user clicks the invite link, they are brought to our Next.js app's signup page. Users can sign up using Clerk authentication, which supports multiple methods: email/password, OAuth providers (Google, GitHub, LinkedIn, etc.), or magic links. Clerk's pre-built UI components (<SignUp /> and <SignIn />) handle the entire authentication flow, including email verification and session management. When a user successfully authenticates, Clerk creates a user record with a unique ID and establishes a secure session. Our application uses Clerk's middleware to protect routes and access user information. Upon first sign-in, our application creates a corresponding profile record in Convex, linking the Clerk user ID to our application data.

2. Profile Setup – Connect LinkedIn: After email sign-in, the user is taken to a setup page prompting them to connect their LinkedIn account. We integrate Unipile’s Hosted Auth Wizard for this. When the user clicks “Connect LinkedIn”, our Next.js backend generates a one-time Hosted Auth link via Unipile’s API ￼ ￼. Specifically, our server will call Unipile’s POST /api/v1/hosted/accounts/link endpoint with parameters:
	•	type: "create" (new account connection)
	•	providers: ["LINKEDIN"] (we only want LinkedIn in the wizard)
	•	expiresOn: a timestamp a few minutes in the future (short-lived link)
	•	success_redirect_url: URL in our app to redirect on success (e.g. a “LinkedIn connected” page)
	•	failure_redirect_url: URL in our app for failure cases
	•	notify_url: a webhook endpoint in our app to receive the result
	•	name: an identifier for the user (we will pass the Supabase user’s UID or some internal ID here)

The Hosted Auth Wizard link that Unipile returns (in a JSON response with an url field ￼) will be sent back to the client or the client will be redirected to it. The user will then see Unipile’s LinkedIn login UI (hosted by Unipile) where they can enter their LinkedIn credentials and solve any verification (LinkedIn may present CAPTCHA or 2FA if needed). This hosted flow significantly simplifies integration, as it’s a secure, pre-built interface for authentication ￼, supporting any needed checkpoint (2FA, OTP, Captcha) handling through Unipile’s platform.

3. Post-Auth Callback: Once the user successfully logs into LinkedIn via Unipile, Unipile will redirect them to our specified success URL (bringing them back into our app UI), and critically, Unipile will send a server-to-server webhook call to our notify_url endpoint with details of the new connection ￼. The payload of this webhook contains at least an account_id (the Unipile identifier for that LinkedIn account) and the name we provided (so we know which user it belongs to) ￼. For example, Unipile sends:

{
  "status": "CREATION_SUCCESS",
  "account_id": "e54m8LR22bA7G5qsAc8w",
  "name": "myuser1234"
}

￼

Our Next.js API route (e.g. /api/webhooks/unipile) will handle this webhook. It will look up the user profile by the name/ID (which corresponds to the Clerk user ID), then store the returned account_id in Convex via a mutation, updating the user's profile with unipile_account_id and linkedinConnected fields. At this point, the user's onboarding is complete – they are in the "YC Alumni" squad (we create a membership record for them in the squadMembers table linking to the squad) and their LinkedIn account is linked for automation. Only users who have connected LinkedIn should be considered active squad members (we will enforce that in the UI and in scheduling logic via Convex queries that filter by linkedinConnected).

Dedupe on join: (Clarification point 3: "Yes dedupe") – We will ensure that if a user somehow clicks the invite link multiple times or tries to sign up twice with the same email, they won't be duplicated in the squad. Clerk prevents duplicate accounts for the same email by default, and our Convex mutations check for existing squadMembers entries using compound indexes on (userId, squadId) to prevent duplicate entries.

User Flow 2: Submitting a Post for Squad Engagement

Once onboarded, a user can request engagements on their LinkedIn post via the app:

1. New Post Submission: The user creates a post on LinkedIn as usual (outside of our system). To initiate squad engagement, they copy the LinkedIn post’s URL and go to our Next.js app’s main page (which, given a single global squad, might just be a simple dashboard for “YC Alumni”). There, they click “New Post Engagement” (for example) and paste the LinkedIn post URL into a form. They also select which reaction types they want from their squad. We will present a list of possible LinkedIn reaction types with checkboxes (e.g. 👍 Like, 🎉 Celebrate, 💗 Love, 💡 Insightful, 👏 Support, 😂 Funny). LinkedIn officially supports reactions including Like, Celebrate, Love, Insightful, Support, and Funny ￼ (note: “Curious” was a reaction in the past but has been deprecated in favor of Funny ￼). The user can choose one or multiple types; for instance, they might select “Like” and “Insightful” only, if they prefer those reactions on their post.

2. Queue Engagements: When the user submits this form, it triggers a Next.js API route (e.g. POST /api/engagements) that kicks off the background workflow to deliver reactions. The request includes the current user’s ID (from session), the post URL, and the selected reaction types. The API handler will do minimal processing synchronously – mainly, it may parse the LinkedIn URL to extract a post identifier, and then call the Workflow DevKit to start a new workflow. For example, using the workflow library:

// In /api/engagements/route.ts (assuming Next.js App Router file structure)
import { start } from 'workflow/api';
import { handlePostEngagement } from '@/workflows/handlePostEngagement';
import { currentUser } from '@clerk/nextjs/server';
import { getConvexClient } from '@/lib/convex/server';
import { api } from '@/convex/_generated/api';

export async function POST(request: Request) {
  const { postUrl, reactions } = await request.json();
  const user = await currentUser(); // from Clerk auth session
  const convex = await getConvexClient();

  // Get user profile from Convex
  const profile = await convex.query(api.queries.getUserProfile, {
    clerkUserId: user.id
  });

  // Launch the engagement workflow asynchronously (does not block response)
  await start(handlePostEngagement, [profile._id, postUrl, reactions]);
  return NextResponse.json({ status: 'scheduled' });
}

Using start() this way initiates the handlePostEngagement workflow function and immediately returns; it does not block the API response ￼. The client gets a response that the engagement has been scheduled (we can show a confirmation UI). The heavy lifting now happens asynchronously in the workflow.

3. Workflow: Distributing Reactions – The handlePostEngagement workflow will implement the logic of selecting squad members and posting reactions. Pseudocode for this workflow function could look like:

export async function handlePostEngagement(userId: string, postUrl: string, reactions: string[]) {
  "use workflow";  // marks this function as a durable workflow
  const convex = await getConvexClient();

  // Step 1: Determine target post ID or URN from the URL
  const postURN = await getPostURN(postUrl);  // from @/lib/linkedin/post-urn

  // Step 2: Get user's squad and fetch available members
  const squadId = GLOBAL_SQUAD_ID; // From Convex query
  const availableMembers = await convex.query(api.queries.getAvailableSquadMembers, {
    squadId,
    excludeUserId: userId
  });

  // Step 3: Randomly pick up to N members (e.g. 40) from available pool
  // Note: availableMembers query already filters by daily limit and LinkedIn connection
  const N = configuredEngagementCount || 40;
  const chosenMembers = pickRandom(availableMembers, N);

  // Step 4: For each chosen member, schedule a reaction
  for (const member of chosenMembers) {
    // Pick a random reaction type from the allowed types list
    const reactionType = randomChoice(reactions);

    // Execute the reaction via Unipile (step function)
    await sendReaction(member.userId, member.unipileAccountId, postURN, reactionType);

    // Sleep a random short interval (jitter) before next engagement
    const delaySec = randomIntBetween(5, 15);
    await sleep(`${delaySec}s`);
  }
}

Let’s break down the steps and considerations here:
	•	Extracting Post Identifier: LinkedIn posts are identified by an urn:li:activity:<ID> or similar URN. If the user provides the full URL, we need to extract an identifier that Unipile can use. Unipile’s API for adding a reaction expects either the post’s ID/URN in the request. In their docs, to comment or react on a post, one must use the post’s social_id (URN) ￼. We have a couple of ways to get this:
	•	Parse the URL: Many LinkedIn post URLs contain the activity ID. For example: https://www.linkedin.com/posts/username_activity-7332661864792854528-abcdef – in this URL, 7332661864792854528 is the post’s internal ID. We could attempt to parse it out (this might be brittle if URL formats vary).
	•	Use Unipile’s API to retrieve the post object: Unipile provides an endpoint GET /posts/{post_id} which can take a numeric ID (or share URL) plus an account_id to retrieve post data ￼. We could call GET /posts/7332661864792854528?account_id=<someAccount> to get the post, which would return the social_id (URN) ￼ ￼. This requires an account_id to make the request (so we could use perhaps the author’s own account or any linked account to fetch it). However, since the user just gave us the link, we might skip this network call and do simple parsing if possible.
	•	For our MVP, we can try to parse the activity:ID from the URL. If parsing fails, as a fallback the workflow could use one squad member’s account to call the retrieve API to get the URN. (We need the URN because the Add Reaction endpoint likely expects post_id as URN or an ID in the path/body; Unipile’s “Add reaction” reference suggests using a general endpoint with post identifiers).
	•	Selecting Squad Members: We retrieve the list of members in the squad (from our Supabase DB). Since we currently have one global squad, this is straightforward (e.g., squad_id = 1 for YC Alumni). We filter out the user who made the post – we don’t want them reacting to their own post (LinkedIn doesn’t allow liking your own post anyway). Also filter out any members who have not connected a LinkedIn account (only those with a unipile_account_id are eligible, per requirement “Only if the LinkedIn account is connected!”).
	•	Enforcing Daily Limits: For each member, we need to ensure they have not exceeded their daily engagement quota (default 40 per day, or a user-configured value). We will implement a check, e.g., each member’s profile in DB stores how many reactions they’ve done today. We could maintain a counter that resets daily, or log every reaction in an engagements_log table with timestamps and then count per 24h window. Simpler: have a field today_count and last_reset_date in the user profile. Each new day, the first time we check, if the date changed, reset the count. Then for each candidate member, if today_count >= max_daily_engagements (their configured max or default 40), we exclude them from this round. This ensures no account will do more than (say) 40 total reactions across all posts in one day. If a user has hit their limit, they simply won’t be chosen until the next day.
	•	Randomized Selection: Out of the remaining pool, we choose up to N members to perform reactions. N can be default 40 or a number configured by the post author. The prompt suggests “configure e.g. 40 engagements max per day” and also mentions queueing up 40 engagements for a post over 5 minutes. We will assume the standard is 40 reactions on a post (if the squad has at least 40 other members available). If the squad is smaller than 40, then all available members will be used (but still limited by their individual daily caps). If the squad is much larger, we strictly use a random sample of size N to make it realistic and not always the same people. Randomization ensures fairness and that the engagement doesn’t look too coordinated. We will implement a random sampling function (e.g., Fisher-Yates shuffle or use a quick random pick algorithm). Additionally, we will dedupe within this selection (obviously ensure each member only appears once – our data structure naturally does that, but this addresses any possibility of accidental duplicates). This satisfies clarification “Randomized across squad members” and “Yes dedupe”.
	•	Scheduling the Reactions: For each chosen member, the workflow will invoke a step to add a reaction via Unipile. We will have a helper function, perhaps sendReaction(accountId, postURN, reactionType), marked with "use step", which performs the API call to Unipile. This separation is important: marking it as a step means the actual HTTP request is done outside the main workflow stack (the workflow yields control while the step runs) ￼. This is good because each API call can be treated as an isolated unit of work that can be retried if it fails. If Unipile’s API or network fails temporarily, the step will throw an error and the Workflow DevKit will automatically retry that step until it succeeds (or hits a retry limit) ￼. This gives resilience to our engagement process – we won’t silently lose reactions due to transient errors. We might set a reasonable retry policy or max retries to avoid infinite attempts.
The sendReaction step will construct an HTTPS request to Unipile’s endpoint. According to Unipile, the endpoint to react to a post is:

POST /api/v1/posts/reaction

with JSON body containing the target post/comment and the account making the reaction ￼. We will include:
	•	account_id: the Unipile account ID of the squad member who is reacting.
	•	post_id or target: the identifier of the post to react to (likely the URN obtained earlier, e.g. "urn:li:activity:7332661864792854528"). Unipile might accept this URN either in the URL or body. In their docs, commenting uses /posts/{post_id}/comments format ￼ ￼, but reactions use a generic endpoint, probably expecting the post_id in the JSON. We’ll confirm via Unipile reference that we likely need to send something like { "account_id": "abc123", "post_id": "urn:li:activity:733266...", "reaction": "LIKE" }. (If needed, we can retrieve the exact field names from Unipile’s docs; the concept is that we tell it which LinkedIn account and what reaction type to add.)
	•	reaction type/value: the type of reaction (e.g. "LIKE", "PRAISE", "INTEREST", etc.). Unipile will translate this to the corresponding LinkedIn reaction. (LinkedIn’s API expects values like LIKE, CELEBRATE, SUPPORT, LOVE, INSIGHTFUL, FUNNY – Unipile likely uses similar or their own mapping. We will use the common names; for example, user selecting “Insightful” we send something like "INTEREST" which is LinkedIn’s internal code for Insightful ￼.)
Unipile’s platform, having the LinkedIn session cookies from the earlier auth, will perform the reaction. This effectively automates a “Like” or other reaction from that member’s LinkedIn account on the target post. Using the Unipile API means we do not have to deal with the LinkedIn official API (which has very restrictive permissions) – Unipile handles the low-level interaction. We just need to ensure our requests include our Unipile API key in the header (X-API-KEY) and call the correct endpoint. Example: Unipile documentation notes: “Use the POST /posts/reaction method to engage with content by reacting directly to posts or comments, enhancing presence and interaction on the platform.” ￼. By providing the post’s identifier and the account_id, we can add a reaction. (If the target was a comment rather than a top-level post, presumably the same endpoint handles it by recognizing the URN as a comment URN. Our case is top-level posts.)
After each sendReaction step, we pause using a delay: await sleep("{X}s"). We will choose X as a random number of seconds (for example between 5 and 15 seconds) for jitter. This means not all reactions fire at the exact same interval or same time, making it look more organic. Over 40 reactions, spreading over ~5 minutes was suggested. If we use an average of ~7–8 seconds delay, 40 reactions will indeed span roughly 5 minutes. We will tune the min/max delay to achieve ~5 minutes total for 40 reactions. The sleep function in the workflow is perfect for this, as it suspends the workflow without holding any server resources during the wait ￼. The workflow will simply wake up after the delay and continue with the next step.
This loop continues until all selected members have reacted (or possibly breaks early if an error is unrecoverable, but generally Workflow will retry steps so likely all go through eventually). We also ensure that each member only reacts once to this post (we’re iterating unique members, so no duplicates – dedupe ensured).

	•	Updating State and Daily Count: Each time a reaction is successfully posted, we should update that member’s daily count in the database. This can be done within the same sendReaction step function (after the API call returns success). Because the step has full Node.js access, it can perform a DB query or call Supabase to increment the count ￼. If that DB update fails for some reason, we might catch and handle it (maybe mark it as a non-retry fatal error if the reaction itself succeeded to avoid duplicate likes on retry). We’ll carefully design error handling so that a failed DB update doesn’t cause re-liking the post. One approach: mark the step as succeeded even if DB update failed, but schedule another attempt to update the counter. However, given the limited scope, we might assume the DB update will usually succeed and just log if not. (This is an edge case consideration).

4. Completion: After the workflow finishes scheduling all reactions, the post will have a flurry of engagements from the squad. From the user’s perspective, they submitted the link and can watch the reactions roll in over a few minutes on LinkedIn. We might provide in-app feedback like a status (“Engagements in progress…”) or a summary (“Your post has received 40 reactions from the squad!”). The workflow could send a completion event or update a status in the DB which the frontend can poll or subscribe to (though a simpler approach: just trust it completed after X minutes). Since this is asynchronous, a nice enhancement is to use Supabase Realtime or another mechanism to notify the client when done. That’s optional.

Database Design (Convex)

Using Convex's document-oriented database, we define tables (called "collections" in Convex) with type-safe schemas. Convex uses `defineTable()` with validator functions (from `convex/values`) to ensure type safety. Key tables and their fields:

profiles: One document per user, linked to Clerk user ID. Fields:
	•	_id (Convex ID, auto-generated unique identifier)
	•	clerkUserId (string, reference to Clerk user ID) - indexed for fast lookups
	•	unipileAccountId (optional string, the LinkedIn account identifier from Unipile)
	•	linkedinConnected (boolean, whether LinkedIn is connected)
	•	linkedinConnectedAt (optional number, timestamp when LinkedIn was connected)
	•	dailyMaxEngagements (number, default 40, user-configurable max engagements per day)
	•	createdAt (number, timestamp)
	•	updatedAt (number, timestamp)
	•	Indexes: byClerkUserId, byUnipileAccountId

Note: Daily engagement counts are NOT stored in profiles. Instead, they are dynamically calculated by querying the engagementsLog table for today's date range. This ensures accuracy and avoids race conditions.
squads: One document per squad/group of users. Fields:
	•	_id (Convex ID, auto-generated)
	•	name (string, e.g. "YC Alumni")
	•	inviteCode (string, unique token for joining the squad)
	•	createdBy (Convex ID reference to profiles)
	•	createdAt (number, timestamp)
	•	Indexes: byInviteCode, byCreator

For the MVP, we will pre-create a squad "YC Alumni" with a known invite code. The invite link could be a static route that includes the invite code in the URL (e.g., https://ourapp.com/invite/yc-alumni), which the app uses to look up the squad via the byInviteCode index.

squadMembers: Join table between profiles and squads (many-to-many relationship). Fields:
	•	_id (Convex ID, auto-generated)
	•	userId (Convex ID reference to profiles)
	•	squadId (Convex ID reference to squads)
	•	joinedAt (number, timestamp)
	•	Indexes: byUserId, bySquadId, byUserAndSquad (compound index for uniqueness check)
When a user signs up via an invite link, we create an entry here. For MVP with one squad, every new user gets an entry linking to the "YC Alumni" squad.

posts: Logs submitted posts for engagement tracking. Fields:
	•	_id (Convex ID, auto-generated)
	•	authorUserId (Convex ID reference to profiles)
	•	squadId (Convex ID reference to squads)
	•	postUrl (string, the LinkedIn post URL)
	•	postUrn (string, extracted LinkedIn post URN)
	•	submittedAt (number, timestamp)
	•	status (string, one of: "pending", "processing", "completed", "failed")
	•	Indexes: byAuthor, bySquad, byStatus, byUrlAndSquad (compound index for deduplication)

This table ensures we don't process the same post twice. The byUrlAndSquad compound index allows efficient duplicate checking when a user submits a post.

engagementsLog: Tracks each reaction made by squad members. Fields:
	•	_id (Convex ID, auto-generated)
	•	postId (Convex ID reference to posts)
	•	reactorUserId (Convex ID reference to profiles)
	•	reactionType (string, one of: LIKE, CELEBRATE, SUPPORT, LOVE, INSIGHTFUL, FUNNY)
	•	createdAt (number, timestamp)
	•	Indexes: byPost, byReactor, byReactorAndDate (for daily limit checks), byPostAndReactor (for deduplication)

This table serves multiple purposes:
1. Tracks all reactions for analytics and debugging
2. Enables daily engagement count queries (via byReactorAndDate index)
3. Prevents duplicate reactions (via byPostAndReactor compound index)
4. Provides historical data for future features

Clerk + Convex Auth Integration: We integrate Clerk authentication with Convex using Clerk's JWT verification. Clerk provides a JWT template (named "convex") that includes the user's ID and other claims. Convex Auth is configured in `convex/auth.config.ts` to verify Clerk JWTs using the Clerk issuer domain. On the client side, the ConvexProviderWithClerk component wraps the app, automatically passing Clerk's authentication token to Convex queries and mutations. On the server side (API routes, workflows), we use `currentUser()` from `@clerk/nextjs/server` to get the Clerk user, then use `getConvexClient()` to create an authenticated Convex client that respects user permissions. Convex handles authorization transparently via the JWT, so queries and mutations can access `ctx.auth.getUserIdentity()` to get the current user's information.

Security: We will store the Unipile API Key securely in server-side environment variables. All calls to Unipile (generating auth links, posting reactions) will be made from server-side code (API routes or workflow steps), never from the client, to ensure the API key isn't exposed. The webhook endpoint (`/api/webhooks/unipile`) should validate incoming payloads to ensure they come from Unipile. Convex Auth ensures that all database operations are authenticated via Clerk JWT verification. User-specific operations automatically have access to the authenticated user's identity through `ctx.auth`, providing built-in security without manual checks. Environment variables include:
	•	Server-side: CLERK_SECRET_KEY, CLERK_JWT_ISSUER_DOMAIN, UNIPILE_API_KEY, UNIPILE_API_URL
	•	Client-side: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, NEXT_PUBLIC_CONVEX_URL

Workflow Implementation Details (Using useWorkflow)

As mentioned, we will create a Next.js API route (e.g., /api/engage) that starts the handlePostEngagement workflow. The Workflow DevKit requires minimal setup: in next.config.js we wrap the config with withWorkflow() to enable the special directives ￼. We then define our workflow function in the workflows/ directory (as per Workflow DevKit conventions). Each function that performs an external action (like an HTTP request to Unipile or a DB update) will be a "use step" function inside that workflow file ￼ ￼. For example:

// workflows/handlePostEngagement.ts
import { FatalError } from 'workflow';
import { getConvexClient } from '@/lib/convex/server';
import { addReaction } from '@/lib/unipile/actions';
import { api } from '@/convex/_generated/api';

export async function sendReaction(
  userId: string,
  accountId: string,
  postUrn: string,
  reactionType: string
) {
  "use step";
  const convex = await getConvexClient();

  try {
    // Send reaction via Unipile
    await addReaction(accountId, postUrn, reactionType);

    // On success, log engagement in Convex
    await convex.mutation(api.mutations.createEngagement, {
      postId: postId, // passed from workflow context
      reactorId: userId,
      reactionType: reactionType
    });
  } catch (err: any) {
    // If the error indicates the post was already reacted to or some non-retriable error,
    // throw FatalError to avoid infinite retry
    if (err.response && err.response.status < 500) {
      throw new FatalError(`Unipile reaction API error: ${err.response.status}`);
    }
    throw err; // for transient errors, allow retry
  }
}

This sendReaction will be called inside the main workflow loop as shown earlier. The Workflow DevKit will queue each call to sendReaction as a separate task under the hood, while the main handlePostEngagement workflow waits (suspended). It’s worth noting that the Workflow DevKit can orchestrate long sequences reliably. We can incorporate logging or tracing if needed to monitor the workflow progress (the devkit provides observability tools ￼ ￼).

One important consideration: if the Next.js app is deployed serverlessly (e.g., on Vercel), we need to ensure the Workflow DevKit’s durability works across function invocations. The devkit claims to allow workflows to suspend and resume even across deployments or restarts ￼ ￼. In our case, 5 minutes is short, so likely it will run in one process, but it’s good that it’s fault-tolerant. We just have to deploy the app with the environment variables and ensure any build step includes the workflow plugin.

Handling Multiple Squads (Future)

Although initially we assume one squad, the backend is structured to support multiple. In the future, we could allow creating new squads (with their own invite links). The difference would be: an invite link might carry a squad ID or code, and upon signup, instead of always adding to “YC Alumni”, we add the user to the squad indicated. The handlePostEngagement workflow would need to know which squad to draw the reacting members from – likely the user’s squad(s). If a user belongs to multiple squads, perhaps they’d choose which squad to engage (but that might not be a common scenario; perhaps one user = one squad typically in this app’s use case). For now, we keep it simple (one squad), but designing the DB with a squads table and membership keeps it flexible. The UI can later be extended with squad management pages, the ability to create squads, invite others, etc.

Future Feature: AI-Generated Comments

Automated commenting using AI (e.g., GPT-4 or similar) is planned as a future enhancement (point 5: “Auto-commenting with AI will be a future feature”). Our design will accommodate this by modularity. Likely, this would entail an additional option for the post author: e.g., “Also generate comments”. If enabled, the workflow would not only queue reactions but also queue a few comments from select members. Implementation could be: after posting reactions, or interleaved, have a step where the system uses an AI service to draft a comment relevant to the post content, and then uses Unipile’s Comment a post endpoint to post it. Unipile provides an endpoint to comment on a post (POST /api/v1/posts/{post_id}/comments) ￼. The AI generation could call OpenAI’s API with the post text (which we might get via Unipile’s post retrieval) to produce a short comment, and then that comment text is used in the Unipile call. This would be done in a similar durable workflow manner, perhaps only for a handful of members to avoid overloading with comments. Since this is for later, we are not implementing it now, but the system’s structure (especially the use of workflows and steps) makes it straightforward to insert such logic when ready. Each AI comment posting can be another step function. The design considerations will include avoiding obvious generic comments and maybe requiring human review (depending on how the user wants it). We note this just to ensure our current design (particularly data models and the sequential workflow logic) can be extended. For example, we might generalize the concept of an “engagement” beyond just a reaction in the future – maybe a type field for reaction vs comment. For now, we focus on reactions only.

References
	•	Supabase passwordless (magic link / OTP) auth documentation ￼ ￼
	•	Supabase email templates for OTP vs Magic Link ￼
	•	Vercel Workflow DevKit (useworkflow) docs – enabling durable background tasks in Next.js ￼ ￼ ￼ ￼
	•	Unipile Hosted Auth Wizard docs – connecting LinkedIn accounts easily ￼ ￼ ￼
	•	Unipile API caution about not exposing API keys (calls made from backend) ￼
	•	Unipile “Add reaction to a post” API description ￼ and usage of LinkedIn post URNs for actions ￼
	•	LinkedIn reactions types (Like, Celebrate, Insightful, etc.) as officially defined ￼

This spec has gathered the necessary information to guide an AI agent or development team in building the application end-to-end, ensuring that all critical pieces – from authentication, database schema, external API integration, to background job workflows – are understood and planned with appropriate references to documentation and best practices.
