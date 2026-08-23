export type Attachment = {
  id: string;
  kind: "image" | "file";
  name: string;
  previewUrl?: string;
};

export type ChatRole = "user" | "nexus";

export type ChatMessageData = {
  id: string;
  role: ChatRole;
  text: string;
  time: string;
  attachments?: Attachment[];
};

export type Conversation = {
  id: string;
  title: string;
  day: "Today" | "Yesterday";
  messages: ChatMessageData[];
};

export const nowLabel = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const uid = () => Math.random().toString(36).slice(2, 10);

const KNOWN: Array<{ match: RegExp; answer: string }> = [
  {
    match: /artificial intelligence|what is ai\b/i,
    answer:
      "Artificial intelligence is the field of creating systems capable of performing tasks that normally require human intelligence — understanding language, recognising patterns, reasoning over data and making decisions. Modern systems learn statistical structure from very large datasets rather than following hand-written rules.",
  },
  {
    match: /quantum/i,
    answer:
      "Quantum computing encodes information in qubits, which can hold superpositions of 0 and 1 and become entangled with one another. Certain algorithms exploit that structure to explore many computational paths at once, which is why factoring, simulation and optimisation are the leading target problems.",
  },
  {
    match: /neural network/i,
    answer:
      "A neural network is a stack of layers, each applying a weighted transform and a non-linear activation. Training compares predictions to targets, then backpropagates the error to nudge every weight. Repeat over millions of samples and the layers learn hierarchical features on their own.",
  },
  {
    match: /python/i,
    answer:
      "Here is a compact example:\n\ndef fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b\n\nprint(list(fib(10)))\n\nIt streams Fibonacci numbers lazily instead of building the whole list first.",
  },
  {
    match: /machine learning/i,
    answer:
      "Machine learning is the practice of fitting models to data so behaviour is inferred rather than programmed. The three broad families are supervised learning from labelled examples, unsupervised learning of latent structure, and reinforcement learning from reward signals.",
  },
  {
    match: /recursion/i,
    answer:
      "Recursion is a function defined in terms of itself: a base case that terminates, and a recursive case that reduces the problem toward that base case. It shines on self-similar structures such as trees, parsers and divide-and-conquer algorithms.",
  },
];

/**
 * Single integration point for a real provider later. Swap the body for a
 * server-side call (never expose keys client-side) and the whole UI keeps working.
 */
export async function sendMessage(
  message: string,
  attachments: Attachment[] = [],
): Promise<string> {
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));

  const known = KNOWN.find((k) => k.match.test(message));
  const context = attachments.length
    ? `\n\nI have also registered ${attachments.length} attachment${
        attachments.length > 1 ? "s" : ""
      }: ${attachments.map((a) => a.name).join(", ")}.`
    : "";

  if (known) return known.answer + context;

  return (
    `Analysing "${message.trim()}" across my knowledge layers.\n\n` +
    "Here is the short version: break the question into the smallest verifiable parts, resolve each one against known constraints, then recombine the results. Tell me which part you want expanded and I will go deeper — mechanism, trade-offs, or a worked example." +
    context
  );
}
