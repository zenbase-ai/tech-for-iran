import { Box, type BoxProps } from "@/components/layout/box"
import { cn } from "@/lib/utils"

export type PostIFrameProps = BoxProps & {
  urn: string
}

export const PostIFrame: React.FC<PostIFrameProps> = ({ urn, className, ...props }) => (
  <Box className={cn("min-h-[263px] max-w-[504px] rounded-md shadow-md", className)} {...props}>
    <iframe
      src={`https://www.linkedin.com/embed/feed/update/urn:li:share:${urn}`}
      width="100%"
      height="263"
      allowFullScreen={false}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      allow="
        geolocation 'none';
        microphone 'none';
        camera 'none';
        storage-access 'none';
        browsing-topics 'none';
        join-ad-interest-group 'none';
        run-ad-auction 'none';
        attribution-reporting 'none';
        private-state-token-redemption 'none'
      "
      loading="lazy"
      title="Embedded post"
    />
  </Box>
)
