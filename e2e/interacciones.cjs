// Pruebas de interacción de punta a punta con Playwright.
// Uso: pnpm build && pnpm start  (en otra terminal)  →  pnpm e2e
// Requiere un navegador de Playwright: npx playwright install chromium
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "es-VE" });
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  const state = async () => JSON.parse(await page.evaluate(() => localStorage.getItem("calendario:v1"))).state;
  const ev = async title => (await state()).events.find(e => e.title === title);
  let failed = 0;
  const ok = (name, cond, extra = "") => { if (!cond) failed++; console.log(cond ? "✅" : "❌", name, extra); };
  await page.goto(process.env.BASE_URL ?? "http://localhost:3000", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Semana" }).click();
  await page.waitForTimeout(400);

  // 1. Arrastrar "Odontólogo" 1 hora abajo y 1 día a la derecha
  const before = await ev("Odontólogo");
  const chip = page.getByRole("button", { name: /Odontólogo/ }).first();
  const box = await chip.boundingBox();
  const colW = (await page.locator("div.grid.flex-1").last().boundingBox()).width / 7;
  await page.mouse.move(box.x + 30, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + 40, box.y + 20, { steps: 3 });
  await page.mouse.move(box.x + 30 + colW, box.y + 10 + 52, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await ev("Odontólogo");
  const diffH = (new Date(after.start) - new Date(before.start)) / 3600000;
  ok("arrastrar mueve 1 día + 1 hora", diffH === 25, `(${diffH}h)`);

  // 2. Redimensionar "Almuerzo con Andrea" +30 min
  const lunch = await ev("Almuerzo con Andrea");
  const lb = await page.getByRole("button", { name: /Almuerzo con Andrea/ }).first().boundingBox();
  await page.mouse.move(lb.x + 40, lb.y + lb.height - 3);
  await page.mouse.down();
  await page.mouse.move(lb.x + 40, lb.y + lb.height - 3 + 26, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const lunch2 = await ev("Almuerzo con Andrea");
  const durDiff = ((new Date(lunch2.end) - new Date(lunch2.start)) - (new Date(lunch.end) - new Date(lunch.start))) / 60000;
  ok("redimensionar suma 30 min", durDiff === 30, `(${durDiff} min)`);
  ok("redimensionar no abre el diálogo", !(await page.getByRole("dialog").isVisible().catch(() => false)));

  // 3. Crear arrastrando en un espacio libre del domingo 15:00 → 16:30
  const cols = page.locator("div.grid.flex-1").last();
  const cb = await cols.boundingBox();
  const sunX = cb.x + colW * 6.5;
  const scroller = page.locator(".overflow-y-auto").first();
  const scrollTop = await scroller.evaluate(el => el.scrollTop);
  const yAt = min => cb.y + min * (52 / 60);
  await page.mouse.move(sunX, yAt(15 * 60 + 5));
  await page.mouse.down();
  await page.mouse.move(sunX, yAt(16 * 60 + 30), { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const dlg = page.getByRole("dialog");
  ok("arrastrar en vacío abre el diálogo", await dlg.isVisible());
  const startVal = await dlg.locator('input[type="time"]').first().inputValue();
  const endVal = await dlg.locator('input[type="time"]').nth(1).inputValue();
  ok("rango 15:00–16:30 en el formulario", startVal === "15:00" && endVal === "16:30", `(${startVal}–${endVal})`);

  // 4. Validación y guardado
  await dlg.getByRole("button", { name: "Crear evento" }).click();
  ok("valida título vacío", await dlg.getByRole("alert").isVisible());
  await dlg.getByPlaceholder("Por ejemplo, revisión de diseño").fill("Prueba E2E");
  await dlg.getByText("Social", { exact: true }).click();
  await dlg.getByRole("button", { name: "Crear evento" }).click();
  await page.waitForTimeout(300);
  const created = await ev("Prueba E2E");
  ok("crea el evento", !!created && created.categoryId === "social");
  ok("se ve en la grilla", await page.getByRole("button", { name: /Prueba E2E/ }).isVisible());

  // 5. Editar y eliminar con deshacer
  await page.getByRole("button", { name: /Prueba E2E/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();
  await page.waitForTimeout(200);
  ok("elimina", !(await ev("Prueba E2E")));
  await page.getByRole("button", { name: "Deshacer" }).click();
  await page.waitForTimeout(200);
  ok("deshacer restaura", !!(await ev("Prueba E2E")));

  // 6. Atajos y búsqueda
  await page.keyboard.press("m");
  ok("atajo M → vista mes", (await page.getByRole("tab", { name: "Mes" }).getAttribute("aria-selected")) === "true");
  await page.keyboard.press("/");
  await page.getByRole("dialog").getByRole("textbox").fill("odonto");
  ok("búsqueda sin tildes encuentra 'Odontólogo'", await page.getByRole("dialog").getByText("Odontólogo").isVisible());
  await page.keyboard.press("Escape");
  await page.keyboard.press("?");
  ok("atajo ? abre ayuda", await page.getByRole("dialog").getByText("Atajos de teclado").isVisible());
  await page.keyboard.press("Escape");

  // 7. Arrastrar en vista mes: "Entrega de propuesta" un día adelante
  const retro = await ev("Entrega de propuesta");
  const rc = page.getByRole("button", { name: /Entrega de propuesta/ }).first();
  const rb = await rc.boundingBox();
  const cellW = rb.width + 8;
  await page.mouse.move(rb.x + 20, rb.y + 5);
  await page.mouse.down();
  await page.mouse.move(rb.x + 30, rb.y + 8, { steps: 3 });
  await page.mouse.move(rb.x + 20 + (await page.locator("div.grid.min-h-0.flex-1.grid-cols-7 > div").first().boundingBox()).width, rb.y + 30, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const retro2 = await ev("Entrega de propuesta");
  const dd = (new Date(retro2.start) - new Date(retro.start)) / 86400000;
  ok("mes: arrastrar mueve 1 día manteniendo la hora", dd === 1, `(${dd} días)`);

  // 8. Filtro de categoría y cambio de idioma
  await page.getByText("Trabajo", { exact: true }).click();
  ok("ocultar categoría la quita de la vista", (await page.getByRole("button", { name: /Entrega de propuesta/ }).count()) === 0);
  await page.getByRole("button", { name: "Tema" }).click();
  await page.getByRole("menuitemradio", { name: "English" }).click();
  await page.waitForTimeout(200);
  ok("cambia a inglés (UI + categorías)", await page.getByRole("tab", { name: "Month" }).isVisible() && await page.getByText("Work", { exact: true }).isVisible());

  // 9. Persistencia tras recargar
  await page.reload({ waitUntil: "networkidle" });
  ok("persiste idioma y datos al recargar", await page.getByRole("tab", { name: "Month" }).isVisible() && !!(await ev("Prueba E2E")));

  console.log("errores de página:", JSON.stringify(errors));
  await browser.close();
  process.exit(failed || errors.length ? 1 : 0);
})();
