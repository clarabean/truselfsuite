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

    // List of reliable Google models to try in order of preference
    const models = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-2.5-flash",
      "gemini-1.5-pro"
    ];

    let response;
    let lastError = null;

    for (const model of models) {
      try {
        // Using stable production endpoint v1 instead of v1beta for better global consistency
        const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
        
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + "\n\nUser Entry: " + diaryEntry }] }],
            generationConfig: { 
              responseMimeType: "application/json" 
            }
          })
        });

        const data = await response.json();

        if (!response.ok) {
          console.warn(`Model ${model} failed on server:`, data.error?.message || response.statusText);
          lastError = data.error?.message || `Status ${response.status}`;
          continue; // Try the next model
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
          lastError = "Empty response returned from Google AI Studio";
          continue; 
        }

        // Successfully parsed and completed AI query
        return NextResponse.json(JSON.parse(textResponse));
      } catch (err) {
        console.error(`Attempt with model ${model} encountered an exception:`, err);
        lastError = err.message;
      }
    }

    // Return the specific reason we failed so the frontend error console can display it clearly
    return NextResponse.json({ 
      error: `Could not reach any active Gemini models. Connection details: ${lastError}` 
    }, { status: 404 });

  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "The Sieve encountered a technical glitch." }, { status: 500 });
  }
}