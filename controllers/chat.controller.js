const axios = require('axios');
require('dotenv').config();
const Project = require('../models/Project');


// ------------------------------------
// 1️⃣ Chat Endpoint (simple Q/A)
// ------------------------------------
exports.handleChat = async (req, res) => {
  const { userMessage } = req.body;
  console.log("🟢 Incoming request to /api/chat");
  console.log("📝 Request body:", req.body);

  if (!userMessage) {
    console.warn("⚠️ Missing user message");
    return res.status(400).json({ error: 'Missing user message' });
  }

  const messages = [
    { role: 'system', content: 'You are a helpful assistant for discussing and planning projects.' },
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'x-ai/grok-4.1-fast',
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = response.data.choices[0].message.content.trim();
    console.log("✅ Mistral reply:", reply);

    res.json({ reply });

  } catch (error) {
    console.error('🔴 Chat error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Chat processing failed' });
  }
};



// ------------------------------------
// 2️⃣ Save Chat as a Project
// ------------------------------------
exports.saveChatSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userMessage } = req.body;    // Full chat array from frontend TheLab

    if (!userMessage || !Array.isArray(userMessage)) {
      return res.status(400).json({ success: false, error: "Chat session must be an array" });
    }

    // Convert chat → transcript for AI
    const fullChat = userMessage
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    // Ask AI to summarize + create milestones
    const aiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "x-ai/grok-4.1-fast",
        messages: [
          {
            role: "system",
            content: `
    You MUST respond ONLY in the following strict structure:
    
    Title: <short project title, max 60 chars>
    
    Summary:
    <one paragraph summary>
    
    Milestones:
    1. <milestone title>
       Description: <milestone description>
    2. <milestone title>
       Description: <milestone description>
    3. <milestone title>
       Description: <milestone description>
    
    MANDATORY RULES:
    - DO NOT use markdown (#, ##, **, ###, ---).
    - DO NOT use emojis.
    - DO NOT add any extra text before or after the structure.
    - DO NOT change the section titles ("Title:", "Summary:", "Milestones:").
    - DO NOT skip the Summary section.
    - DO NOT skip the Milestones section.
    - Milestones MUST be numbered exactly using "1.", "2.", "3.".
    - Each milestone MUST include a "Description:" on the next line.
    - All responses MUST be plain text only.
    `
          },
          { role: "user", content: fullChat }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    const content = aiResponse.data.choices[0].message.content.trim();
    console.log("🧠 AI Structured Response:\n", content);

    // -------------------------------
    // Extract Title
    // -------------------------------
    const titleMatch = content.match(/Title:\s*(.*)/i);
    const projectName = titleMatch
      ? titleMatch[1].trim().slice(0, 60)
      : "Untitled Project";

    // -------------------------------
    // Extract Summary
    // -------------------------------
    const summaryMatch = content.match(/Summary:\s*([\s\S]*?)Milestones:/i);
    const chatSummary = summaryMatch
      ? summaryMatch[1].trim()
      : "No summary available.";

    // -------------------------------
    // Extract Milestones
    // -------------------------------
    const milestonesMatch = content.match(/Milestones:\s*([\s\S]*)/i);
    const milestonesRaw = milestonesMatch ? milestonesMatch[1].trim() : "";

    const milestoneBlocks = milestonesRaw.split(/\n(?=\d+\.\s)/g);

    const milestones = milestoneBlocks.map((block, index) => {
      const titleMatch = block.match(/^\d+\.\s*(.*)/);
      const descriptionMatch = block.match(/Description:\s*([\s\S]*)/i);

      return {
        step: index + 1,
        title: titleMatch ? titleMatch[1].trim() : `Milestone ${index + 1}`,
        description: descriptionMatch ? descriptionMatch[1].trim() : "",
        completed: false
      };
    });

    console.log("📌 FINAL PARSED MILESTONES:", milestones);

    // -------------------------------
    // Create Project using NEW model
    // -------------------------------
    const project = await Project.create({
      userId,            // current owner
      createdBy: userId, // original creator (required)
      projectName,
      projectLogo: "",
      message: fullChat,
      chatSummary,
      milestones,
      tools: [],
      ownershipHistory: [
        {
          userId,
          changedAt: new Date()
        }
      ]
    });
    

    console.log("✅ Project created:", project._id);

    res.json({ success: true, project });

  } catch (err) {
    console.error("❌ Error saving chat as project:", err);
    res.status(500).json({ success: false, error: "Failed to save project" });
  }
};
