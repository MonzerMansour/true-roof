"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useSignIn } from "@/components/auth/sign-in-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { audienceFromPath } from "@/lib/site"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { IconBrandGoogle } from "@tabler/icons-react"

type Mode = "signin" | "create"

export function SignInDialog() {
  const pathname = usePathname()
  const router = useRouter()
  const role = audienceFromPath(pathname)
  const { open, setOpen } = useSignIn()
  const [mode, setMode] = React.useState<Mode>("signin")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function reset() {
    setEmail("")
    setPassword("")
    setPending(false)
  }

  async function withClient() {
    const client = createClient()

    if (!client) {
      toast.message("Sign-in is not connected yet.", {
        description:
          "Add your Supabase URL and anon key to .env.local, then try again.",
      })
      return null
    }

    return client
  }

  async function onPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)

    try {
      const client = await withClient()
      if (!client) return

      if (mode === "create") {
        const { error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { role },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) {
          toast.error(error.message)
          return
        }

        toast.success("Check your email to confirm the account.")
        setOpen(false)
        reset()
        return
      }

      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success("You are signed in.")
      setOpen(false)
      reset()

      if (role === "seeker" && pathname === "/") {
        router.push("/get-started")
      } else {
        router.refresh()
      }
    } finally {
      setPending(false)
    }
  }

  async function onGoogle() {
    setPending(true)

    try {
      const client = await withClient()
      if (!client) return

      document.cookie = `true-roof-pending-role=${role}; path=/; max-age=600; samesite=lax`

      const redirect = new URL("/auth/callback", window.location.origin)
      redirect.searchParams.set("role", role)
      redirect.searchParams.set(
        "next",
        role === "seeker" && pathname === "/" ? "/get-started" : pathname
      )

      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirect.toString(),
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      })

      if (error) {
        toast.error(error.message)
      }
    } finally {
      setPending(false)
    }
  }

  async function onMagicLink() {
    if (!email) {
      toast.error("Enter your email first.")
      return
    }

    setPending(true)

    try {
      const client = await withClient()
      if (!client) return

      const { error } = await client.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { role },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success("Check your email for a sign-in link.")
      setOpen(false)
      reset()
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Sign in to True Roof</DialogTitle>
          <DialogDescription>
            One account works on this phone or a borrowed one. You can export or
            delete your data later in one tap.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as Mode)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="create">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="pt-3">
            <AuthForm
              email={email}
              password={password}
              pending={pending}
              creating={false}
              submitLabel="Sign in"
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={onPasswordSubmit}
              onMagicLink={onMagicLink}
              onGoogle={onGoogle}
            />
          </TabsContent>

          <TabsContent value="create" className="pt-3">
            <AuthForm
              email={email}
              password={password}
              pending={pending}
              creating
              submitLabel="Create account"
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={onPasswordSubmit}
              onMagicLink={onMagicLink}
              onGoogle={onGoogle}
            />
          </TabsContent>
        </Tabs>

        {!isSupabaseConfigured() ? (
          <p className="text-xs text-muted-foreground">
            Auth is waiting on Supabase keys. The form is ready; it will not
            create a session until those are set.
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function AuthForm({
  email,
  password,
  pending,
  creating,
  submitLabel,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onMagicLink,
  onGoogle,
}: {
  email: string
  password: string
  pending: boolean
  creating: boolean
  submitLabel: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onMagicLink: () => void
  onGoogle: () => void
}) {
  return (
    <form onSubmit={onSubmit}>
      <FieldGroup className="gap-4">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="w-full"
          onClick={onGoogle}
        >
          <IconBrandGoogle />
          Continue with Google
        </Button>
        <FieldSeparator>or</FieldSeparator>

        <Field>
          <FieldLabel htmlFor="auth-email">Email</FieldLabel>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="auth-password">Password</FieldLabel>
          <Input
            id="auth-password"
            type="password"
            autoComplete={creating ? "new-password" : "current-password"}
            required
            minLength={8}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
          />
          <FieldDescription>
            At least 8 characters. Or skip the password and use a link.
          </FieldDescription>
        </Field>

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Please wait…" : submitLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className="w-full"
            onClick={onMagicLink}
          >
            Email me a sign-in link
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
