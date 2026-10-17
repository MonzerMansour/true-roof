"use client"

import * as React from "react"
import { IconRefresh } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  accessCodeProblem,
  generateAccessCode,
  looksGuessable,
  normalizeAccessCode,
} from "@/lib/portal/access-code"

/**
 * The site's code, picked while the site is being made.
 *
 * Filled in with a generated one rather than left empty, so the common case
 * is to leave it alone and the code is visible from the start instead of
 * being something to go and find afterwards. Typing over it is allowed,
 * because a site that already tells its staff a code on a laminated card
 * should be able to keep using it.
 *
 * It warns rather than refuses on a guessable code. This code is the only
 * thing between a stranger and editing what a shelter tells people about its
 * beds, which is worth saying out loud, but a site may still have a reason.
 */
export function AccessCodeField({
  id = "accessCode",
  name = "accessCode",
}: {
  id?: string
  name?: string
}) {
  const [code, setCode] = React.useState("")

  // Generated on the client after mount: crypto.getRandomValues does not run
  // on the server, and a code in the server-rendered HTML would be the same
  // for everybody who loaded the page before it hydrated.
  React.useEffect(() => setCode(generateAccessCode()), [])

  const problem = accessCodeProblem(code)
  const guessable = !problem && looksGuessable(code)

  return (
    <Field data-invalid={problem ? true : undefined}>
      <FieldLabel htmlFor={id}>Site code</FieldLabel>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={id}
          name={name}
          value={code}
          onChange={(event) => setCode(normalizeAccessCode(event.target.value))}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={16}
          className="w-48 font-mono text-lg tracking-widest uppercase"
        />
        <Button
          type="button"
          variant="outline"
          size="touch"
          onClick={() => setCode(generateAccessCode())}
        >
          <IconRefresh />
          New code
        </Button>
      </div>
      <FieldDescription>
        Give this to anyone helping run the site and they can edit it. You can
        change it later from the site&apos;s own page.
      </FieldDescription>
      {problem ? <FieldError>{problem}</FieldError> : null}
      {guessable ? (
        <FieldDescription className="text-amber-600 dark:text-amber-500">
          Someone could guess this one. Anybody who does can edit what this
          site tells people.
        </FieldDescription>
      ) : null}
    </Field>
  )
}
