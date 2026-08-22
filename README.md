# Nexus Flow

Build a polished, production quality frontend prototype for an intelligent AI orchestration platform called "NEXUS AI".

IMPORTANT PRODUCT CONCEPT

NEXUS AI allows a user to interact with multiple AI models through one interface and one login.

The core innovation is intelligent model orchestration.

The user should never need to manually worry about which AI model is currently handling the conversation.

The system should automatically select a suitable AI model based on the task.

If the active AI reaches its token limit, context limit, usage limit, becomes unavailable, encounters an error, or is otherwise unable to continue, the orchestration layer should automatically route the conversation to another suitable AI model.

The conversation context, task state, important decisions, instructions, and user intent must be preserved during the handoff.

The user should experience this as one continuous conversation.

The frontend is initially a demonstration prototype. Do NOT require real AI API keys. Simulate the AI responses and model handoff behavior realistically so the complete concept can be demonstrated.

DESIGN DIRECTION

Create a premium technology startup interface.

Do NOT make it look like a generic AI generated dashboard.

Avoid excessive gradients, excessive glassmorphism, giant text, unnecessary illustrations, cartoon graphics, and generic AI robot imagery.

The design should feel like a serious product from a modern AI infrastructure company.

Use:

Dark navy / almost black background

#080B12 as primary background

Secondary surfaces:

#101521

#151B29

Primary accent:

Electric blue #4F8CFF

Secondary accent:

Violet #8B5CF6

Success:

#22C55E

Warning:

#F59E0B

Error:

#EF4444

Text:

White #F8FAFC

Secondary text:

#94A3B8

Use subtle borders:

rgba(255,255,255,0.08)

Use Inter or a similar clean modern sans serif font.

Use Lucide icons.

Use subtle shadows.

Use restrained animations.

The interface should feel fast, intelligent, reliable, and technical.

PRODUCT NAME

NEXUS AI

Tagline:

"Multiple AIs. One continuous intelligence."

MAIN NAVIGATION

Create a left sidebar.

Top:

NEXUS AI logo

Small abstract interconnected node icon

Text: NEXUS AI

Navigation:

Dashboard

New Chat

Conversations

Projects

Models

Orchestration

Usage

Settings

Bottom:

User avatar

User name: Demo User

Plan: SIH Prototype

Add collapse/expand behavior for the sidebar.

SCREEN 1: DASHBOARD

Create a dashboard showing the overall state of the AI orchestration platform.

Header:

"Good morning, Demo User"

Subtitle:

"Your AI workspace is ready."

Top right:

New Conversation button

Profile button

Create four statistics cards:

Active Models

4

Conversations

24

Successful Handoffs

7

Context Preserved

100%

Below the statistics create a large "Orchestration Status" card.

Show:

ORCHESTRATOR

Status: ONLINE

Use a green pulsing indicator.

Display:

Models available:

GPT

Claude

Gemini

Llama

Show each model as a small card with:

Model name

Status

Capability

Context capacity

Latency indicator

Example:

GPT

Available

Reasoning

128K context

Claude

Available

Long Context

200K context

Gemini

Available

Multimodal

1M context

Llama

Available

Open Model

128K context

Below this create a "Recent Activity" timeline.

Example:

10:42

Conversation started

Claude selected

10:46

Context threshold detected

Orchestrator activated

10:46

Gemini selected

Context transferred

10:47

Task continued successfully

Make this timeline visually impressive.

SCREEN 2: CHAT INTERFACE

This is the most important screen.

Create a full AI chat interface.

Top header:

Conversation title:

"Research Assistant"

Under it show:

AUTO MODE

Orchestrator Online

Add a small animated status indicator.

Create chat messages.

User:

"Compare the advantages of edge AI and cloud AI for a healthcare application."

AI response:

Provide a realistic concise response.

Under the response show a small metadata row:

Model:

Claude

Latency:

1.8s

Context:

42%

Confidence:

High

Then create another user message:

"Now design a scalable architecture for the system and explain how the components communicate."

