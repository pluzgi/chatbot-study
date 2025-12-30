"use server"

import type { FormData, PlanData, DocumentSummary } from "./types"
import { generateFallbackPlan, buildPrompt, SYSTEM_PROMPT } from "./apertus-service"

export async function generateRescuePlanAction(formData: FormData): Promise<PlanData> {
  const apiKey = process.env.SWISS_AI_PLATFORM_API_KEY
  const apiBaseUrl = process.env.OPENAI_API_BASE_URL || "https://api.swisscom.com/layer/swiss-ai-weeks/apertus-70b/v1"
  const model = process.env.OPENAI_MODEL || "swiss-ai/Apertus-70B"

  if (!apiKey || apiKey === "your_api_key_here" || apiKey.startsWith("sk-your-")) {
    console.warn("[v0] No valid API key found or API key is placeholder")
    console.warn("[v0] Please add your actual API key to .env.local file")
    console.warn("[v0] Supported providers: Swiss AI Platform, OpenAI, OpenRouter, or any OpenAI-compatible API")
    console.warn("[v0] Using fallback plan instead")
    return generateFallbackPlan(formData)
  }

  console.log(`[v0] Using API: ${apiBaseUrl}`)
  console.log(`[v0] Model: ${model}`)

  try {
    // Extract file content if file is provided
    let fileContent = ""

    // Check if it's a text/MD file (already read on client side)
    if (formData.fileContent) {
      fileContent = formData.fileContent
      console.log("[v0] Using text/MD file content")
      console.log(`[v0] Content length: ${fileContent.length} characters`)
      console.log(`[v0] Preview (first 200 chars): ${fileContent.substring(0, 200)}...`)
    }
    // Otherwise try PDF extraction
    else if (formData.uploadedFile) {
      try {
        console.log(`[v0] Extracting PDF: ${formData.uploadedFile.name}`)
        // Dynamic import to avoid bundling pdfjs-dist in browser
        const { extractTextFromPDFWithLimit } = await import("./pdf-utils")
        fileContent = await extractTextFromPDFWithLimit(formData.uploadedFile, 15000, 20)
        console.log("[v0] PDF extraction completed successfully")
        console.log(`[v0] Preview (first 200 chars): ${fileContent.substring(0, 200)}...`)
      } catch (error) {
        console.error("[v0] Failed to extract PDF content:", error)
        if (error instanceof Error) {
          console.error("[v0] Error details:", error.message)
        }
        // Continue without PDF content if extraction fails
      }
    }

    // Combine user context and file content
    const combinedContext = [
      formData.additionalInfo,
      fileContent
    ].filter(Boolean).join("\n\n")

    const prompt = buildPrompt(formData, combinedContext)

    const apiUrl = `${apiBaseUrl}/chat/completions`
    console.log(`[v0] Calling API: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    let content = data.choices[0].message.content

    // Clean up the response - remove markdown code blocks if present
    content = content.trim()
    if (content.startsWith("```json")) {
      content = content.replace(/^```json\n/, "").replace(/\n```$/, "")
    } else if (content.startsWith("```")) {
      content = content.replace(/^```\n/, "").replace(/\n```$/, "")
    }

    console.log("[v0] Cleaned response (first 300 chars):", content.substring(0, 300))

    // Parse JSON response
    const planData = JSON.parse(content)
    console.log("[v0] Successfully parsed plan data")
    return planData
  } catch (error) {
    console.error("[v0] Error calling AI API:", error)
    console.error("[v0] Falling back to local plan generation")
    return generateFallbackPlan(formData)
  }
}

export async function generateSpeechAction(text: string): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey || apiKey === "your_elevenlabs_api_key_here") {
    console.warn("[v0] No valid ElevenLabs API key found")
    throw new Error("ElevenLabs API key not configured")
  }

  try {
    const voiceId = "JBFqnCBsd6RMkjVDRZzb" // Rachel voice
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString("base64")

    return base64Audio
  } catch (error) {
    console.error("[v0] Error generating speech:", error)
    throw new Error("Failed to generate speech")
  }
}

export async function generateDocumentSummaryAction(content: string): Promise<DocumentSummary> {
  const apiKey = process.env.SWISS_AI_PLATFORM_API_KEY
  const apiBaseUrl = process.env.OPENAI_API_BASE_URL || "https://api.swisscom.com/layer/swiss-ai-weeks/apertus-70b/v1"
  const model = process.env.OPENAI_MODEL || "swiss-ai/Apertus-70B"

  if (!apiKey || apiKey === "your_api_key_here" || apiKey.startsWith("sk-your-")) {
    console.warn("[v0] No valid API key found for document summary")
    throw new Error("API key not configured")
  }

  const summaryPrompt = `Analyze this study material and provide a structured summary.

DOCUMENT CONTENT:
${content}

Provide a JSON response with the following structure:
{
  "mainTopics": [string] (3-5 main topics covered),
  "keyConceptsCount": number (estimate of distinct concepts),
  "estimatedDifficulty": "beginner" | "intermediate" | "advanced",
  "recommendedStudyHours": number (realistic estimate),
  "briefOverview": string (2-3 sentence overview)
}

Return ONLY valid JSON, no markdown or additional text.`

  try {
    const apiUrl = `${apiBaseUrl}/chat/completions`
    console.log(`[v0] Generating document summary using ${model}`)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a document analysis expert. Analyze documents and provide structured summaries in JSON format.",
          },
          {
            role: "user",
            content: summaryPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    let summaryContent = data.choices[0].message.content

    // Clean up response - remove markdown code blocks if present
    summaryContent = summaryContent.trim()
    if (summaryContent.startsWith("```json")) {
      summaryContent = summaryContent.replace(/^```json\n/, "").replace(/\n```$/, "")
    } else if (summaryContent.startsWith("```")) {
      summaryContent = summaryContent.replace(/^```\n/, "").replace(/\n```$/, "")
    }

    const summary = JSON.parse(summaryContent)
    console.log("[v0] Successfully generated document summary")
    return summary
  } catch (error) {
    console.error("[v0] Error generating document summary:", error)
    throw new Error("Failed to generate document summary")
  }
}
