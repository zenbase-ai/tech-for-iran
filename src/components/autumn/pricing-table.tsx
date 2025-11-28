import type { Product, ProductItem } from "autumn-js"

import { type ProductDetails, useCustomer, usePricingTable } from "autumn-js/react"
import type React from "react"
import { createContext, useContext, useEffectEvent, useState } from "react"
import { LuLoader } from "react-icons/lu"
import { CheckoutDialog } from "@/components/autumn/checkout-dialog"
import { Stack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { Switch } from "@/components/ui/switch"
import { getPricingTableContent } from "@/lib/autumn/pricing-table-content"
import { cn } from "@/lib/utils"

export default function PricingTable({ productDetails }: { productDetails?: ProductDetails[] }) {
  const { customer, checkout } = useCustomer({ errorOnNotFound: false })

  const [isAnnual, setIsAnnual] = useState(false)
  const { products, isLoading, error } = usePricingTable({ productDetails })

  if (isLoading) {
    return (
      <Stack className="w-full h-full min-h-[300px]" items="center" justify="center">
        <Loading />
      </Stack>
    )
  }

  if (error) {
    return <div>Something went wrong...</div>
  }

  const intervals = Array.from(
    new Set(products?.map((p) => p.properties?.interval_group).filter(Boolean))
  )

  const multiInterval = intervals.length > 1

  const intervalFilter = (product: Product) => {
    if (!product.properties?.interval_group) {
      return true
    }

    if (multiInterval) {
      if (isAnnual) {
        return product.properties?.interval_group === "year"
      }
      return product.properties?.interval_group === "month"
    }

    return true
  }

  return (
    <div className={cn("root")}>
      {products && (
        <PricingTableContainer
          isAnnualToggle={isAnnual}
          multiInterval={multiInterval}
          products={products}
          setIsAnnualToggle={setIsAnnual}
        >
          {products.filter(intervalFilter).map((product) => (
            <PricingCard
              buttonProps={{
                disabled:
                  (product.scenario === "active" && !product.properties.updateable) ||
                  product.scenario === "scheduled",

                onClick: async () => {
                  if (product.id && customer) {
                    await checkout({
                      productId: product.id,
                      dialog: CheckoutDialog,
                    })
                  } else if (product.display?.button_url) {
                    window.open(product.display?.button_url, "_blank")
                  }
                },
              }}
              key={product.id}
              productId={product.id}
            />
          ))}
        </PricingTableContainer>
      )}
    </div>
  )
}

type PricingTableContextType = {
  isAnnualToggle: boolean
  setIsAnnualToggle: (isAnnual: boolean) => void
  products: Product[]
  showFeatures: boolean
}

const PricingTableContext = createContext<PricingTableContextType>({
  isAnnualToggle: false,
  setIsAnnualToggle: () => {
    return
  },
  products: [],
  showFeatures: true,
})

export const usePricingTableContext = (componentName: string) => {
  const context = useContext(PricingTableContext)

  if (context === undefined) {
    throw new Error(`${componentName} must be used within <PricingTable />`)
  }

  return context
}

type PricingTableContainerProps = {
  children?: React.ReactNode
  products?: Product[]
  showFeatures?: boolean
  className?: string
  isAnnualToggle: boolean
  setIsAnnualToggle: (isAnnual: boolean) => void
  multiInterval: boolean
}

export const PricingTableContainer: React.FC<PricingTableContainerProps> = ({
  children,
  products,
  showFeatures = true,
  className,
  isAnnualToggle,
  setIsAnnualToggle,
  multiInterval,
}) => {
  if (!products) {
    throw new Error("products is required in <PricingTable />")
  }

  if (products.length === 0) {
    return null
  }

  const hasRecommended = products?.some((p) => p.display?.recommend_text)
  return (
    <PricingTableContext.Provider
      value={{ isAnnualToggle, setIsAnnualToggle, products, showFeatures }}
    >
      <VStack className={cn(hasRecommended && "py-10!")} items="center">
        {multiInterval && (
          <div className={cn(products.some((p) => p.display?.recommend_text) && "mb-8")}>
            <AnnualSwitch isAnnualToggle={isAnnualToggle} setIsAnnualToggle={setIsAnnualToggle} />
          </div>
        )}
        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] w-full gap-2",
            className
          )}
        >
          {children}
        </div>
      </VStack>
    </PricingTableContext.Provider>
  )
}

type PricingCardProps = {
  productId: string
  showFeatures?: boolean
  className?: string
  onButtonClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  buttonProps?: React.ComponentProps<"button">
}

