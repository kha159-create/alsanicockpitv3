// test-gemini-api.js
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const MODEL = "models/gemini-2.5-flash"; // ✅ Latest supported model from Google

async function testGeminiConnection() {
  console.log("🔍 Testing Gemini API connection...");
  console.log("API Key:", API_KEY?.substring(0, 10) + "...");
  console.log("Model:", MODEL);

  if (!API_KEY) {
    console.error("❌ VITE_GEMINI_API_KEY not found in environment variables");
    process.exit(1);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello from Alsani Cockpit test! Please respond with 'API connection successful'." }] }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Gemini API error ${response.status}: ${data.error?.message}`);
    }

    console.log("✅ Gemini API connection successful!");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      console.log("Generated text:", data.candidates[0].content.parts[0].text);
    }
  } catch (error) {
    console.error("❌ Gemini API connection failed:");
    console.error("Error:", error.message);
    
    if (error.message.includes("400")) {
      console.log("🔄 This might be a temporary issue. Retrying...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const retryResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Test message" }] }],
            }),
          }
        );
        
        const retryData = await retryResponse.json();
        if (retryResponse.ok) {
          console.log("✅ Retry successful!");
          console.log("Retry Response:", JSON.stringify(retryData, null, 2));
        } else {
          console.error("❌ Retry failed:", retryData.error?.message);
        }
      } catch (retryError) {
        console.error("❌ Retry failed:", retryError.message);
      }
    }
  }
}

testGeminiConnection().catch(console.error);
