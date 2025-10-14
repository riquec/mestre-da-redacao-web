const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando teste Playwright no site de produção...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Desabilitar cache
    await page.setExtraHTTPHeaders({
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    
    console.log('📡 Acessando https://mestre-da-redacao.web.app/');
    await page.goto('https://mestre-da-redacao.web.app/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('🔍 Procurando por preços na página...');
    
    // Buscar todos os textos que contêm R$
    const allPrices = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const priceElements = [];
      
      elements.forEach(el => {
        if (el.textContent && el.textContent.includes('R$')) {
          priceElements.push({
            tag: el.tagName,
            text: el.textContent.trim(),
            className: el.className
          });
        }
      });
      
      return priceElements;
    });
    
    console.log('💰 Preços encontrados:');
    allPrices.forEach((price, index) => {
      console.log(`${index + 1}. ${price.tag}: "${price.text}"`);
    });
    
    // Verificar especificamente o preço do Plano Mestre
    try {
      const mestreCard = await page.locator('text=Plano Mestre').locator('..').locator('..');
      const mestreText = await mestreCard.textContent();
      console.log(`🎯 Texto completo do cartão Plano Mestre:`);
      console.log(mestreText);
      
      // Buscar especificamente por R$ no cartão do Plano Mestre
      const priceMatch = mestreText.match(/R\$\s*(\d+),(\d+)/);
      if (priceMatch) {
        console.log(`💰 Preço do Plano Mestre encontrado: R$${priceMatch[1]},${priceMatch[2]}`);
      }
    } catch (e) {
      console.log('❌ Erro ao buscar preço do Plano Mestre:', e.message);
    }
    
    // Verificar se há R$70 na página
    const hasOldPrice = await page.locator('text=/R\\$\\s*70/').count();
    console.log(`❌ Ocorrências de R$70: ${hasOldPrice}`);
    
    // Verificar se há R$100 na página
    const hasNewPrice = await page.locator('text=/R\\$\\s*100/').count();
    console.log(`✅ Ocorrências de R$100: ${hasNewPrice}`);
    
    // Tirar screenshot
    await page.screenshot({ path: '/tmp/mestre-pricing-test.png', fullPage: true });
    console.log('📸 Screenshot salvo em /tmp/mestre-pricing-test.png');
    
    // Verificar recursos carregados (chunks JS)
    const jsResources = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(script => script.src).filter(src => src.includes('page-'));
    });
    
    console.log('📦 JavaScript chunks carregados:');
    jsResources.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource}`);
    });
    
    // Verificar headers de cache
    const response = await page.goto('https://mestre-da-redacao.web.app/');
    const headers = response.headers();
    console.log('🔧 Headers de Cache:');
    console.log(`Cache-Control: ${headers['cache-control'] || 'não definido'}`);
    console.log(`Pragma: ${headers['pragma'] || 'não definido'}`);
    console.log(`Expires: ${headers['expires'] || 'não definido'}`);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
    console.log('🏁 Teste finalizado');
  }
})();