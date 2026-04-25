import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export class GeminiService {
  async consultHealth(query: string) {
    // Use GEMINI_API_KEY as per guidelines
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      console.error("Gemini API Key is missing or undefined");
      return "দুঃখিত, এআই সার্ভিস কানেকশনে সমস্যা হচ্ছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন অথবা কিছুক্ষণ পর চেষ্টা করুন।";
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `As a professional medical AI assistant for JB Healthcare, answer this query in simple and helpful Bengali: "${query}". 
        Include:
        1. Possible Symptoms (সম্ভাব্য লক্ষণ)
        2. Home Remedies (ঘরোয়া পরামর্শ)
        3. Professional Disclaimer (সতর্কবার্তা: এটি ডাক্তারের বিকল্প নয়).
        Use clean formatting with bullet points.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      return response.text || "দুঃখিত, কোনো উত্তর পাওয়া যায়নি। আবার চেষ্টা করুন।";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "দুঃখিত, এআই সার্ভিস এই মুহূর্তে উত্তর দিতে পারছে না। অনুগ্রহ করে সরাসরি ডাক্তার বেছে নিন বা আপনার ইন্টারনেট কানেকশন চেক করুন।";
    }
  }
}

export const gemini = new GeminiService();
