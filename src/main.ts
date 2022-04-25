import localforage from "localforage";
import "./style.css";

const button = document.querySelector<HTMLButtonElement>("#hi")!;
const submit = document.querySelector<HTMLButtonElement>("#submit")!;
const header = document.querySelector<HTMLHeadingElement>("#prompt")!;
const text = document.querySelector<HTMLTextAreaElement>("#input")!;
const app = document.querySelector<HTMLDivElement>("#app")!;
const initialMusic = document.querySelector<HTMLAudioElement>("#initialMusic")!;
const musicLoop = document.querySelector<HTMLAudioElement>("#musicLoop")!;

// 20 seconds
const INTERVAL = 20 * 1000;
const CONTINUE = "Anything else? If not, say 'no' or press continue.";

const questions = [
  "How was your day?",
  "How are you feeling today?",
  "Why do you think you feel this way?",
];

interface Entry {
  date: number;
  duration: number;
  session: Map<string, string>;
}

const ENTRIES_KEY = "catharsis_entries";

localforage.config({
  name: "Catharsis",
});

const ls = localforage;
const DEFAULT_HEAD = "Hi. Welcome to Catharsis.";

const displayText = (text: string) => {
  header.innerText = text;
};

const init = async () => {
  displayText(DEFAULT_HEAD);
  if (!(await ls.getItem(ENTRIES_KEY))) {
    ls.setItem(ENTRIES_KEY, []);
  }
};

const getEntries = async () => {
  const load = await ls.getItem(ENTRIES_KEY);
  return load as Entry[];
};

const getEntryByIdx = async (id: number) => {
  const entries = await getEntries();
  return entries[id];
};

const addNewEntry = async () => {
  const entries = await getEntries();
  const idx =
    entries.push({ date: Date.now(), duration: -1, session: new Map() }) - 1;
  await ls.setItem(ENTRIES_KEY, entries);
  return idx;
};

const editEntry = async (id: number, entry: Entry) => {
  const entries = await getEntries();
  entries[id] = entry;
  await ls.setItem(ENTRIES_KEY, entries);
  return entry;
};

const addQA = async (id: number, question: string, answer: string) => {
  const entry = await getEntryByIdx(id);
  entry.session.set(question, answer);
  await editEntry(id, entry);
};

const endEntry = async (id: number) => {
  const entry = await getEntryByIdx(id);
  entry.duration = Date.now() - entry.date;
  return await editEntry(id, entry);
};

let currentQ = -1;
let currentE = -1;
let ac = new AbortController();
let time: number;

const stopTime = () => {
  if (time) {
    clearTimeout(time);
  }
};

const resetTime = () => {
  stopTime();
  time = setTimeout(() => {
    displayText(CONTINUE);
  }, INTERVAL) as unknown as number;
};

const next = async () => {
  if (currentQ === -1) {
    currentE = await addNewEntry();
    ac = new AbortController();

    text.addEventListener(
      "keypress",
      () => {
        resetTime();
      },
      { signal: ac.signal }
    );
  } else {
    await addQA(currentE, questions[currentQ], text.value);
  }

  text.value = "";
  if (++currentQ >= questions.length) {
    ac.abort();
    stopTime();
    currentQ = -1;
    await endEntry(currentE);
    currentE = -1;
    displayText(DEFAULT_HEAD);

    return;
  }
  resetTime();
  displayText(questions[currentQ]);
};

await init();
button.addEventListener("click", next);


initialMusic.addEventListener(
  "ended",
  () => {
    musicLoop.play();
  },
  { once: true }
);
