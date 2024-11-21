import { writeFile } from 'fs';
import data from './nodes.json' with {type: 'json'};

let result = data.filter(({ cp }) => cp == 0).map(({ id }) => id);
let json = JSON.stringify(result);
let fileName = 'owned.json';
writeFile(fileName, json, error => console.log(error ? error : "File written", fileName));