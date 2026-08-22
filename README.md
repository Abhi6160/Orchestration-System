# Nexus AI Core

Create a complete, production-quality, responsive AI assistant web application called "Nexus.ai".

I am providing a reference image with this prompt. Use the reference image as the primary inspiration for the overall composition, spacing, positioning, proportions, and visual hierarchy.

IMPORTANT:

Do NOT simply place the reference image as the website background.

Recreate the entire interface using real HTML, React components, CSS/Tailwind, SVG/CSS graphics, and JavaScript interactions.

The result must be a real, functional, responsive web application.

==================================================

1. CORE DESIGN CONCEPT

==================================================

Nexus.ai is a futuristic AI assistant and AI command-center interface.

The design should feel:

- futuristic

- premium

- cinematic

- intelligent

- powerful

- luxurious

- technologically advanced

- minimal but visually impressive

The visual identity should combine:

BLACK + DARK BLACK + DEEP RED + NEON RED + METALLIC GOLD.

Do NOT use the original blue, cyan, purple, pink, or turquoise color scheme.

The new design should feel like a premium "AI intelligence system" rather than a generic chatbot.

Avoid making it look like a gaming website.

Avoid excessive neon effects.

The interface should feel sophisticated and professional.

==================================================

2. TECHNOLOGY STACK

==================================================

Use:

- React

- TypeScript

- Tailwind CSS

- Vite

- Lucide React icons

- CSS animations

- SVG where appropriate

- Browser APIs for voice/camera/file selection

- Local state for UI interactions

Use a clean component-based architecture.

The application must run without errors.

Use reusable components instead of putting the entire application into one file.

Structure the project approximately as:

src/

  components/

    Navbar.tsx

    NexusLogo.tsx

    Hero.tsx

    AIInput.tsx

    AttachmentMenu.tsx

    VoiceInput.tsx

    LoginModal.tsx

    ProfileMenu.tsx

    NavigationDrawer.tsx

    NeuralBackground.tsx

    ChatInterface.tsx

    ChatMessage.tsx

    ChatHistory.tsx

    CameraModal.tsx

    SettingsPanel.tsx

  pages/

    Home.tsx

  App.tsx

  main.tsx

  index.css

==================================================

3. COLOR SYSTEM

==================================================

Completely replace the previous blue/cyan/purple/pink design.

Use this color palette:

PRIMARY BLACK:

#000000

DARK BLACK:

#030303

SECONDARY BLACK:

#080808

CHARCOAL:

#111111

DEEP RED:

#240000

DARK CRIMSON:

#3A0000

CRIMSON:

#700000

DEEP RED:

#8B0000

NEON RED:

#FF1A1A

BRIGHT NEON RED:

#FF3030

METALLIC GOLD:

#D4AF37

BRIGHT GOLD:

#FFD700

WARM GOLD:

#F5B942

PALE GOLD:

#FFE8A3

WARM WHITE:

#F5F1E6

Use approximately:

70% black/dark black

15–20% dark/deep red

5–10% gold

small amounts of neon red for active states

BLACK should remain the dominant visual color.

GOLD should be the premium accent.

NEON RED should represent energy and active AI states.

==================================================

4. BACKGROUND

==================================================

Create a full-screen dark cinematic background.

The base should be almost black.

Use layered gradients such as:

- black

- dark crimson

- subtle red

- black

Example visual concept:

black background

+

subtle deep-red atmospheric glow

+

very subtle neon-red energy

+

gold particles

+

futuristic digital neural network

Do not make the background bright.

The user should immediately perceive a black interface with controlled red and gold illumination.

==================================================

5. FUTURISTIC AI NEURAL NETWORK

==================================================

The bottom portion of the page should contain a futuristic digital neural-network environment inspired by the reference image.

Create:

- interconnected nodes

- thin glowing lines

- digital grid

- small particles

- network points

- subtle wave-like structures

- depth

- glowing data paths

Primary network colors:

dark red

deep crimson

neon red

Accent nodes:

metallic gold

bright gold

The neural network should occupy approximately the lower 35–45% of the initial viewport.

It should look like a futuristic AI intelligence network.

Do not make it look like a normal chart.

==================================================

6. NETWORK ANIMATION

==================================================

