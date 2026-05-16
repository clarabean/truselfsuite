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
    - Respond ONLY in valid JSON with no extra text, no markdown, no code blocks.
    
    JSON SCHEMA:
    {
      "summary": "deep synthesis (2 sentences)",
      "topDomain": "The TruSelf Domain this relates to most: Advancement, Achievement, Creation/Choice, Resource Gaining, Vitality, Dreams/Passions, People, or Connection",
      "emotionalUndertone": "the emotions masked behind the words",
      "patternDiagnosis": "Identify the recurring life pattern",
      "worthConsidering": "Strategic advice for the user",
      "coachingQuestion": "one sharp, deep question to leave them with"
    }`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\nUser Entry: " + diaryEntry }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data.error?.message);
      return NextResponse.json({ error: data.error?.message || "Google is busy. Try again in 60 seconds." }, { status: response.status });
    }

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      return NextResponse.json({ error: "Empty response from AI." }, { status: 500 });
    }

    const cleaned = textResponse.trim().replace(/^```json|^```|```$/g, '').trim();
    return NextResponse.json(JSON.parse(cleaned));

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "The Sieve encountered a technical glitch." }, { status: 500 });
  }
}