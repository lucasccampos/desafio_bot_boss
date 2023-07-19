import puppeteer from "puppeteer";
import { promises as fs } from "fs";

const TURTLES_URL = "https://www.scrapethissite.com/pages/frames/";

// Se der tempo adiciono comentarios

const main = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(TURTLES_URL);
    await page.setViewport({ width: 1280, height: 720 });

    const content_iframe = await (await page.waitForSelector("iframe", { timeout: 5_000, visible: true })).contentFrame();

    const frame_origin_url = await content_iframe.evaluate("window.location.origin");

    const turtles_urls = await content_iframe.$$eval(".turtle-family-card", (nodes) => nodes.map((el) => el.querySelector("a").getAttribute("href")));

    let result = await Promise.all(
      turtles_urls.map(async (turtle_url) => {
        const new_page = await browser.newPage();
        await new_page.goto(frame_origin_url + turtle_url);

        const turtle_details = await new_page.$eval(".turtle-family-detail", (node) => ({
          family_name: node.querySelector(".family-name").textContent,
          description: node.querySelector(".lead").textContent,
          img_src: node.querySelector("img").getAttribute("src"),
        }));

        await new_page.close();

        return turtle_details;
      })
    );

    await fs.writeFile("turtles.json", JSON.stringify(result, null, 4), { flag: "w" });
  } catch (error) {
    console.log(error);
  }
  await browser.close();
};

main();