Show the AI beginning to answer.

Then create the most important demonstration.

The current model should show:

CLAUDE

Processing...

Then animate the context meter increasing.

When it reaches approximately 90%, show:

"Context capacity approaching limit"

Then trigger an orchestration animation.

The screen should show:

ORCHESTRATOR ACTIVATED

"Evaluating available models..."

Then show model selection cards:

Claude

Context capacity: 90%

Status: Near Limit

GPT

Context capacity: 45%

Status: Available

Gemini

Context capacity: 20%

Status: Available

Llama

Context capacity: 30%

Status: Available

Highlight Gemini as the selected model.

Show:

"Gemini selected"

Reason:

"Large available context capacity + suitable reasoning capability"

Then show a visual transfer animation:

Conversation

↓

Context Extraction

↓

Task State Preservation

↓

Intent Preservation

↓

Gemini

Then display:

✓ Context preserved

✓ Task state preserved

✓ User intent preserved

✓ Conversation continued

Then Gemini continues the exact task.

The user should NOT have to click anything.

This is the key demonstration of the entire product.

Add a small system notification:

"Model handoff completed automatically. Your conversation continues without interruption."

SCREEN 3: MODEL CONTROL CENTER

Create a screen called:

"Model Control Center"

Show all connected models.

Each model should have:

Model name

Provider

Status

Capabilities

Context window

Current load

Average latency

Estimated cost

Reliability

Models:

GPT

Claude

Gemini

Llama

Create visual status indicators.

Green:

Available

Yellow:

High Load

Red:

Unavailable

Allow the user to click a model to open a detail panel.

The detail panel should show:

Model capabilities

Context size

Average response time

Current availability

Recent usage

Supported task types

Add buttons:

Connect Model

Configure

Set Priority

View Details

Create an "AUTO ROUTING" control.

Show:

Automatic model selection: ON

Allow the user to set routing preferences:

Best Quality

Lowest Cost

Fastest Response

Largest Context

Balanced

Make "Balanced" selected by default.

SCREEN 4: ORCHESTRATION ENGINE

This screen visually explains the product's intelligence.

Title:

"Orchestration Engine"

Subtitle:

"Decide. Route. Preserve. Continue."

Create a large interactive flow diagram.

User Request

↓

Task Analyzer

↓

Capability Matcher

↓

Model Router

↓

Selected AI Model

↓

Monitoring Layer

Then branch from Monitoring Layer:

Task Complete

OR

Limit Detected

OR

Model Unavailable

OR

Error

All failure states should route back to:

Model Router

Then:

Context Manager

↓

Task State

↓

Intent

↓

New AI Model

↓

Continue Conversation

Make the nodes animated.

Use flowing blue/violet particles along the connection lines.

When the demo is running, animate the path.

Add a side panel:

CURRENT DECISION

Task:

Long form technical research

Active Model:

Claude

Context:

89%

Available alternatives:

GPT

Gemini

Llama

Recommended:

Gemini

Reason:

Large context capacity and suitable reasoning capability.

Add a button:

"Run Handoff Simulation"

When clicked, run the complete orchestration animation.

SCREEN 5: CONTEXT & MEMORY

Create a screen called:

"Continuity Layer"

This screen explains how context survives a model handoff.

Create four large cards:

CONVERSATION CONTEXT

Previous messages

Important facts

Relevant references

User preferences

TASK STATE

Current objective

Completed steps

Pending steps

Intermediate results

USER INTENT

Original goal

Constraints

Expected output

Priority

MODEL HANDOFF

Previous model

Reason for switch

New model

Transfer status

Create a visual before/after demonstration.

LEFT:

CLAUDE

Current task:

Design healthcare AI architecture

Progress:

68%

Context:

91%

RIGHT:

GEMINI

Received:

Conversation context ✓

Task state ✓

User intent ✓

Important decisions ✓

Progress:

68%

The key point is that the second AI continues from 68%, rather than starting from zero.

Add a small explanation:

"The model changes. The user's work does not."

SCREEN 6: SIH DEMO MODE

