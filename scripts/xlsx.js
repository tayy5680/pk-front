import { writeFile, unlinkSync } from "fs";
import xlsx from "xlsx";
const { readFile } = xlsx;

const SHEETS_LABEL = "PK_FRONT";
const KEY_CODE = "key";

const parseXlsx = (file) => {
  const data = readFile(file);
  const character = [];
  const target = Object.entries(data.Sheets[SHEETS_LABEL]).reduce(
    (acc, cur) => {
      const [key, value] = cur;

      if (!value) return acc;

      const int = key.match(/\d+/)?.[0];
      const type = key.match(/[A-Z]/)?.[0];
      if (!int || !type) return acc;

      if (int === "1") {
        const key = value.v.match(/(?<=:)\S+$/);
        acc[key] = {};
        character.push(type);
        return acc;
      }

      const curIndex = character.indexOf(type);
      const curKey = Object.keys(acc)[curIndex];
      acc[curKey][int] = value.v;
      return acc;
    },
    {}
  );

  for (const [key, value] of Object.entries(target)) {
    if (key === KEY_CODE) continue;

    const json = {};
    for (const [subkey, subvalue] of Object.entries(target[KEY_CODE])) {
      json[subvalue] = value[subkey];
    }

    writeFile(`./src/i18n/${key}.json`, JSON.stringify(json), function () {});
  }

  unlinkSync(file);
};

parseXlsx("./xlsx.xlsx");
