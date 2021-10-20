const xlsx = require('xlsx');
const puppeteer = require('puppeteer');
const add_to_sheet = require('./add_to_sheet');
const axios = require('axios');
const fs = require('fs');

const workbook = xlsx.readFile('xlsx/data.xlsx');
const ws = workbook.Sheets.영화목록;
const records = xlsx.utils.sheet_to_json(ws);

fs.readdir('screenshot', (err) => {
    if (err) {
        console.log('screenshot 폴더가 없어 생성')
        fs.mkdirSync('screenshot');
    }
})
fs.readdir('poster', (err) => {
    if (err) {
        console.log('poster 폴더가 없어 생성')
        fs.mkdirSync('poster');
    }
})

const crawler = async () => {
    try{
        const browser = await puppeteer.launch({headless: process.env.NODE_ENV === 'production'});
        const page = await browser.newPage();
        add_to_sheet(ws, 'C1', 's', '평점');
        for (const [i, r] of records.entries()) {
            await page.goto(r.링크);

            const result = await page.evaluate(() => {
                const scoreEl = document.querySelector('.score.score_left .star_score');
                let score = '';
                if (scoreEl) {
                    score = scoreEl.textContent;
                }
                const imgEl = document.querySelector('.poster img');
                let img = '';
                if (imgEl) {
                    img = imgEl.src;
                }
                return { score, img };
            });
            if (result.score) {
                console.log(r.제목, '평점', result.score.trim());
                const newCell = 'C' +  (i + 2);
                add_to_sheet(ws, newCell, 'n', parseFloat(result.score.trim()));
            }
            if (result.img) {
                const imgResult = await axios.get(result.img.replace(/\?.*$/, ''), {
                    responseType: 'arraybuffer'
                });
                fs.writeFileSync(`poster/${r.제목}.jpg`, imgResult.data);
            }
            await page.waitForTimeout(1000);
        }
        await page.close();
        await browser.close();
        xlsx.writeFile(workbook, 'xlsx/result.xlsx');
    }catch (e) {
        console.error(e);
    }
};

crawler();