Create a special screen specifically designed for demonstrating the idea to judges.

Title:

"Live Orchestration Demo"

Subtitle:

"Watch the system recover from an AI limitation without interrupting the user."

Create a large central demo window.

At the top:

Scenario:

"Long Research Task"

Current AI:

Claude

Status:

Processing

Create a progress bar.

Then add a large button:

"START DEMO"

When clicked, automatically run the following sequence.

PHASE 1

Display:

User submits a long research request.

Claude selected.

Status:

Processing...

PHASE 2

Increase context usage visually.

50%

65%

75%

85%

90%

At 90%, show:

"Context threshold reached."

PHASE 3

Show:

ORCHESTRATOR ACTIVATED

"Finding the best available alternative..."

Display the models.

Claude:

Context almost full

GPT:

Available

Gemini:

Available

Llama:

Available

Highlight Gemini.

PHASE 4

Display a beautiful transfer animation.

CLAUDE

↓

Context extraction

↓

Task state extraction

↓

Intent preservation

↓

GEMINI

PHASE 5

Show:

HANDOFF COMPLETE

✓ Conversation preserved

✓ Context preserved

✓ Task state preserved

✓ User intent preserved

PHASE 6

Show:

GEMINI

"Continuing your task..."

Then show Gemini continuing the original answer.

At the bottom:

"User intervention required: None"

"Conversation interrupted: No"

"Task restarted: No"

This should be the strongest visual demonstration in the entire application.

GLOBAL COMPONENTS

Create reusable components:

Sidebar

TopBar

ModelCard

StatusIndicator

ChatMessage

ContextMeter

ModelSelector

OrchestrationGraph

HandoffAnimation

ActivityTimeline

NotificationToast

MetricCard

Modal

Button

Dropdown

Tabs

ProgressBar

INTERACTIONS

Add smooth transitions.

Buttons should have hover states.

Cards should have subtle hover elevation.

Model status indicators should animate.

Context meters should animate.

The orchestration graph should animate during handoffs.

Notifications should slide in smoothly.

The sidebar should collapse.

The model detail panels should open without navigating away.

The application should be responsive.

DEMO DATA

Do not require backend APIs initially.

Use realistic mock data.

Create mock AI responses.

Create mock model status.

Create mock context usage.

Create mock orchestration decisions.

Make the entire prototype functional using local state.

Do not create fake buttons that do nothing.

Every major interaction should produce a visible result.

IMPORTANT: ARCHITECTURE

Structure the frontend cleanly so a real backend can be connected later.

Separate:

UI components

Mock AI services

Orchestration simulation

Model configuration

Conversation state

Context state

Create clear interfaces/types for:

Model

Conversation

Message

TaskState

ContextState

OrchestrationDecision

HandoffEvent

Do not hardcode the entire application into one component.

Use reusable React components.

TECHNICAL REQUIREMENTS

Use React.

Use TypeScript.

Use Tailwind CSS.

Use Lucide icons.

Use responsive layouts.

Use accessible buttons and controls.

Use clean component architecture.

Avoid unnecessary dependencies.

Do not use real API keys.

Do not expose secrets in frontend code.

Create a README explaining how the prototype works and where real AI APIs can later be connected.

CRITICAL UX PRINCIPLE

The platform should make one concept immediately obvious:

"The AI model can change without the user's conversation or task being interrupted."

The user should feel that NEXUS AI is an orchestration layer above individual AI models.

The application should NOT feel like four separate chatbots placed next to each other.

It should feel like ONE intelligent system powered by multiple models.

FINAL VISUAL IMPRESSION

When someone opens the application for the first time, they should immediately understand:

One login.

One interface.

Multiple AI models.

Automatic intelligent routing.

Automatic model switching.

Context preservation.

Task continuity.

The overall product should look credible enough to demonstrate as an SIH 2026 prototype to judges, mentors, and potential technical reviewers.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nexus-flow-208.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7f63ef41-fff7-4bb8-8c6f-6bb95f3a29bd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
