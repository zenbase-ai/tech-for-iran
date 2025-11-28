"use client"

import * as AccordionPrimitive from "@radix-ui/react-accordion"
import type { CheckoutParams, CheckoutResult, ProductItem } from "autumn-js"
import { useCustomer } from "autumn-js/react"
import { useEffect, useState } from "react"
import { LuArrowRight, LuChevronDown, LuLoader } from "react-icons/lu"
import { Stack, VStack } from "@/components/layout/stack"
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loading } from "@/components/ui/loading"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getCheckoutContent } from "@/lib/autumn/checkout-content"
import { cn } from "@/lib/utils"

export type CheckoutDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  checkoutResult: CheckoutResult
  checkoutParams?: CheckoutParams
}

const formatCurrency = ({ amount, currency }: { amount: number; currency: string }) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)

export const CheckoutDialog: React.FC<CheckoutDialogProps> = (props) => {
  const { attach } = useCustomer()
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | undefined>(
    props?.checkoutResult
  )

  useEffect(() => {
    if (props.checkoutResult) {
      setCheckoutResult(props.checkoutResult)
    }
  }, [props.checkoutResult])

  const [loading, setLoading] = useState(false)

  if (!checkoutResult) {
    return null
  }

  const { open, setOpen } = props
  const { title, message } = getCheckoutContent(checkoutResult)

  const isFree = checkoutResult?.product.properties?.is_free
  const isPaid = isFree === false

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="p-0 pt-4 gap-0 text-foreground text-sm">
        <DialogTitle className="px-6 mb-1">{title}</DialogTitle>
        <div className="px-6 mt-1 mb-4 text-muted-foreground">{message}</div>

        {isPaid && checkoutResult && (
          <PriceInformation checkoutResult={checkoutResult} setCheckoutResult={setCheckoutResult} />
        )}

        <DialogFooter className="flex flex-col sm:flex-row justify-between gap-x-4 py-2 pl-6 pr-3 bg-secondary border-t shadow-inner">
          <Button
            className="min-w-16 flex items-center gap-2"
            disabled={loading}
            onClick={async () => {
              setLoading(true)

              const options = checkoutResult.options.map((option) => ({
                featureId: option.feature_id,
                quantity: option.quantity,
              }))

              await attach({
                productId: checkoutResult.product.id,
                ...(props.checkoutParams || {}),
                options,
              })
              setOpen(false)
              setLoading(false)
            }}
            size="sm"
          >
            {loading ? <Loading /> : <span className="whitespace-nowrap flex gap-1">Confirm</span>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type PriceInformationProps = {
  checkoutResult: CheckoutResult
  setCheckoutResult: (checkoutResult: CheckoutResult) => void
}

const PriceInformation: React.FC<PriceInformationProps> = ({
  checkoutResult,
  setCheckoutResult,
}) => (
  <VStack className="px-6 mb-4 gap-4">
    <ProductItems checkoutResult={checkoutResult} setCheckoutResult={setCheckoutResult} />
    <VStack className="gap-2">
      {checkoutResult?.has_prorations && checkoutResult.lines.length > 0 && (
        <CheckoutLines checkoutResult={checkoutResult} />
      )}
      <DueAmounts checkoutResult={checkoutResult} />
    </VStack>
  </VStack>
)

type DueAmountsProps = {
  checkoutResult: CheckoutResult
}

const DueAmounts: React.FC<DueAmountsProps> = ({ checkoutResult }) => {
  const { next_cycle, product } = checkoutResult
  const nextCycleAtStr = next_cycle
    ? new Date(next_cycle.starts_at).toLocaleDateString()
    : undefined

  const hasUsagePrice = product.items.some((item) => item.usage_model === "pay_per_use")

  const showNextCycle = next_cycle && next_cycle.total !== checkoutResult.total

  return (
    <VStack className="gap-1">
      <Stack justify="between">
        <div>
          <p className="font-medium text-md">Total due today</p>
        </div>

        <p className="font-medium text-md">
          {formatCurrency({
            amount: checkoutResult?.total,
            currency: checkoutResult?.currency,
          })}
        </p>
      </Stack>
      {showNextCycle && (
        <Stack className="text-muted-foreground" justify="between">
          <div>
            <p className="text-md">Due next cycle ({nextCycleAtStr})</p>
          </div>
          <p className="text-md">
            {formatCurrency({
              amount: next_cycle.total,
              currency: checkoutResult?.currency,
            })}
            {hasUsagePrice && <span> + usage prices</span>}
          </p>
        </Stack>
      )}
    </VStack>
  )
}

type ProductItemsProps = {
  checkoutResult: CheckoutResult
  setCheckoutResult: (checkoutResult: CheckoutResult) => void
}

const ProductItems: React.FC<ProductItemsProps> = ({ checkoutResult, setCheckoutResult }) => {
  const isUpdateQuantity =
    checkoutResult?.product.scenario === "active" && checkoutResult.product.properties.updateable

  const isOneOff = checkoutResult?.product.properties.is_one_off

  return (
    <VStack className="gap-2">
      <p className="text-sm font-medium">Price</p>
      {checkoutResult?.product.items
        .filter((item) => item.type !== "feature")
        .map((item, index) => {
          if (item.usage_model === "prepaid") {
            return (
              <PrepaidItem
                checkoutResult={checkoutResult}
                item={item}
                // biome-ignore lint/suspicious/noArrayIndexKey: index is used as key
                key={index}
                setCheckoutResult={setCheckoutResult}
              />
            )
          }

          if (isUpdateQuantity) {
            return null
          }

          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: index is used as key
            <Stack className="justify-between" key={index}>
              <p className="text-muted-foreground">
                {item.feature ? item.feature.name : isOneOff ? "Price" : "Subscription"}
              </p>
              <p>
                {item.display?.primary_text} {item.display?.secondary_text}
              </p>
            </Stack>
          )
        })}
    </VStack>
  )
}

type CheckoutLinesProps = {
  checkoutResult: CheckoutResult
}

const CheckoutLines: React.FC<CheckoutLinesProps> = ({ checkoutResult }) => (
  <Accordion collapsible type="single">
    <AccordionItem className="border-b-0" value="total">
      <CustomAccordionTrigger className="justify-between w-full my-0 py-0 border-none">
        <div className="cursor-pointer flex items-center gap-1 w-full justify-end">
          <p className="font-light text-muted-foreground">View details</p>
          <LuChevronDown
            className="text-muted-foreground mt-0.5 rotate-90 transition-transform duration-200 ease-in-out"
            size={14}
          />
        </div>
      </CustomAccordionTrigger>
      <AccordionContent className="mt-2 mb-0 pb-2 flex flex-col gap-2">
        {checkoutResult?.lines
          .filter((line) => line.amount !== 0)
          .map((line, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: index is used as key
            <div className="flex justify-between" key={index}>
              <p className="text-muted-foreground">{line.description}</p>
              <p className="text-muted-foreground">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: checkoutResult?.currency,
                }).format(line.amount)}
              </p>
            </div>
          ))}
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)

