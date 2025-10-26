"use client"

import { motion, useAnimationControls, type Variants } from "motion/react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { LuMountainSnow } from "react-icons/lu"
import { useBoolean } from "usehooks-ts"
import { mountainPictures } from "@/components/assets/mountain-pictures"
import { Wordmark } from "@/components/assets/wordmark"
import { Box } from "@/components/layout/box"
import { HStack, VStack } from "@/components/layout/stack"
import { CTALinkButton } from "@/components/ui/cta-link-button"
import { HamburgerIcon } from "@/components/ui/hamburger-icon"
import { Skeleton } from "@/components/ui/skeleton"
import { ThemeToggler } from "@/components/ui/theme-toggler"
import { useAsyncEffect } from "@/hooks/use-async-effect"
import { useCycle } from "@/hooks/use-cycle"
import { useEscapeKey } from "@/hooks/use-escape-key"
import { useFn } from "@/hooks/use-fn"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"

const patterncn = "h-[72px] md:h-[90px]"
const DotPattern = dynamic(() => import("@/components/assets/dot-pattern"), {
  ssr: false,
  loading: () => <Skeleton className={patterncn} />,
})

export type NavProps = { duration?: number }

export const Nav: React.FC<NavProps> = ({ duration = 0.3 }) => {
  const isMenuOpen = useBoolean(false)
  useEscapeKey(isMenuOpen.setFalse)

  return (
    <>
      <DotPattern className={patterncn} />
      <NavBar isMenuOpen={isMenuOpen} duration={duration} />
      <NavMenu isMenuOpen={isMenuOpen} duration={duration} />
      <ThemeToggler
        className="z-42 fixed bottom-[14px] right-[14px] text-muted-foreground"
        duration={duration}
      />
    </>
  )
}

const variants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

type NavElementProps = {
  isMenuOpen: ReturnType<typeof useBoolean>
  duration: number
}

const NavBar: React.FC<NavElementProps> = ({ isMenuOpen, duration }) => {
  const controls = useAnimationControls()

  useAsyncEffect(async () => {
    if (!isMenuOpen.value) {
      await controls.start({ zIndex: 42 })
      await controls.start(variants.visible)
    } else {
      await controls.start(variants.hidden)
      await controls.start({ zIndex: -1 })
    }
  }, [isMenuOpen.value, controls])

  return (
    <motion.nav
      id="navtrigger"
      className="fixed top-[4px] md:top-[14px] left-0 right-0 z-42 mx-auto flex items-center justify-center px-4 overflow-hidden overscroll-none bg-background/30 backdrop-blur-md h-[56px] w-[320px] rounded-full opacity-0"
      animate={controls}
      transition={{ duration }}
      aria-hidden={isMenuOpen.value}
    >
      <HStack
        justify="between"
        items="center"
        className="gap-2 md:gap-4 lg:gap-6 xl:gap-8 w-full max-w-[560px] mx-auto text-muted-foreground"
      >
        <Link
          href="/"
          prefetch
          className="cursor-pointer hover:text-primary transition-colors pl-3"
          title="Home"
        >
          <LuMountainSnow className="size-5 bg-transparent [stroke-width:1.25px]" />
        </Link>
        <Link
          href="/thesis"
          prefetch
          className="hover:text-primary transition-colors absolute left-1/2 -translate-x-1/2"
        >
          SYNTHESIS
        </Link>
        <button
          type="button"
          className="py-2 -my-2 px-4 -mx-4 stroke-0.5 scale-125"
          onClick={isMenuOpen.setTrue}
        >
          <HamburgerIcon
            direction="right"
            label="Hide Navigation Menu"
            size={16}
            duration={duration * 3}
            toggled={isMenuOpen.value}
            animateOnMount={duration !== 0}
            hideOutline
            rounded
          />
        </button>
      </HStack>
    </motion.nav>
  )
}

const NavMenu: React.FC<NavElementProps> = ({ isMenuOpen, duration }) => {
  const isMounted = useMounted()
  const [picture, cyclePicture] = useCycle(mountainPictures)

  const controls = useAnimationControls()
  useAsyncEffect(async () => {
    if (!isMounted) return

    if (isMenuOpen.value) {
      await controls.start({ zIndex: 56 })
      await controls.start(variants.visible)
      // await controls.start(blurVariants.visible)
    } else {
      // await controls.start(blurVariants.hidden)
      await controls.start(variants.hidden)
      await controls.start({ zIndex: -1 })
      cyclePicture()
    }
  }, [isMenuOpen.value, controls, isMounted, cyclePicture])

  const onNavClick = useFn((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      isMenuOpen.toggle()
    }
  })

  return (
    <motion.nav
      id="navmenu"
      className={cn(
        "fixed inset-0 h-dvh w-dvw overflow-hidden opacity-0 -z-1",
        !isMounted && "hidden",
      )}
      initial="hidden"
      animate={controls}
      transition={{ duration }}
      onClick={onNavClick}
      aria-hidden={!isMenuOpen.value}
    >
      <Box className="absolute inset-0 size-full overscroll-contain">
        <Image
          src={picture}
          alt="Mountain"
          className="brightness-80 object-cover object-center"
          quality={60}
          onClick={isMenuOpen.setFalse}
          fill
        />
      </Box>
      <HStack
        items="center"
        justify="center"
        className="size-full gap-2 md:gap-4 lg:gap-6 xl:gap-8"
      >
        <Link
          href="/"
          prefetch
          className="w-32 sm:scale-125 sm:translate-x-[-12.5%] md:scale-150 md:translate-x-[-25%] transition-all"
          title="Home"
          onClick={isMenuOpen.setFalse}
        >
          <Wordmark shimmer={false} className="text-background" />
        </Link>
        <button
          type="button"
          className="py-2 -my-2 px-4 -mx-4 text-background scale-125"
          onClick={isMenuOpen.setFalse}
        >
          <HamburgerIcon
            direction="right"
            label="Hide Navigation Menu"
            size={24}
            duration={duration * 3}
            toggled={isMenuOpen.value}
            hideOutline
            animateOnMount={duration !== 0}
            rounded
          />
        </button>
        <VStack className="gap-4">
          <CTALinkButton href="/for/biopharma" prefetch onClick={isMenuOpen.setFalse}>
            Biopharma
          </CTALinkButton>
          <CTALinkButton href="/for/agi" prefetch onClick={isMenuOpen.setFalse}>
            AI Labs
          </CTALinkButton>
          <CTALinkButton href="/for/researchers" prefetch onClick={isMenuOpen.setFalse}>
            Researchers
          </CTALinkButton>
        </VStack>
      </HStack>
    </motion.nav>
  )
}
