import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { diaryEntry } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      return NextResponse.json({ error: "API Key not configured in Vercel settings." }, { status: 500 });
    }

    const systemPrompt = `You are the "TruSelf Master Behavioral Coach". You specialize in identifying deep cognitive patterns, emotional undertones, and "life-scripts" that hold people back. 
    
    INSTRUCTIONS:
    - Analyze the user entry for hidden patterns.
    - Be sharp, professional, and insightful.
    - Do not break character.
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
      console.error("Google API Error:", data);
      return NextResponse.json({ 
        error: data.error?.message || "Google is busy. Try again in 60 seconds." 
      }, { status: response.status });
    }

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return NextResponse.json(JSON.parse(textResponse));

  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "The Sieve encountered a technical glitch." }, { status: 500 });
  }
}