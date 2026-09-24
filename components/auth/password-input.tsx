"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

/**
 * Contraseña con «mostrar». El botón no roba el foco del campo (se puede
 * alternar sin perder lo escrito) y anuncia su estado con `aria-pressed`.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof InputGroupInput>, "type">) {
  const t = useTranslations("auth.password")
  const [visible, setVisible] = React.useState(false)

  return (
    <InputGroup className={className ?? "h-11"}>
      <InputGroupInput
        type={visible ? "text" : "password"}
        spellCheck={false}
        autoCapitalize="none"
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-sm"
          aria-label={visible ? t("hide") : t("show")}
          aria-pressed={visible}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