Add subtle animation:

- nodes slowly pulse

- lines gently change opacity

- some nodes glow brighter occasionally

- particles move slowly

- network has subtle depth movement

Animation must be smooth and lightweight.

Do not overload the page with hundreds of particles.

On mobile, reduce the number of animated elements to improve performance.

==================================================

7. SPECIAL 3D NEXUS.AI LOGO

==================================================

This is one of the MOST IMPORTANT parts.

The original 2D Nexus logo should be transformed into a distinctive premium 3D AI emblem.

Do not simply use a flat logo with a gradient.

Create a dedicated:

NexusLogo3D

component.

The logo should visually combine:

- a stylized futuristic "N"

- interconnected neural pathways

- metallic gold outer structure

- black/dark interior

- deep red internal illumination

- neon-red energy ring

- subtle gold highlights

- 3D depth

- bevelled edges

- reflective metallic surface

The logo should look like a physical futuristic AI processor/emblem.

==================================================

8. SPECIAL LOGO CONCEPT

==================================================

Create a unique visual concept:

A stylized 3D letter "N" constructed from metallic segments.

The "N" should have:

- black metallic core

- gold bevelled edges

- deep red internal glow

Around or partially around the N:

Create a thin futuristic orbital ring.

The orbital ring should have:

- metallic gold sections

- neon-red illuminated sections

Add a few tiny glowing particles around the orbital ring.

The overall impression should be:

"An intelligent AI core powering Nexus.ai."

The logo should NOT look like a generic letter N.

It should feel like a futuristic AI symbol.

==================================================

9. LOGO 3D EFFECT

==================================================

Use lightweight CSS/SVG techniques where possible.

Create the illusion of:

- extrusion

- depth

- bevel

- metallic reflection

- inner glow

- outer glow

Use multiple SVG paths or layered elements if necessary.

The logo should have a subtle shadow behind it.

The gold should look metallic rather than flat yellow.

==================================================

10. LOGO ANIMATION

==================================================

The logo should have a subtle idle animation.

Possible effects:

- very slow floating

- tiny rotation

- subtle glow breathing

- moving metallic reflection

- slight orbital ring movement

Do NOT continuously spin the entire logo.

On hover:

- slight 3D perspective tilt

- metallic highlight moves across the logo

- neon-red glow becomes slightly stronger

- gold edge becomes brighter

Maximum hover rotation should be subtle, approximately 3–5 degrees.

==================================================

11. NEXUS.AI BRAND TEXT

==================================================

Place the text:

Nexus.ai

next to the 3D logo.

Use a premium modern font such as:

- Inter

- Geist

- Space Grotesk

The text should use a metallic gold gradient.

Suggested gradient:

dark gold

→ metallic gold

→ bright gold

→ pale gold

→ dark gold

Add a very subtle red glow behind the text.

Do not use cyan, blue, purple, or pink.

==================================================

12. NAVIGATION BAR

==================================================

Preserve the basic navigation composition from the reference.

Desktop:

LEFT:

3D Nexus logo + Nexus.ai

RIGHT:

Login

Profile

Hamburger menu

Use generous spacing.

The navbar should be transparent over the background.

Do not create a large solid navbar.

==================================================

13. LOGIN BUTTON

==================================================

Create a pill-shaped Login button.

Text:

Login

Visual design:

- black interior

- subtle dark-red gradient

- metallic gold border

- gold text

Hover:

- stronger gold border

- subtle neon-red glow

- slight scale animation

Clicking Login must open a proper modal.

==================================================

14. LOGIN MODAL

==================================================

Create a premium dark login modal.

Design:

black background

dark-red glow

gold border

subtle glass effect

Contents:

Welcome back

Email

Password

Login

Forgot password?

Create account

Continue with Google

This can initially be a frontend/demo login.

Do not require a backend yet.

The modal must have:

- close button

- proper form fields

- validation for empty fields

- loading state

- success/demo state

==================================================

15. PROFILE BUTTON

==================================================

Create:

Profile

with a circular user icon.

Use:

black

deep red

gold

On click, show:

Profile

----------------

My Account

Settings

Chat History

Appearance

Logout

Use a premium glassmorphism dropdown.

==================================================

16. HAMBURGER MENU

==================================================

