/**
 * ManifestoContent - The actual manifesto text, isolated for easy editing.
 *
 * This component contains the full manifesto text. It is intentionally
 * kept separate from the layout/styling component so the content can be
 * easily reviewed and updated without touching presentation logic.
 */
export const ManifestoContent: React.FC = () => (
  <>
    <p className="text-lg md:text-xl font-semibold">We are builders.</p>

    <p>
      Many of us were born in Iran, or are children of those who fled. We've seen what Iranians
      create when barriers fall — in Silicon Valley, in Toronto, in London, in Berlin, in Tel Aviv.
    </p>

    <p>
      Iran has 90 million people. A median age of 32. One of the highest rates of engineering
      graduates on Earth. A civilization that has been inventing things for three thousand years.
    </p>

    <p>We believe a free Iran will be one of the great economic stories of our lifetime.</p>

    <p>So we are making a promise:</p>

    <p>
      When sanctions lift and Iranians are free to build, trade, and connect with the world — we
      will be ready. To invest. To hire. To partner. To build.
    </p>

    <p className="font-semibold">We pledge to do business with a free Iran.</p>
  </>
)
