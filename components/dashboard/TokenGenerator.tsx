"use client"

import { useState, useTransition } from "react"
import { generateTokenAction } from "app/actions/tokens"
import { Button } from "components/ui/button"
import { Input } from "components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card"

export function TokenGenerator() {
  const [isPending, startTransition] = useTransition()
  const [url, setUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = () => {
    setError(null)
    startTransition(async () => {
      const result = await generateTokenAction()
      if (result.success && result.url) {
        setUrl(result.url)
      } else {
        setError(result.error ?? "Failed to generate token")
      }
    })
  }

  const handleCopy = async () => {
    if (url) {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate event link</CardTitle>
        <CardDescription>
          Send this link to your client so they can create their event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? "Generating..." : "Generate new link"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {url && (
            <div className="flex gap-2">
              <Input value={url} readOnly />
              <Button variant="outline" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}