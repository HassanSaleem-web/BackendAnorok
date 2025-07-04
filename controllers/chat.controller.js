const axios = require('axios');
require('dotenv').config();
const Project = require('../models/Project');

exports.handleChat = async (req, res) => {
    const { userMessage } = req.body;
    console.log("🟢 Incoming request to /api/chat");
    console.log("📝 Request body:", req.body);
  
    if (!userMessage) {
      console.warn("⚠️ Missing user message");
      return res.status(400).json({ error: 'Missing user message' });
    }
  
    // Keep conversation in memory for this session only
    const messages = [
      { role: 'system', content: 'You are a helpful assistant for discussing and planning projects.' },
      { role: 'user', content: userMessage }
    ];
  
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'mistralai/mistral-7b-instruct:free',
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
  

// Handles saving a chat session to database
exports.saveChatSession = async (req, res) => {
  const { session, username = 'anonymous' } = req.body;

  if (!session || !Array.isArray(session)) {
    return res.status(400).json({ success: false, error: 'Invalid session data' });
  }

  const fullChat = session.map(msg => `${msg.role}: ${msg.content}`).join('\n');

  try {
    const summaryResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that extracts structured project info.' },
          {
            role: 'user',
            content:
`Analyze the following conversation and return:
1. A short project title (max 60 characters)
2. A detailed project summary
3. A list of 4 to 6 key milestones, each with:

Title: <...>
Description: <...>

Format:
Title: ...
Summary: ...
Milestones:
1. ...
   Description: ...
2. ...
   Description: ...
...
Conversation:
${fullChat}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = summaryResponse.data.choices[0].message.content.trim();
    console.log('🧠 Parsed Response:\n', content);

    const titleMatch = content.match(/Title:\s*(.*)/i);
    const summaryMatch = content.match(/Summary:\s*([\s\S]*?)Milestones:/i);
    const milestonesMatch = content.match(/Milestones:\s*([\s\S]*)/i);

    const title = titleMatch ? titleMatch[1].trim().slice(0, 60).replace(/[^a-zA-Z0-9 ]/g, '') : 'Untitled Project';
    const chatSummary = summaryMatch ? summaryMatch[1].trim() : 'No summary available.';
    const milestonesRaw = milestonesMatch ? milestonesMatch[1].trim() : '';

    // 👇 Fix: Split on lines like: "1. Something", "2. Something else"
    const milestoneBlocks = milestonesRaw.split(/\n(?=\d+\.\s)/g);

    const milestones = milestoneBlocks.map((block, index) => {
      const titleMatch = block.match(/^\d+\.\s*(.*)/);
      const descriptionMatch = block.match(/Description:\s*([\s\S]*)/i);

      return {
        step: index + 1,
        title: titleMatch ? titleMatch[1].trim() : `Step ${index + 1}`,
        description: descriptionMatch ? descriptionMatch[1].trim() : '',
        completed: false,
      };
    });

    console.log("📌 Final Parsed Milestones:", milestones);

    const project = new Project({
      username,
      title,
      chatSummary,
      milestones,
      tools: []
    });

    await project.save();
    console.log('✅ Project saved with milestones:', project._id);

    res.json({ success: true, project });
  } catch (err) {
    console.error('🔴 Failed to generate/save project:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate or save project summary' });
  }
};


  
  