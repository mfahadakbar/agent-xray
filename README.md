# Agent Xray

How does an AI agent really work? This is the X-ray. Click a part. See inside. Learn what it does. Find the tools.

**Try it:** https://mfahadakbar.github.io/agent-xray/

The idea is simple. Show an agent as one big picture, like a body with parts. Click a part and you go deeper. Keep clicking and you learn step by step.

It is free and open source. If it helps you, give it a ⭐. That is how other people find it.

![The start page: how does an AI agent really work?](docs/meet-ray.jpg)

## Why I built this

I don't have a PhD. I'm not a researcher in maths or computer science.

Yet I design, build and solve real-world problems with data science.

How?

One thing made the difference. I understood the bits and pieces of data science, and how to put them together. Once you know that, you start applying it to the problems around you. And you keep learning.

Fast forward to today. LLMs and AI agents can do a lot of that work now. But I believe the core is still the same.

If you know the bits and pieces of an AI agent, you can start solving problems with it. And you get better as you go.

That is where I want to help.

I built Agent Xray. It is an interactive X-ray of an AI agent. You click a part, like the brain, the memory, the tools or the guardrails. You see what it is and how it connects to the rest. All in plain and simple language.

I designed and directed it, and built it with an AI coding agent.

If you can help improve it, I would really appreciate it. Thank you!

