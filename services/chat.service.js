const axios = require('axios');
const projectService = require('./project.service');

exports.getChatReply = async (userMessage) => {
    if (!userMessage) {
        const error = new Error('Missing user message');
        error.status = 400;
        throw error;
    }

    const messages = [
        { role: 'system', content: 'You are a helpful assistant for discussing and planning projects.' },
        { role: 'user', content: userMessage }
    ];

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

    return response.data.choices[0].message.content.trim();
};

exports.saveChatAsProject = async (userId, userMessageArray) => {
    if (!userMessageArray || !Array.isArray(userMessageArray)) {
        const error = new Error("Chat session must be an array");
        error.status = 400;
        throw error;
    }

    const fullChat = userMessageArray.map(m => `${m.role}: ${m.content}`).join('\n');

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

    const titleMatch = content.match(/Title:\s*(.*)/i);
    const projectName = titleMatch ? titleMatch[1].trim().slice(0, 60) : "Untitled Project";

    const summaryMatch = content.match(/Summary:\s*([\s\S]*?)Milestones:/i);
    const chatSummary = summaryMatch ? summaryMatch[1].trim() : "No summary available.";

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

    // Re-use our new service instead of raw mongoose models
    const project = await projectService.saveOrUpdateProject(userId, {
        projectName,
        message: fullChat,
        chatSummary,
        milestones,
        tools: []
    });

    return project;
};
