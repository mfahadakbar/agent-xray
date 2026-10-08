import type { Organ } from './types';

export const senses: Organ = {
  id: 'senses',
  part: 'Senses',
  color: '#ffd75e',
  title: 'Senses',
  aka: 'Input and output',
  icon: '👀',
  tagline: 'How Ray listens, looks and talks.',
  scene: 'eyes-ears',
  simple: [
    'Ray has eyes, ears and a mouth.',
    'Through them, things come in: your words, a photo, a sound, a file.',
    'And things go out: an answer, a tidy form, a picture, a voice.',
  ],
  builder: [
    'Input is whatever you pass to a run: text, images, audio, video, files, or a typed object. Output is what comes back: free text, a validated structure, generated media, or a stream of events.',
    'What is possible depends on the model. Each model supports its own mix of input and output types.',
  ],
  why: 'An agent is only as useful as what it can take in and what it can hand back.',
  mind: [
    'Check what your model accepts before you design around it.',
    'Images, audio and video use far more tokens than text.',
    'If another program reads the answer, ask for a structure, not prose.',
  ],
  today: [
    'Models that read text, images, audio, video and PDFs.',
    'Answers as text, strict JSON, speech or images.',
  ],
  notYet: [
    'Fine detail in images, like small text or exact counts, is still unreliable.',
    'Long video is expensive and often sampled, not fully watched.',
  ],
  children: [
    {
      id: 'seeing-hearing',
      title: 'Eyes and ears',
      aka: 'Multimodal input',
      icon: '🖼️',
      tagline: 'Ray can look at pictures and listen to sound.',
      scene: 'eyes-ears',
      simple: [
        'Some brains only read words.',
        'Others can also look at a photo, listen to a recording, or read a whole file.',
      ],
      builder: [
        'Multimodal models accept images, audio, video and documents next to text. Where the model cannot, a tool converts first: speech to text, OCR, or a description from a vision model.',
        'Media can be sent as bytes, as a link, or uploaded once and referenced.',
      ],
      why: 'The world is not made of text. Receipts, screenshots, voice notes and charts are everywhere.',
      mind: [
        'Resize images. Huge ones cost more and rarely help.',
        'Store media in file storage, not in your chat database.',
        'A transcript is cheaper than raw audio if you only need the words.',
      ],
      today: ['Reading screenshots, charts and handwriting.', 'Understanding speech with tone, not only words.'],
      notYet: ['Counting objects and reading tiny text reliably.'],
      tools: [
        { name: 'Vision-capable models', what: 'Most top models from OpenAI, Anthropic and Google read images.', cost: 'paid', popular: true },
        { name: 'Whisper', what: 'Open speech-to-text. Run it yourself.', cost: 'open', popular: true, url: 'https://github.com/openai/whisper' },
        { name: 'Deepgram', what: 'Fast hosted speech-to-text.', cost: 'freemium', url: 'https://deepgram.com' },
        { name: 'AssemblyAI', what: 'Hosted transcription with speaker labels.', cost: 'freemium', url: 'https://www.assemblyai.com' },
        { name: 'ElevenLabs', what: 'Speech in and speech out.', cost: 'freemium', popular: true, url: 'https://elevenlabs.io' },
        { name: 'Docling', what: 'Turns documents and scans into text a model can read.', cost: 'open', url: 'https://github.com/docling-project/docling' },
      ],
    },
    {
      id: 'structured',
      title: 'Tidy boxes',
      aka: 'Structured output · schemas',
      icon: '🗃️',
      tagline: 'Make Ray fill in a form, the same way every time.',
      scene: 'tidy-boxes',
      simple: [
        'People like stories. Computers like forms.',
        'So we give Ray a form with boxes: name, price, date.',
        'Ray fills in every box, every time.',
      ],
      builder: [
        'You define a schema (a Pydantic model, a Zod object, or JSON Schema) and the model is constrained to return data that matches it. You get a validated object instead of a string.',
        'The same idea works for input: a typed request that is validated before the agent runs.',
        'When a model cannot do it natively, a second "parser" model can convert free text into the schema.',
      ],
      why: 'Code cannot read prose. Structure is how an agent plugs into the rest of your software.',
      mind: [
        'Name fields clearly and describe them. The model reads your schema as instructions.',
        'Keep schemas small and flat. Deep nesting causes mistakes.',
        'Valid shape does not mean true content. Still check the values.',
      ],
      today: ['Guaranteed valid JSON from the main model APIs.', 'Typed input and output from one definition.'],
      notYet: ['A perfect form can still hold a wrong answer.'],
      tools: [
        { name: 'Pydantic', what: 'Schemas and validation for Python.', cost: 'open', popular: true, url: 'https://docs.pydantic.dev' },
        { name: 'Zod', what: 'Schemas and validation for TypeScript.', cost: 'open', popular: true, url: 'https://zod.dev' },
        { name: 'JSON Schema', what: 'The standard both of them compile to.', cost: 'open', url: 'https://json-schema.org' },
        { name: 'Native structured outputs', what: 'Built into the OpenAI, Anthropic and Gemini APIs.', cost: 'paid', popular: true },
        { name: 'Instructor', what: 'Typed outputs from any model, with retries.', cost: 'open', popular: true, url: 'https://python.useinstructor.com' },
        { name: 'Outlines', what: 'Forces local models to follow a schema.', cost: 'open', url: 'https://github.com/dottxt-ai/outlines' },
        { name: 'BAML', what: 'A small language for typed model functions.', cost: 'open', url: 'https://www.boundaryml.com' },
      ],
      code: `class Restaurant(BaseModel):
    name: str
    address: str
    closes_at: str
    stars: int

result = agent.run("Tell me about Luigi's", output_schema=Restaurant)
result.stars   # 4  ← a real number, not a sentence`,
    },
    {
      id: 'streaming',
      title: 'Word by word',
      aka: 'Streaming · events',
      icon: '🌊',
      tagline: 'See the answer as Ray thinks of it.',
      scene: 'streaming',
      simple: [
        'Ray can wait until the whole answer is ready. That feels slow.',
        'Or Ray can say each word as soon as it thinks of it.',
        'The total time is the same. The waiting feels much shorter.',
      ],
      builder: [
        'The runtime emits events as they happen: text deltas, tool call started and finished, reasoning, run completed. A client renders them live, usually over server-sent events or a WebSocket.',
        'Events are also how you show progress: "searching the web…", "reading 3 files…".',
      ],
      why: 'People forgive a slow answer they can watch arrive. They do not forgive a blank screen.',
      mind: [
        'Once a word is shown you cannot take it back. Output checks must run before, or accept that.',
        'Structured output cannot be used until it is complete. Stream progress instead.',
        'Plan for dropped connections. Let clients reconnect to a running job.',
      ],
      today: ['Live text, tool activity and thinking in the UI.', 'Reconnecting to a run that is still in progress.'],
      notYet: ['Checking an answer for safety while it streams is still awkward.'],
    },
    {
      id: 'making',
      title: 'Making pictures and sound',
      aka: 'Generating media',
      icon: '🎨',
      tagline: 'Ray can draw, speak and make video.',
      simple: [
        'Ray does not only write.',
        'With the right helper, Ray can draw a picture, read an answer out loud, or make a short video.',
      ],
      builder: [
        'Media is usually produced by a tool that calls a specialist model: image, speech, music or video generation. The agent writes the prompt and gets a file back.',
        'Some models can produce images or audio directly as part of their reply.',
      ],
      why: 'A chart, a voice or an image is often the better answer.',
      mind: [
        'Generation is slow and costs more than text. Do it on purpose.',
        'Save the files in storage and pass links around, not bytes.',
        'Check licenses and content rules for what you generate.',
      ],
      today: ['High-quality images and natural speech in seconds.', 'Short video clips from a prompt.'],
      notYet: ['Exact control: the same character twice, correct text inside an image, long coherent video.'],
      tools: [
        { name: 'OpenAI image and audio models', what: 'Images, speech and real-time voice.', cost: 'paid', popular: true, url: 'https://platform.openai.com' },
        { name: 'Google Imagen / Veo', what: 'Image and video generation.', cost: 'paid', url: 'https://ai.google.dev' },
        { name: 'FLUX', what: 'Image models with open and hosted versions.', cost: 'freemium', popular: true, url: 'https://bfl.ai' },
        { name: 'Stable Diffusion', what: 'Open image models you can run yourself.', cost: 'open', url: 'https://stability.ai' },
        { name: 'ElevenLabs', what: 'Natural voices and voice cloning.', cost: 'freemium', popular: true, url: 'https://elevenlabs.io' },
        { name: 'Cartesia', what: 'Very fast text-to-speech.', cost: 'freemium', url: 'https://cartesia.ai' },
        { name: 'Replicate / fal', what: 'Run thousands of media models through one API.', cost: 'paid', url: 'https://replicate.com' },
      ],
    },
  ],
};