export const PricingCard: React.FC<PricingCardProps> = ({ productId, className, buttonProps }) => {
  const { products, showFeatures } = usePricingTableContext("PricingCard")

  const product = products.find((p) => p.id === productId)

  if (!product) {
    throw new Error(`Product with id ${productId} not found`)
  }

  const { name, display: productDisplay } = product

  const { buttonText } = getPricingTableContent(product)

  const isRecommended = !!productDisplay?.recommend_text
  const mainPriceDisplay = product.properties?.is_free
    ? {
        primary_text: "Free",
      }
    : product.items[0].display

  const featureItems = product.properties?.is_free ? product.items : product.items.slice(1)

  return (
    <div
      className={cn(
        " w-full h-full py-6 text-foreground border rounded-lg shadow-sm max-w-xl",
        isRecommended &&
          "lg:-translate-y-6 lg:shadow-lg dark:shadow-zinc-800/80 lg:h-[calc(100%+48px)] bg-secondary/40",
        className
      )}
    >
      {productDisplay?.recommend_text && (
        <RecommendedBadge recommended={productDisplay.recommend_text} />
      )}
      <VStack className={cn("h-full grow", isRecommended && "lg:translate-y-6")}>
        <div className="h-full">
          <VStack>
            <div className="pb-4">
              <h2 className="text-2xl font-semibold px-6 truncate">
                {productDisplay?.name || name}
              </h2>
              {productDisplay?.description && (
                <div className="text-sm text-muted-foreground px-6 h-8">
                  <p className="line-clamp-2">{productDisplay?.description}</p>
                </div>
              )}
            </div>
            <div className="mb-2">
              <h3 className="font-semibold h-16 flex px-6 items-center border-y mb-4 bg-secondary/40">
                <div className="line-clamp-2">
                  {mainPriceDisplay?.primary_text}{" "}
                  {mainPriceDisplay?.secondary_text && (
                    <span className="font-normal text-muted-foreground mt-1">
                      {mainPriceDisplay?.secondary_text}
                    </span>
                  )}
                </div>
              </h3>
            </div>
          </VStack>
          {showFeatures && featureItems.length > 0 && (
            <div className="grow px-6 mb-6">
              <PricingFeatureList
                everythingFrom={product.display?.everything_from}
                items={featureItems}
              />
            </div>
          )}
        </div>
        <div className={cn("px-6 ", isRecommended && "lg:-translate-y-12")}>
          <PricingCardButton recommended={isRecommended} {...buttonProps}>
            {productDisplay?.button_text || buttonText}
          </PricingCardButton>
        </div>
      </VStack>
    </div>
  )
}

// Pricing Feature List
type PricingFeatureListProps = {
  items: ProductItem[]
  everythingFrom?: string
  className?: string
}

export const PricingFeatureList: React.FC<PricingFeatureListProps> = ({
  items,
  everythingFrom,
  className,
}) => (
  <div className={cn("grow", className)}>
    {everythingFrom && <p className="text-sm mb-4">Everything from {everythingFrom}, plus:</p>}
    <div className="space-y-3">
      {items.map((item) => (
        <div className="flex items-start gap-2 text-sm" key={item.feature_id}>
          {/* {showIcon && (
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            )} */}
          <div className="flex flex-col">
            <span>{item.display?.primary_text}</span>
            {item.display?.secondary_text && (
              <span className="text-sm text-muted-foreground">{item.display?.secondary_text}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Pricing Card Button
export type PricingCardButtonProps = React.ComponentProps<"button"> & {
  recommended?: boolean
  buttonUrl?: string
}

export const PricingCardButton: React.FC<PricingCardButtonProps> = ({
  recommended,
  children,
  className,
  onClick,
  ref,
  ...props
}) => {
  const [loading, setLoading] = useState(false)

  const handleClick = useEffectEvent(async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true)
    try {
      await onClick?.(e)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  })

  return (
    <Button
      className={cn(
        "w-full py-3 px-4 group overflow-hidden relative transition-all duration-300 hover:brightness-90 border rounded-lg",
        className
      )}
      {...props}
      disabled={loading || props.disabled}
      onClick={handleClick}
      ref={ref}
      variant={recommended ? "default" : "secondary"}
    >
      {loading ? (
        <LuLoader className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <div className="flex items-center justify-between w-full transition-transform duration-300 group-hover:translate-y-[-130%]">
            <span>{children}</span>
            <span className="text-sm">→</span>
          </div>
          <div className="flex items-center justify-between w-full absolute px-4 translate-y-[130%] transition-transform duration-300 group-hover:translate-y-0 mt-2 group-hover:mt-0">
            <span>{children}</span>
            <span className="text-sm">→</span>
          </div>
        </>
      )}
    </Button>
  )
}

type AnnualSwitchProps = {
  isAnnualToggle: boolean
  setIsAnnualToggle: (isAnnual: boolean) => void
}

export const AnnualSwitch: React.FC<AnnualSwitchProps> = ({
  isAnnualToggle,
  setIsAnnualToggle,
}) => (
  <div className="flex items-center space-x-2 mb-4">
    <span className="text-sm text-muted-foreground">Monthly</span>
    <Switch checked={isAnnualToggle} id="annual-billing" onCheckedChange={setIsAnnualToggle} />
    <span className="text-sm text-muted-foreground">Annual</span>
  </div>
)

export const RecommendedBadge = ({ recommended }: { recommended: string }) => (
  <div className="bg-secondary absolute border text-muted-foreground text-sm font-medium lg:rounded-full px-3 lg:py-0.5 lg:top-4 lg:right-4 -top-px -right-px rounded-bl-lg">
    {recommended}
  </div>
)