Create a hamburger icon on the far right.

Use three clean lines.

Color:

gold with subtle red glow.

When clicked, open a right-side navigation drawer.

Menu items:

New Chat

Home

Chat History

Profile

Settings

About Nexus.ai

Include a close button.

Animate the drawer smoothly from right to left.

==================================================

17. HERO SECTION

==================================================

The initial page should remain visually close to the reference composition.

Center:

Welcome, I’m Nexus

Use the exact curly apostrophe:

I’m

Do not change it to:

I'm

The heading should be large and premium.

Use a gradient:

metallic gold

→ warm gold

→ pale gold

→ subtle neon red

The primary appearance should remain gold.

Add a subtle glow.

==================================================

18. HERO POSITION

==================================================

Maintain significant empty atmospheric space around the hero.

Approximate layout:

Navbar

        ↓

Atmospheric space

        ↓

Welcome, I’m Nexus

        ↓

AI questioning bar

        ↓

Neural network

The heading should sit approximately around 35–40% of viewport height on desktop.

==================================================

19. AI QUESTIONING BAR

==================================================

This is the MOST IMPORTANT interactive component.

Create a large rounded AI input bar.

Desktop:

width: approximately 620–650px

height: approximately 60–65px

Mobile:

width: calc(100% - 32px)

Border radius:

9999px

The bar should have:

black interior

dark red gradient

subtle gold border

neon-red outer glow

The design should feel like a futuristic AI command console.

==================================================

20. QUESTION BAR CONTENT

==================================================

Structure:

LEFT:

+

CENTER:

Ask anything here.....

RIGHT:

voice waveform / microphone

Example:

+   Ask anything here.....             microphone

The input must be a real input.

The user can type normally.

==================================================

21. PLUS BUTTON

==================================================

The + button must be fully functional.

Use a gold circular button or gold plus icon.

When clicked, open a floating attachment/action menu.

==================================================

22. ATTACHMENT MENU

==================================================

The + menu must contain:

Add image

Upload file

Camera

Screenshot

Voice input

Use Lucide icons.

Do NOT use emoji for the actual interface.

Example:

[Image icon] Add image

[File icon] Upload file

[Camera icon] Camera

[Monitor icon] Screenshot

[Mic icon] Voice input

Menu styling:

black

dark red

gold border

gold icons

warm-white text

subtle neon-red glow

Animate with:

fade-in

scale-in

small upward movement

Close when clicking outside.

==================================================

23. ADD IMAGE

==================================================

When Add image is clicked:

Open the system file selector.

Accept:

PNG

JPG

JPEG

WEBP

GIF

After selection:

show an image thumbnail above/inside the input area.

Include a remove button.

==================================================

24. UPLOAD FILE

==================================================

When Upload file is clicked:

Allow:

PDF

TXT

DOC

DOCX

CSV

Display the selected filename.

Example:

document.pdf

with a file icon and remove button.

==================================================

25. CAMERA

==================================================

When Camera is selected:

Use:

navigator.mediaDevices.getUserMedia()

to request camera access.

If permission is granted:

show camera preview.

Provide:

Capture

Cancel

buttons.

Use black/red/gold styling.

If camera access is unavailable:

show:

Camera access is unavailable on this device/browser.

Do not crash.

==================================================

26. SCREENSHOT

==================================================

Add a Screenshot option.

If browser screen capture is supported, attempt to use the appropriate browser API.

If unsupported:

show a graceful message.

Do not break the application.

==================================================

27. VOICE BUTTON

==================================================

The right side of the questioning bar must contain a dedicated voice button.

Use a microphone icon or animated waveform.

Inactive:

subtle gold/red waveform.

Active:

neon-red waveform with gold accents.

==================================================

28. VOICE INPUT

==================================================

When the microphone is clicked:

activate voice mode.

Display:

Listening...

Use animated waveform bars.

If browser Speech Recognition is available:

convert speech to text.

The recognized text should automatically appear inside the question input.

If unsupported:

show:

Voice input isn't supported in this browser.

Provide a clean fallback.

==================================================

29. VOICE VISUALIZATION

==================================================

Create 5–7 animated vertical waveform bars.

Inactive:

dark red + gold.

Active:

neon red + bright gold.

