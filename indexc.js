// const parse = require('csv-parse/lib/sync');
// const fs = require('fs');

// const csv = fs.readFileSync('csv/data.csv');
//
// const records = parse(csv.toString('utf-8'));
//
// records.forEach((r, i) => {
//     console.log(i, r)
// })
const xlsx = require('xlsx');
const axios = require('axios');
const cheerio = require('cheerio');
const add_to_sheet = require('./add_to_sheet');

const workbook = xlsx.readFile('xlsx/data.xlsx');
const ws = workbook.Sheets.영화목록;

console.log(ws['!ref'])
ws['!ref'] = ws['!ref'].split(':').map((v,i) => {
    if (i === 0) return 'A2';
    return  v;
}).join(':');
const records = xlsx.utils.sheet_to_json(ws, { header: 'A' });
const crawler = async () => {
    add_to_sheet(ws,'C1', 's', '평점');
    for(const [i,r] of records.entries()) {
        const response = await axios.get(r.링크);
        if (response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);
            const text = $('.score.score_left .star_score').text();
            console.log(r.제목 , '평점',text.trim())
            const newCell = 'C'+ (i + 2);
            add_to_sheet(ws, newCell,'n',parseFloat(text.trim()))
        }
    }
    xlsx.writeFile(workbook, 'xlse/result.xlsx');
    // await Promise.all(records.map( async (r) => {
    //     const response = await axios.get(r.링크);
    //     if (response.status === 200) {
    //         const html = response.data;
    //         // console.log(html);
    //         const $ = cheerio.load(html);
    //         const text = $('.score.score_left .star_score').text();
    //         console.log(r.제목 , '평점',text.trim())
    //     }
    // }))
}

crawler();
