const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 3000;

const MAX_ID_LENGTH = 3;

function readJsonFileSync(filepath, encoding) {
  if (typeof encoding == "undefined") {
    encoding = "utf8";
  }
  const file = fs.readFileSync(filepath, encoding);
  return JSON.parse(file);
}

function getFile(file) {
  const filepath = path.join(__dirname, "..", "/lib/", file);
  return readJsonFileSync(filepath);
}

function padId(id) {
  const pad = MAX_ID_LENGTH - id.length;
  return new Array(pad).fill("0").join("") + id;
}

function getImageOptions(imageDir) {
  return {
    root: path.join(__dirname, "..", "lib", imageDir),
    dotfiles: "deny",
    headers: {
      "x-timestamp": Date.now(),
      "x-sent": true,
    },
  };
}

const data = getFile("pokedex.json");
const languages = {
  en: "english",
  jp: "japanese",
  cn: "chinese",
  fr: "french",
};

app.use(
  cors({
    origin:
      process.env.NODE_ENV == "development"
        ? "http://localhost:3001"
        : "https://poke-front.alanlai.app",
  })
);

app.get("/pokedex", (_, res) => {
  res.send(data);
});

app.get("/pokemon/:id", (req, res) => {
  const id = req.params.id;
  const pokemon = data.find((pokemon) => pokemon.id == id);
  if (!pokemon) res.status(404).send("Not found");
  const pokemonRes = structuredClone(pokemon);
  pokemonRes.image = `/image/${id}`;
  pokemonRes.sprite = `/sprite/${id}`;
  res.json(pokemonRes);
});

app.get("/pokemon/:language/:id", (req, res) => {
  const id = req.params.id;
  const pokemon = data.find((pokemon) => pokemon.id == id);
  const language = languages[req.params.language];
  if (!pokemon || !language) res.status(404).send("Not found");
  const pokemonRes = structuredClone(pokemon);
  pokemonRes.name = pokemon.name[language];
  pokemonRes.image = `/image/${id}`;
  pokemonRes.sprite = `/sprite/${id}`;
  res.json(pokemonRes);
});

app.get("/sprite/:id", (req, res) => {
  const id = req.params.id;
  const paddedId = padId(id);
  const fileName = `${paddedId}MS.png`;
  res.sendFile(fileName, getImageOptions("sprites"));
});

app.get("/image/:id", (req, res) => {
  const id = req.params.id;
  const paddedId = padId(id);
  const fileName = `${paddedId}.png`;
  res.sendFile(fileName, getImageOptions("images"));
});

app.get("/thumbnail/:id", (req, res) => {
  const id = req.params.id;
  const paddedId = padId(id);
  const fileName = `${paddedId}.png`;
  res.sendFile(fileName, getImageOptions("thumbnails"));
});

app.listen(port, () => {
  console.log(`Pokemon app listening on port ${port}`);
});