The bars should animate at different heights.

Keep the animation elegant and smooth.

==================================================

30. QUESTION SUBMISSION

==================================================

Allow submission using:

- Enter key

- optional send button

When submitted:

1. Add the question to the conversation.

2. Clear the input.

3. Show "Nexus is thinking..."

4. Display a realistic mock AI response.

Example:

User:

What is artificial intelligence?

Nexus:

Artificial intelligence is the field of creating systems capable of performing tasks that normally require human intelligence.

For now, use mock responses.

Create the code so a real AI API can easily be connected later.

==================================================

31. CHAT MODE

==================================================

Initially show:

Welcome, I’m Nexus

and the central AI input.

After the user submits a question:

transition into a conversation interface.

Keep the same black/red/gold environment.

Do NOT turn the website into a generic ChatGPT clone.

The conversation should feel like the user is interacting with the Nexus AI system.

==================================================

32. USER MESSAGE DESIGN

==================================================

User messages should use:

black

dark red

subtle neon-red accent

Add a thin gold detail where appropriate.

==================================================

33. NEXUS RESPONSE DESIGN

==================================================

Nexus responses should use:

black/glass surface

thin metallic gold border

warm-white text

gold Nexus icon

The Nexus 3D logo can appear as a small avatar beside responses.

==================================================

34. CHAT HISTORY

==================================================

Create a Chat History panel.

Example:

Today

What is artificial intelligence?

Explain quantum computing

Create a Python program

How does neural networking work?

Yesterday

What is machine learning?

Explain recursion

Use subtle red/gold hover effects.

The currently selected conversation should have a dark red highlight with a gold accent.

==================================================

35. SPECIAL AI STATUS INDICATOR

==================================================

Add a small premium AI status indicator near the Nexus logo or response.

Example:

● NEXUS ONLINE

Use:

gold text

small neon-red indicator

The indicator should subtly pulse.

This gives the interface the feeling of a live AI system.

==================================================

36. AI THINKING ANIMATION

==================================================

When Nexus is generating a response:

Display:

Nexus is thinking...

Use three small animated dots.

Colors:

neon red

gold

Example:

Nexus is thinking . . .

==================================================

37. PREMIUM DESIGN DETAILS

==================================================

Add subtle special details that improve the visual quality:

- thin gold divider lines

- tiny red glowing particles

- subtle circuit patterns

- small gold data points

- soft red atmospheric light

- very subtle scanline effect

- micro-grid textures

- faint geometric lines

These should be extremely subtle.

Do not clutter the interface.

==================================================

38. RED NEON EFFECT

==================================================

Use neon red primarily for:

- active states

- AI listening state

- AI thinking state

- glowing network nodes

- hover accents

- logo energy ring

- selected navigation elements

Do not make every component neon red.

==================================================

39. GOLD EFFECT

==================================================

Use metallic gold for:

- logo

- brand name

- important icons

- borders

- hero heading

- primary accents

- active controls

Gold should appear premium and restrained.

Do not use flat bright yellow everywhere.

==================================================

40. BLACK GLASSMORPHISM

==================================================

Use glassmorphism selectively.

Examples:

Login modal

Profile dropdown

Attachment menu

Navigation drawer

Chat panels

Use:

background:

rgba(0,0,0,0.75)

backdrop-filter:

blur(16px)

border:

rgba(212,175,55,0.3)

Add subtle red glow.

==================================================

41. RESPONSIVE DESIGN

==================================================

The website must work correctly on:

1920px

1440px

1366px

1024px

768px

430px

390px

320px

No horizontal scrolling.

No elements should overflow.

==================================================

42. MOBILE NAVBAR

==================================================

On mobile:

show:

3D Nexus logo + Nexus.ai + hamburger

Move Login and Profile into the hamburger drawer.

==================================================

43. MOBILE HERO

==================================================

Hero heading should automatically scale.

Possible layout:

Welcome,

I’m Nexus

The questioning bar must remain usable.

Width:

calc(100% - 32px)

Keep:

+

input

microphone

visible at all times.

==================================================

44. MOBILE ATTACHMENT MENU

==================================================

On mobile, the attachment menu should become either:

- compact popup above the input

OR

- bottom sheet

Choose the option that provides the best UX.

