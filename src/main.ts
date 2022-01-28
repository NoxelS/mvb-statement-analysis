import { appendFileSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import PdfParse from 'pdf-parse';


async function main() {
    // Read all pdf files
    const paths = readdirSync('./documents');
    const results: PdfParse.Result[] = [];
    for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        const buffer = readFileSync('./documents/' + path);
        const data = await PdfParse(buffer);
        results.push(data);
    }

    writeFileSync('data.txt', '');
    let einkünfte = 0;
    let ausgaben = 0;
    let authorData = {};
    results.forEach(result => {
        const lines = result.text.split(/\r?\n/g);
        const indexOfWertVorgang = lines.findIndex(value => value.indexOf('WertVorgang') !== -1);
        const arrayWithoutPreword = lines.slice(indexOfWertVorgang, lines.length);



        arrayWithoutPreword.forEach((line, index) => {
            if (line.substring(0, 5).match(/\d{2}(\.|-)\d{2}/)) {
                const author = (arrayWithoutPreword[index + 1]);
                const betrag = line.substring(line.length - 10, lines.length).replace(/ /g, '');

                const betragNumber = Number(betrag.replace('H', '').replace('S', '').replace(/\./g, '').replace(/,/g, '.'));
                if (authorData[author]) {
                    authorData[author] += betragNumber;
                } else {
                    authorData[author] = betragNumber;
                }

                if (betrag.split('')[betrag.length - 1] == 'H') {
                    const einkunft = Number(betrag.replace('H', '').replace(/\./g, '').replace(/,/g, '.'));
                    einkünfte += einkunft;
                } else if (betrag.split('')[betrag.length - 1] == 'S') {
                    const ausgabe = Number(betrag.replace('S', '').replace(/\./g, '').replace(/,/g, '.'));
                    ausgaben += ausgabe;
                }

                appendFileSync('data.txt', line + '\r\n' + arrayWithoutPreword[index + 1] + '\r\n' + arrayWithoutPreword[index + 2] + '\r\n');
            }
        });
    });
    const allEntries = Object.keys(authorData).map(key => ({ name: key, value: authorData[key] })).sort((a, b) => a.value - b.value).filter(entry => {
        return entry.name.indexOf('Übertrag') == -1 && entry.name.indexOf('HABENZINSEN') == -1;
    })

    console.table(allEntries)
    console.log(einkünfte);
    console.log(ausgaben);
    console.log(einkünfte - ausgaben);
}

main();
