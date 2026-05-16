import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { diaryEntry } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      // Fixed the typo here: changed .jsoan to .json
      return NextResponse.json({ error: "Server Error: GEMINI_API_KEY is missing in Vercel settings." }, { status: 500 });
    }

    // Using gemini-1.5-flash-latest for better regional compatibility
    const model = "gemini-1.5-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

    const response = await fetch(url, {
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
      // Pass the specific Google error message back to the frontend
      return NextResponse.json({ 
        error: data.error?.message || "Google API returned an error." 
      }, { status: response.status });
    }

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error("Empty response from AI");

    return NextResponse.json(JSON.parse(textResponse));

  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "The Sieve encountered a technical glitch." }, { status: 500 });
  }
}