Never allow it to extend beyond the viewport.

==================================================

45. ACCESSIBILITY

==================================================

Use semantic HTML.

Every interactive button must have an accessible label.

Examples:

Open attachments

Start voice input

Open profile

Open navigation

Upload image

Upload file

Open camera

Support keyboard navigation.

Provide visible focus states.

==================================================

46. PERFORMANCE

==================================================

Optimize all animations.

Do not use excessive particles.

Reduce animation complexity on mobile.

Avoid unnecessary React re-renders.

Use CSS animations wherever possible.

The site should feel smooth even on mid-range laptops.

==================================================

47. FUTURE AI API ARCHITECTURE

==================================================

Create a clean service abstraction such as:

sendMessage(message, attachments)

For now:

return mock response.

Later it should be easy to connect to:

OpenAI

Gemini

Anthropic

other AI APIs

Never expose API keys in client-side code.

Use environment variables for future integrations.

==================================================

48. ERROR HANDLING

==================================================

Handle gracefully:

- unsupported microphone

- denied camera permission

- unsupported file

- empty question

- failed upload

- unavailable browser APIs

Never let the application crash because of these conditions.

==================================================

49. DO NOT USE THE SCREENSHOT AS A STATIC BACKGROUND

==================================================

This is extremely important.

Do NOT:

- place the screenshot as the page background

- overlay buttons on top of it

- create a fake interface

Actually build the website.

All major elements must be real:

- navigation

- login

- profile

- hamburger menu

- input

- plus menu

- image upload

- file upload

- camera

- voice input

- chat

- chat history

- settings

==================================================

50. DO NOT USE THESE COLORS

==================================================

Do NOT use:

blue

cyan

purple

pink

turquoise

bright green

The primary palette is:

BLACK

DARK BLACK

DEEP RED

NEON RED

METALLIC GOLD

Warm white may be used for readable text.

==================================================

51. VISUAL HIERARCHY

==================================================

The visual hierarchy should be:

1. 3D Nexus.ai logo

2. Welcome, I’m Nexus

3. AI questioning bar

4. Neural-network environment

5. Navigation controls

6. Secondary interface elements

The screen should not feel crowded.

==================================================

52. FINAL DESKTOP COMPOSITION

==================================================

The initial desktop screen should approximately resemble:

--------------------------------------------------

3D NEXUS.AI                         LOGIN PROFILE ☰

             [ subtle red/gold atmosphere ]

                  Welcome, I’m Nexus

             + Ask anything here..... 🎙

      red/gold futuristic neural network

      digital grid + particles + nodes

--------------------------------------------------

Maintain generous negative space.

==================================================

53. SPECIAL NEXUS IDENTITY

==================================================

The most important visual identity should be the combination:

3D metallic Nexus logo

+

black environment

+

deep-red energy

+

neon-red AI activity

+

metallic gold intelligence accents

The website should feel like the Nexus logo is the central AI core of the entire system.

Use the same visual language throughout the interface.

==================================================

54. FINAL QUALITY REQUIREMENT

==================================================

Before finishing, verify:

- no console errors

- no broken imports

- responsive layout works

- navigation works

- Login opens correctly

- Profile opens correctly

- Hamburger opens correctly

- Plus menu works

- Image upload works

- File upload works

- Camera has fallback

- Voice has fallback

- Enter submits messages

- Chat interface works

- Mock AI responses work

- Chat history works

- animations are smooth

- no horizontal scrolling

- 3D logo is visually polished

- black/red/gold palette is consistent

==================================================

55. FINAL DESIGN TARGET

==================================================

The final product should look like:

"Nexus.ai — a premium futuristic artificial intelligence command center powered by a glowing 3D neural core."

It should combine:

Luxury technology

+

Futuristic AI

+

Black metallic environment

+

Deep crimson energy

+

Neon-red intelligence signals

+

Metallic gold highlights

+

3D AI branding

+

Minimal sophisticated UI

Do not make it look like a generic AI chatbot.

Do not make it look like a generic SaaS template.

Make the design feel like a unique, recognizable product called:

Nexus.ai

Build the complete website now.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nexus-neural-pulse.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b11fc4d8-9a0b-449d-817d-bb4b51f79a6a).

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