[Fahad Akbar](https://github.com/mfahadakbar)

## Open it

**Online:** https://mfahadakbar.github.io/agent-xray/

**No install:** download `dist/index.html` and double-click it. It is one self-contained file. No server, no internet needed.

**To work on it:**

```bash
npm install
npm run dev        # http://localhost:5177
npm run build      # rebuilds dist/index.html
```

## What you get

**It is about agents, and Ray is the example.** The start page asks the question: how does an AI agent really work? Ray is a robot, and Ray is an AI agent. What is inside Ray is inside every agent. Move your mouse over Ray to peek, then turn on the X-ray. Ray has ten parts, and every part of an agent lives in one of them.

![Ray, X-rayed, with its ten parts](docs/home-xray.jpg)

The X-ray switch at the top right turns it off again and takes you back to the start page. So does `Esc`, and so does the logo.

| Part | What builders call it | Inside |
| --- | --- | --- |
| Brain | The model | Which model, instructions, messages and chat templates, context engineering, reasoning and reflection, fine-tuning |
| Heart | The agent loop | One run from start to finish, stop rules, retries, planning, kinds of agents, frameworks, low-code builders |
| Senses | Input and output | Images and sound, structured output, streaming, generated media |
| Memory | Memory and knowledge | Chat history, knowledge (RAG, knowledge graphs, corrective RAG), user memory, session state, learning, storage |
| Hands | Tools | Function calling, ready-made tools, code agents, custom tools, MCP, skills |
| Shield | Safety and control | Guardrails, hooks, human in the loop, permissions, threats, trust, signed receipts |
| Steps | Workflows | Sequence, parallel, condition, loop, router, workflow engines |
| Friends | Teams | Route, coordinate, broadcast, tasks, hand-off, group chat, agent protocols |
| Check-up | Evals and observability | Evals, tracing, metrics, online tests, benchmarks, cost control, first aid |
| Home | Runtime | Serving, interfaces, generative UI, schedules, background jobs, scaling, security, hosting |

**Watch a message travel.** Ask Ray a question on the home screen and follow the message through its body, part by part. Every stop leaves its number on Ray, so you can read the whole journey afterwards. Then switch Memory, Hands or the Shield off and ask again. What breaks tells you what the part is for.

![A message travelling through Ray](docs/playground.jpg)

**Give Ray a job.** Pick the kind of agent you want (a researcher, a support desk, a data analyst, a coding buddy, a voice helper…) and watch that job travel through Ray the same way a message does: one numbered stop after another, with a card at each part that says what happens there. The parts the job does not use go dim, and links take you straight into the ones it does.

![A data analyst's job, travelling through Ray](docs/jobs.jpg)

**Go deeper.** Click a part and you are inside it. Click again and you go further. The path from the idea works exactly as written:

**Ray → Memory → Knowledge → Vector database → Tools**

**Play, do not read.** Almost every box has something to play with: 58 small scenes, each built so a five-year-old could follow it. Guess the next word with the brain. Pack the context backpack until it overflows. Drag your question across the map of meaning. Send a trick message at the shield. Snap blocks together into a working agent. Pull the plug on Ray and see what storage saves.

![The vector database scene](docs/vector-database.jpg)

**You are here.** Some boxes are one stop on a longer trip. The rooms about documents (reading a file, cutting it into chunks, turning it into numbers, searching, reranking) all show the whole trip from book to answer, with the step you are on.

**Every step has a number.** Wherever something happens in an order, each stop carries a numbered tag: 1, 2, 3. Things that happen together share a number and get a letter: 2a, 2b, 2c. The caption shows the number of the step you are watching, and the tags stay on the picture, so the order can still be read when the animation is over.

![Step numbers on a team: the leader asks, three friends answer together, the leader picks](docs/steps.jpg)

**The same questions at every level,** as the idea asks:

- What is it? In simple words, or in builder words (one switch).
- Why it matters.
- What to keep in mind when you build it.
- What is possible today. What is not possible yet.
- Real tools, marked open source, free, free tier or paid, with the popular ones starred.

**Builders without code are covered too.** Heart → Build with blocks lists the low-code tools (n8n, Langflow, Flowise, Dify, Zapier Agents, Copilot Studio and more) and lets you build a small agent by snapping blocks together.

![Build with blocks](docs/low-code.jpg)

**Made for a phone too.** On a phone nothing is cut and nothing has to be zoomed. Every scene stands up to fit the screen, with its caption and its buttons, so the whole picture is in view while it plays. Ray's parts carry name tags you can tap. A story shows its numbered stops, and what each part says, right under Ray.

![Five phone screens: the start page, Ray with name tags, a job story, a team scene and the vector map](docs/phone.jpg)

**Extras**

- **Whole map** (press `/`): all 135 boxes on one screen, with search across parts and tools.
- **Progress**: the map remembers which boxes you opened.
- `Esc` goes up one level. Every page has its own address, so you can share a link to any box.

## Where the knowledge comes from

The map is general. It explains how agents work, not how one library works. Its shape and content were built from four sources:

| Source | What it gave the map |
| --- | --- |
| [Agno documentation](https://docs.agno.com/examples/introduction) | The backbone: agents, teams, workflows, memory, knowledge, hooks, guardrails, human in the loop, evals, runtime |
| [Microsoft: AI Agents for Beginners](https://github.com/microsoft/ai-agents-for-beginners) | Kinds of agents, design principles (transparency, control), threats, planning, metacognition, context failures, memory types, cost control, scaling, protocols, signed receipts |
| [Hugging Face Agents Course](https://huggingface.co/learn/agents-course/unit0/introduction) | Messages and chat templates, the think-act-observe cycle, code agents, fine-tuning for function calling, the GAIA benchmark, online evaluation |
| [awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | The jobs on the home screen, RAG variants (corrective, graph, multimodal, as a service), memory apps, voice agents, generative UI, token optimisation |

Agno appears only as one framework in the tool lists, next to the others.

Tool lists are a snapshot from October 2026: 327 tools, 273 links, all checked. Plans and prices change, so check a tool's own page before you choose.

## How it is built

React, TypeScript and Vite. No backend. The build is a single HTML file with scripts, styles and fonts inlined.

```
src/
  data/       the knowledge: one file per part of Ray. Edit these to change the map.
  ray/        Ray: the robot drawing, the X-ray layer, the wiring between parts
  views/      home screen, a room (one opened box), tool shelf, whole map, the journeys (flow.ts, jobs.ts)
  scenes/     the interactive scenes, one file per branch, built from scenes/kit.tsx
  lib/        routing, the X-ray switch, progress, small hooks
scripts/
  shoot.mjs   screenshot one page
  tour.mjs    visit every page and fail on any error
video/
  stage.html  the frame around the app in the intro video: headline, screen, where to find it
  make.mjs    plays the app and records the video
```

**Add a box.** Add a node to the right file in `src/data/`. Every node answers the same questions (`simple`, `builder`, `why`, `mind`, `today`, `notYet`) and may list `tools` and `children`.

**Add a job.** A job is a story in `src/views/jobs.ts`: a task, and a list of stops (`to` a part, a caption, and the card that part shows). The home screen plays it with the same engine as the message journey.

**Add a trip.** `src/data/trips.ts` lists the boxes of a longer trip in order. Every room on the list shows the route and where you are.

**Add a scene.** Write a component with the pieces in `src/scenes/kit.tsx`, `register()` it under a name, and put that name in the node's `scene` field. A scene is a 16:9 stage measured in percent, so it looks the same at any size. `name:variant` opens a scene in a given state.

**Make it fit a phone.** On a phone the stage stands up: 3:4 instead of 16:9, with bigger type. Nothing is cut and nothing has to be zoomed. A piece keeps its place from left to right and gets more room from top to bottom. When that is not good enough, give the piece its own place on the tall stage with `p`:

```tsx
<At x={80} y={30} w={30} p={{ x: 50, y: 110, w: 90 }}>…</At>   // beside Ray when wide, under Ray when tall
<Arrow from={[30, 26]} to={[66, 24]} p={{ from: [28, 50], to: [58, 47] }} />
```

The tall stage is 100 units wide and 133.33 tall. A scene with real geometry (a time line, a map) can ask `usePortrait()` and work out its own layout.

**Number the steps.** If a scene shows a process, tag it. Pass `step` to `<Scene>` to show the current step in the caption, and put a `<StepTag n={2} />` on each thing that takes a turn (`corner` pins it to a card, `now` lights the current one, `todo` dims the ones still to come). For actors that take several turns, `tagsFor()` and `<StepTags>` work the numbers out, and `stepName(2, i, size)` gives `2a`, `2b` for things that happen together.

**Check your work.** With `npm run dev` running:

```bash
node scripts/tour.mjs                    # all 135 pages, no console errors
PHONE=1 FIT=1 node scripts/tour.mjs      # the same on a phone screen, and nothing may be cut
```

`FIT=1` fails a page if a piece sticks out of its stage, if words are clipped by their box, or if the page is wider than the screen. `W` and `H` set the size of the screen.

**Make the intro video.** `video/make.mjs` plays the real app like a person would (it moves a pointer, clicks, drags, moves the camera and changes the headline) and records it. It needs `ffmpeg` and Google Chrome.

```bash
npm run build && npm run video     # → video/out/agent-xray-linkedin.mp4 (1080 × 1350) and poster.jpg
```

The shots are a list near the bottom of that file. `FROM=6 UNTIL=7 npm run video` records only shots 6 and 7.

**Put it online.** The website is the `gh-pages` branch, and that branch is just the `dist` folder. After a change: build, commit, push, then

```bash
npm run deploy             # sends dist/ to the gh-pages branch
```

## Good to know

- Made for a modern browser, on a desktop or a phone. Tested in Chrome on a desktop and on an iPhone. Firefox is not tested yet.
- It respects the "reduce motion" setting.
- Nothing is sent anywhere. Progress is kept in the browser only.

## Help improve it

Found a mistake, a dead link or a tool that is missing? Open an [issue](https://github.com/mfahadakbar/agent-xray/issues) or send a pull request. The knowledge is plain text in `src/data/`, so most fixes need no code.

## License

[MIT](LICENSE). Free to use, change and share.

The fonts built into the page (Fredoka, Nunito and JetBrains Mono) come with their own license, the SIL Open Font License.
