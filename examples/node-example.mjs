import { classifyText } from "../dist/snip.js";

const paste = `from fastapi import FastAPI

app = FastAPI()

@app.get("/notes/{note_id}")
def read_note(note_id: int):
    return {"note_id": note_id}
`;

console.log(classifyText(paste));
