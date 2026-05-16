import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { diaryEntry } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      return NextResponse.json({ error: "Server Error: GEMINI_API_KEY is missing in Vercel settings." }, { status: 500 });
    }

    const systemPrompt = `You are the "TruSelf Master Behavioral Coach". You specialize in identifying deep cognitive patterns, emotional undertones, and "life-scripts" that hold people back. 
    
    INSTRUCTIONS:
    - Analyze the user entry for hidden patterns.
    - Respond ONLY in valid JSON.
    
    JSON SCHEMA:
    {
      "summary": "deep synthesis (2 sentences)",
      "topDomain": "The TruSelf Domain this relates to",
      "emotionalUndertone": "the emotions masked behind the words",
      "patternDiagnosis": "Identify the recurring life pattern",
      "worthConsidering": "Strategic advice for the user",
      "coachingQuestion": "one sharp, deep question to leave them with"
    }`;

    // A robust, bulletproof cascade of request formats to support any regional/tier Google project configuration
    const attempts = [
      // Attempt 1: Standard v1beta with strict JSON response
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        body: {
          contents: [{ parts: [{ text: systemPrompt + "\n\nUser Entry: " + diaryEntry }] }],
          generationConfig: { responseMimeType: "application/json" }
        }
      },
      // Attempt 2: Stable v1 endpoint (some accounts prefer snake_case proto casing)
      {
        url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        body: {
          contents: [{ parts: [{ text: systemPrompt + "\n\nUser Entry: " + diaryEntry }] }],
          generationConfig: { response_mime_type: "application/json" } 
        }
      },
      // Attempt 3: Fail-safe without any responseMimeType parameters (works globally on legacy projects)
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        body: {
          contents: [{ parts: [{ text: systemPrompt + "\n\nUser Entry: " + diaryEntry }] }]
        }
      }
    ];

    let lastError = null;

    for (let i = 0; i < attempts.length; i++) {
      try {
        const attempt = attempts[i];
        const response = await fetch(attempt.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attempt.body)
        });

        const data = await response.json();

        if (!response.ok) {
          console.warn(`Gemini Model fallback attempt ${i + 1} bypassed:`, data.error?.message || response.statusText);
          lastError = data.error?.message || `Status ${response.status}`;
          continue; 
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
          lastError = "Empty response returned from Google AI Studio.";
          continue;
        }

        // Clean any markdown formatting code-blocks (e.g. ```json ... ```) returned during Attempt 3 fallback
        const cleanText = textResponse.trim()
          .replace(/^