const CustomAccordionTrigger: React.FC<React.ComponentProps<typeof AccordionPrimitive.Trigger>> = ({
  className,
  children,
  ...props
}) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]_svg]:rotate-0",
        className
      )}
      data-slot="accordion-trigger"
      {...props}
    >
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
)

type PrepaidItemProps = {
  item: ProductItem
  checkoutResult: CheckoutResult
  setCheckoutResult: (checkoutResult: CheckoutResult) => void
}

const PrepaidItem: React.FC<PrepaidItemProps> = ({ item, checkoutResult, setCheckoutResult }) => {
  const { quantity = 0, billing_units: billingUnits = 1 } = item
  const [quantityInput, setQuantityInput] = useState<string>((quantity / billingUnits).toString())
  const { checkout } = useCustomer()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const scenario = checkoutResult.product.scenario

  const handleSave = async () => {
    setLoading(true)
    try {
      const newOptions = checkoutResult.options
        .filter((option) => option.feature_id !== item.feature_id)
        .map((option) => ({
          featureId: option.feature_id,
          quantity: option.quantity,
        }))

      newOptions.push({
        // biome-ignore lint/style/noNonNullAssertion: item.feature_id is guaranteed to be non-null
        featureId: item.feature_id!,
        quantity: Number(quantityInput) * billingUnits,
      })

      const { data, error } = await checkout({
        productId: checkoutResult.product.id,
        options: newOptions,
        dialog: CheckoutDialog,
      })

      if (error) {
        console.error(error)
        return
      }
      setCheckoutResult(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const disableSelection = scenario === "renew"

  return (
    <div className="flex justify-between gap-2">
      <div className="flex gap-2 items-start">
        <p className="text-muted-foreground whitespace-nowrap">{item.feature?.name}</p>
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger
            className={cn(
              "text-muted-foreground text-xs px-1 py-0.5 rounded-md flex items-center gap-1 bg-accent/80 shrink-0",
              disableSelection !== true && "hover:bg-accent hover:text-foreground",
              disableSelection && "pointer-events-none opacity-80 cursor-not-allowed"
            )}
            disabled={disableSelection}
          >
            Qty: {quantity}
            {!disableSelection && <LuChevronDown size={12} />}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 text-sm p-4 pt-3 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{item.feature?.name}</p>
              <p className="text-muted-foreground">
                {item.display?.primary_text} {item.display?.secondary_text}
              </p>
            </div>

            <div className="flex justify-between items-end">
              <div className="flex gap-2 items-center">
                <Input
                  className="h-7 w-16 focus:ring-2!"
                  onChange={(e) => setQuantityInput(e.target.value)}
                  value={quantityInput}
                />
                <p className="text-muted-foreground">
                  {billingUnits > 1 && `x ${billingUnits} `}
                  {item.feature?.name}
                </p>
              </div>

              <Button
                className="w-14 h-7! text-sm items-center bg-white text-foreground shadow-sm border border-zinc-200 hover:bg-zinc-100"
                disabled={loading}
                onClick={handleSave}
              >
                {loading ? (
                  <LuLoader className="text-muted-foreground animate-spin size-4!" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-end">
        {item.display?.primary_text} {item.display?.secondary_text}
      </p>
    </div>
  )
}

export const PriceItem: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <VStack
    className={cn(
      "pb-4 sm:pb-0 gap-1 sm:flex-row justify-between sm:h-7 sm:gap-2 sm:items-center",
      className
    )}
    {...props}
  >
    {children}
  </VStack>
)

export const PricingDialogButton: React.FC<ButtonProps> = ({ children, ...props }) => (
  <Button {...props}>
    {children}
    <LuArrowRight className="h-3!" />
  </Button>
)
