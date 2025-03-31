const { shell } = require('electron');

const parser: DOMParser = new DOMParser();


const parseResponse = (text: string): Document => {
    return parser.parseFromString(text, 'text/html');
};

console.log("parser ", parseResponse("<html><body></body></html>"));

