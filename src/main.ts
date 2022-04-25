import localforage from "localforage";
import "./style.css";

const button = document.querySelector<HTMLButtonElement>("#hi")!;
const submit = document.querySelector<HTMLButtonElement>("#submit")!;
const header = document.querySelector<HTMLHeadingElement>("#prompt")!;
const text = document.querySelector<HTMLTextAreaElement>("#input")!;
const app = document.querySelector<HTMLDivElement>("#app")!;

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
const DEFAULT_HEAD= "Hi. Welcome to Catharsis."
const init = async () => {
  header.innerText = DEFAULT_HEAD;
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

const next = async () => {
  if (currentQ === -1) {
    currentE = await addNewEntry();
  } else {
    await addQA(currentE, questions[currentQ], text.value);
  }

  text.value = "";
  if (++currentQ >= questions.length) {
    currentQ = -1;
    await endEntry(currentE);
    currentE = -1;
    header.innerText=DEFAULT_HEAD
    return;
  }

  header.innerText = questions[currentQ];
};

await init();
button.addEventListener("click", next);
