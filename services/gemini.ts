import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '../lib/firebaseAdmin';
import { EmailMetadata } from '../types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize the Google Generative AI client
const getGeminiClient = () => {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not configured in environment variables.');
    return null;
  }
  return new GoogleGenerativeAI(GEMINI_API_KEY);
};

interface AIAnalysisResult {
  summary: string;
  actionItems: string[];
  keyEntities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  category: 'Leads' | 'Finance' | 'Personal' | 'Work' | 'Support' | 'Marketing' | 'Spam-like';
  leadScore: number;
  leadExtraction?: {
    company?: string;
    contactName?: string;
    intent?: string;
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
  };
}

/**
 * Analyzes email content using Gemini API to generate summary, sentiment, category, leads, etc.
 */
export async function analyzeEmailWithAI(
  uid: string,
  emailId: string
): Promise<EmailMetadata> {
  const emailRef = adminDb.collection('emails').doc(`${uid}_${emailId}`);
  const emailSnap = await emailRef.get();
  
  if (!emailSnap.exists) {
    throw new Error(`Email with ID ${emailId} not found in Firestore.`);
  }

  const emailData = emailSnap.data() as EmailMetadata;
  const aiClient = getGeminiClient();

  if (!aiClient) {
    console.warn('Gemini client not initialized. Skipping AI enrichment.');
    return emailData;
  }

  const emailContent = `
    FROM: ${emailData.from}
    TO: ${emailData.to}
    SUBJECT: ${emailData.subject}
    SNIPPET: ${emailData.snippet}
    
    BODY:
    ${emailData.body.slice(0, 4000)}
  `;

  const prompt = `
    You are an advanced email analysis assistant. Analyze the email provided below.
    Perform the following tasks:
    1. Provide a concise 2-3 sentence summary.
    2. Extract action items (things the user needs to do). If none, return empty array.
    3. Extract key entities (names, organizations, product names, locations).
    4. Detect sentiment (positive, neutral, negative).
    5. Categorize the email into one of: Leads, Finance, Personal, Work, Support, Marketing, Spam-like.
    6. Extract lead details (if applicable, e.g. if the email contains a business inquiry, partnership request, sales inquiry, client complaint, etc.):
       - company: Name of the organization the sender belongs to.
       - contactName: Name of the sender.
       - intent: Brief description of what they want.
       - urgency: urgency of the message (low, medium, high, urgent).
    7. Assign a lead opportunity score from 0 (not a lead at all) to 100 (high-value qualified sales lead).

    Return ONLY a valid JSON object matching the following structure:
    {
      "summary": "Concise summary here.",
      "actionItems": ["Action 1", "Action 2"],
      "keyEntities": ["Entity 1", "Entity 2"],
      "sentiment": "positive" | "neutral" | "negative",
      "category": "Leads" | "Finance" | "Personal" | "Work" | "Support" | "Marketing" | "Spam-like",
      "leadScore": 75,
      "leadExtraction": {
        "company": "Company Name or null",
        "contactName": "Contact Name or null",
        "intent": "Brief description of request or null",
        "urgency": "low" | "medium" | "high" | "urgent"
      }
    }
  `;

  try {
    const model = aiClient.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent([prompt, emailContent]);
    const responseText = result.response.text();
    
    if (!responseText) {
      throw new Error('Empty response received from Gemini API.');
    }

    const aiResult = JSON.parse(responseText.trim()) as AIAnalysisResult;

    // Build the updated metadata fields
    const updatedFields: Partial<EmailMetadata> = {
      sentiment: aiResult.sentiment || 'neutral',
      aiSummary: aiResult.summary || '',
      leadScore: aiResult.leadScore ?? 0,
      category: aiResult.category || 'Personal',
      aiExtraction: {
        company: aiResult.leadExtraction?.company || undefined,
        contactName: aiResult.leadExtraction?.contactName || undefined,
        intent: aiResult.leadExtraction?.intent || undefined,
        urgency: aiResult.leadExtraction?.urgency || 'low',
        actionItems: aiResult.actionItems || [],
        keyEntities: aiResult.keyEntities || [],
      },
    };

    await emailRef.update(updatedFields);

    return {
      ...emailData,
      ...updatedFields,
    };
  } catch (error) {
    console.error(`AI analysis failed for email ${emailId}:`, error);
    // Return the unmodified email on failure
    return emailData;
  }
}

/**
 * Suggests an email reply draft using Gemini based on the original email context.
 */
export async function generateReplySuggestion(
  uid: string,
  emailId: string
): Promise<string> {
  const emailRef = adminDb.collection('emails').doc(`${uid}_${emailId}`);
  const emailSnap = await emailRef.get();
  
  if (!emailSnap.exists) {
    throw new Error(`Email with ID ${emailId} not found in Firestore.`);
  }

  const emailData = emailSnap.data() as EmailMetadata;
  const aiClient = getGeminiClient();

  if (!aiClient) {
    return 'Gemini API key is not configured. Please draft your reply manually.';
  }

  const prompt = `
    You are an AI assistant helping a professional reply to their emails.
    Below is the content of an email they received.
    Draft a professional, friendly, and concise reply to this email.
    
    Ensure the reply is formatted cleanly. Do NOT include markdown blocks like \`\`\`html or \`\`\`text. Return only the plain reply text. Use simple paragraphs or line breaks.
    Do NOT include placeholder texts like "[Your Name]" or "[My Company]" if possible, instead just leave a professional signature placeholder like:
    
    Best regards,
    Md. Obaidullah Ansari

    Original Email Details:
    FROM: ${emailData.from}
    SUBJECT: ${emailData.subject}
    BODY:
    ${emailData.body}
  `;

  try {
    const model = aiClient.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return responseText ? responseText.trim() : '';
  } catch (error) {
    console.error(`AI reply suggestion failed for email ${emailId}:`, error);
    return 'Could not generate reply suggestion at this time.';
  }
}
