import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { diaryEntry } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      return NextResponse.json(
        { error: "Server Error: GEMINI_API_KEY is missing in Vercel settings." }, 
        { status: 500 }
      );
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

    const configurations = [
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        body: {
          contents: [{ parts: [{ text: systemPrompt + "\n\nUser Entry: " + diaryEntry }] }],
          generationConfig: { responseMimeType: "application/json" }
        }
      },
      {
        url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        body: {
          contents: [{ parts: [{ text: systemPrompt + "\n\nUser Entry: " + diaryEntry }] }],
          generationConfig: { response_mime_type: "application/json" } 
        }
      },
      {
        url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        body: {
          contents: [{ parts: [{ text: systemPrompt + "\n\nUser Entry: " + diaryEntry }] }],
          generationConfig: { response_mime_type: "application/json" } 
        }
      },
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        body: {
          contents: [{ parts: [{ text: systemPrompt + "\n\nUser Entry: " + diaryEntry }] }],
          generationConfig: { responseMimeType: "application/json" }
        }
      }
    ];

    let lastError = null;

    for (let i = 0; i < configurations.length; i++) {
      try {
        const config = configurations[i];
        const response = await fetch(config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config.body)
        });

        const data = await response.json();

        if (!response.ok) {
          console.warn(`Configuration ${i + 1} bypassed:`, data.error?.message || response.statusText);
          lastError = data.error?.message || `Status ${response.status}`;
          continue;
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
          lastError = "Empty response returned from Google AI Studio.";
          continue;
        }

        // Clean JSON markdown wraps safely using hex backtick escapes
        const cleanText = textResponse.trim()
          .replace(/^\x60{3}(?:json)?\s*/i, "")
          .replace(/\s*\x60{3}$/, "")
          .trim();

        // Safely parse it locally before transmitting to verify integrity
        const parsedJson = JSON.parse(cleanText);
        return NextResponse.json(parsedJson);

      } catch (err) {
        console.error(`Configuration ${i + 1} exception:`, err);
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json({ 
      error: `Could not configure secure channel with Google AI. Details: ${lastError}` 
    }, { status: 400 });

  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "The Sieve encountered a technical glitch." }, { status: 500 });
  }
}